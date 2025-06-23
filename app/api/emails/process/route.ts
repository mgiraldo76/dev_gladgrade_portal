import { NextResponse } from "next/server"
import { processPendingEmails } from "@/lib/email-service"

// POST /api/emails/process - Process pending emails
export async function POST() {
  try {
    console.log("📧 Processing pending emails via API...")

    const result = await processPendingEmails()

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("❌ Error in email processing API:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process emails",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// GET /api/emails/process - Get email processing status
export async function GET() {
  try {
    const result = await processPendingEmails()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("❌ Error getting email status:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get email status",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
