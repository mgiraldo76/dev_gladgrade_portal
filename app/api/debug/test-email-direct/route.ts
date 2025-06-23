import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

export async function POST() {
  try {
    console.log("🧪 Testing direct email send...")

    const result = await sendWelcomeEmail(
      "Test Business",
      "sales.support@gladgrade.com",
      999, // fake client ID
      888, // fake prospect ID
    )

    console.log("📧 Email test result:", result)

    return NextResponse.json({
      success: true,
      result: result,
      message: "Email test completed",
    })
  } catch (error) {
    console.error("❌ Email test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
