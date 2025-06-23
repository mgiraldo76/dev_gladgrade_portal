import { type NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

// POST /api/emails/test-welcome - Test welcome email sending
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Email and name are required" }, { status: 400 })
    }

    console.log(`📧 Testing welcome email to ${email}...`)

    const result = await sendWelcomeEmail(name, email, 999) // Test client ID

    return NextResponse.json({
      success: result.success,
      message: result.success ? "Welcome email sent successfully!" : "Failed to send welcome email",
      details: result.error || result.messageId,
    })
  } catch (error) {
    console.error("❌ Error testing welcome email:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test welcome email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
