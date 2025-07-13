// File: app/api/clients/[id]/send-qr-email/route.ts
// API endpoint to send QR code via email to client

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { sendQRCodeEmail } from "@/lib/email-service"
import { getEmployeeByAuth } from "@/lib/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    
    if (isNaN(clientId)) {
      return NextResponse.json({ success: false, error: "Invalid client ID" }, { status: 400 })
    }

    // Get request body to check if QR code data is provided
    const requestBody = await request.json().catch(() => ({}))
    
    console.log(`📧 Processing QR code email request for client ${clientId}`)

    // Get current user for authentication
    const requestUserEmail = request.headers.get("x-user-email") || undefined
    const firebaseUid = request.headers.get("x-firebase-uid") || undefined

    let currentUser = null
    if (firebaseUid) {
      currentUser = await getEmployeeByAuth(firebaseUid)
    } else if (requestUserEmail) {
      currentUser = await getEmployeeByAuth(undefined, requestUserEmail)
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`👤 Authenticated user: ${currentUser.name} (${currentUser.email})`)

    // Verify client exists and get client data
    const clientResult = await query(
      `SELECT id, business_name, contact_name, contact_email, sales_rep_id 
       FROM business_clients 
       WHERE id = $1`,
      [clientId]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Client not found or inactive" 
      }, { status: 404 })
    }

    const client = clientResult.rows[0]
    console.log(`🏢 Found client: ${client.business_name}`)

    // Check if user has permission to manage this client
    const canManageClient = 
      currentUser.role === "super_admin" || 
      currentUser.role === "admin" ||
      client.sales_rep_id === currentUser.id

    if (!canManageClient) {
      return NextResponse.json({ 
        success: false, 
        error: "You don't have permission to manage this client" 
      }, { status: 403 })
    }

    if (!client.contact_email) {
      return NextResponse.json({ 
        success: false, 
        error: "Client has no email address on file" 
      }, { status: 400 })
    }

    // Use QR code data from request body if provided, otherwise get/generate it
    let qrImagePath = requestBody.qrCodeDataURL || null

    if (!qrImagePath) {
      // Get or generate QR code for this client
      let qrResult = await query(
        `SELECT qr_code_url, qr_image_path 
         FROM client_qr_codes 
         WHERE client_id = $1 AND qr_type = 'business_profile' AND is_active = true`,
        [clientId]
      )

      if (qrResult.rows.length === 0) {
        // Generate new QR code
        console.log("📱 No existing QR code found, generating new one...")
        
        try {
          const generateResponse = await fetch(`/api/clients/${clientId}/qr-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!generateResponse.ok) {
            throw new Error(`Failed to generate QR code: ${generateResponse.statusText}`)
          }

          const generateResult = await generateResponse.json()
          if (!generateResult.success) {
            throw new Error(generateResult.error || 'Failed to generate QR code')
          }

          qrImagePath = generateResult.data.qrCodeDataURL
          console.log("✅ QR code generated successfully")
        } catch (qrError) {
          console.error("❌ Error generating QR code:", qrError)
          return NextResponse.json({ 
            success: false, 
            error: "Failed to generate QR code for email attachment" 
          }, { status: 500 })
        }
      } else {
        // Use existing QR code
        qrImagePath = qrResult.rows[0].qr_image_path
        console.log("✅ Using existing QR code")
      }
    } else {
      console.log("✅ Using QR code data from request")
    }

    if (!qrImagePath) {
      return NextResponse.json({ 
        success: false, 
        error: "Unable to retrieve QR code for email attachment" 
      }, { status: 500 })
    }

    // Send the QR code email
    console.log(`📤 Sending QR code email to ${client.contact_email}...`)
    
    const emailResult = await sendQRCodeEmail(clientId, qrImagePath, currentUser.id)

    if (!emailResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: emailResult.error || "Failed to send QR code email" 
      }, { status: 500 })
    }

    console.log(`✅ QR code email sent successfully to ${client.contact_email}`)

    return NextResponse.json({
      success: true,
      message: `QR code email sent successfully to ${client.contact_email}`,
      data: {
        clientName: client.business_name,
        clientEmail: client.contact_email,
        messageId: emailResult.messageId,
        attachmentCount: emailResult.attachmentCount,
        sentBy: currentUser.name
      }
    })

  } catch (error) {
    console.error("❌ Error in QR code email endpoint:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      },
      { status: 500 }
    )
  }
}