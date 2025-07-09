// File: app/api/emails/test-qr/route.ts
// Test endpoint for QR code email functionality

import { type NextRequest, NextResponse } from "next/server"
import { sendQRCodeEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { clientId, testEmail } = await request.json()

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 })
    }

    console.log(`📧 Testing QR code email for client ${clientId}...`)

    // Create a mock QR code data URL for testing
    const mockQRCodeDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

    const result = await sendQRCodeEmail(clientId, mockQRCodeDataURL, 1) // Test employee ID 1

    return NextResponse.json({
      success: result.success,
      message: result.success ? "QR code email sent successfully!" : "Failed to send QR code email",
      details: result.error || result.messageId,
      data: result.data,
      attachmentCount: result.attachmentCount
    })
  } catch (error) {
    console.error("❌ Error testing QR code email:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test QR code email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "QR code email test endpoint. Send POST request with { clientId: number }",
    example: {
      method: "POST",
      body: { clientId: 1 },
    },
  })
}