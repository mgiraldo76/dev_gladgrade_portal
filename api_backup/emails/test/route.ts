import { type NextRequest, NextResponse } from "next/server"
import { sendTestEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email address is required" }, { status: 400 })
    }

    const result = await sendTestEmail(email)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email test endpoint. Send POST request with { email: 'test@example.com' }",
    example: {
      method: "POST",
      body: { email: "miguel.giraldo@gladgrade.com" },
    },
  })
}
