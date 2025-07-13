// File: app/api/clients/[id]/qr-code/route.ts
// Simple QR code generation - no complex authentication

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { generateBusinessQR } from "@/lib/qr-service"

// POST /api/clients/[id]/qr-code - Generate QR code for business client
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    console.log(`🔄 Generating QR code for client ${clientId}`)

    // Get business details
    const businessResult = await query(
      `SELECT 
        bc.id,
        bc.business_name,
        bc.business_address,
        bc.place_id,
        bl.address as location_address,
        bl.city,
        bl.state,
        bl.postal_code
       FROM business_clients bc
       LEFT JOIN business_locations bl ON bc.id = bl.business_client_id AND bl.is_primary = true
       WHERE bc.id = $1`,
      [clientId]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Business client not found" },
        { status: 404 }
      )
    }

    const business = businessResult.rows[0]

    // Generate QR code using the updated service
    const qrResult = await generateBusinessQR(clientId, business.business_name)

    if (!qrResult.success) {
      return NextResponse.json(
        { success: false, error: qrResult.error || "Failed to generate QR code" },
        { status: 500 }
      )
    }

    // Format business address for display
    let businessAddress = business.business_address
    if (!businessAddress && business.location_address) {
      const addressParts = [
        business.location_address,
        business.city,
        business.state,
        business.postal_code
      ].filter(Boolean)
      businessAddress = addressParts.join(', ')
    }

    return NextResponse.json({
      success: true,
      data: {
        qrUrl: qrResult.qrUrl,
        qrCodeDataURL: qrResult.qrCodeDataURL,
        placeId: qrResult.placeId,
        businessLocationId: qrResult.businessLocationId,
        businessName: business.business_name,
        businessAddress: businessAddress || null
      },
      message: "QR code generated successfully"
    })

  } catch (error) {
    console.error("❌ Error in QR code generation endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET /api/clients/[id]/qr-code - Get existing QR code for business client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    // Get existing QR code
    const qrResult = await query(
      `SELECT qr_code_url, qr_image_path, updated_at
       FROM client_qr_codes 
       WHERE client_id = $1 AND qr_type = 'business_profile' AND is_active = true`,
      [clientId]
    )

    if (qrResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No QR code found for this business" },
        { status: 404 }
      )
    }

    const qrCode = qrResult.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        qrUrl: qrCode.qr_code_url,
        qrCodeDataURL: qrCode.qr_image_path,
        lastUpdated: qrCode.updated_at
      }
    })

  } catch (error) {
    console.error("❌ Error fetching QR code:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch QR code" },
      { status: 500 }
    )
  }
}