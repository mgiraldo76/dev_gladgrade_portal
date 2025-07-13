import { NextResponse } from "next/server"
import { ggDB } from "@/lib/database-multi"

// GET /api/moderation/message-categories - Get all message categories
export async function GET() {
  try {
    console.log("📋 Fetching message categories...")

    const query = `
      SELECT id, name
      FROM gg.messageCategories
      ORDER BY id
    `

    const result = await ggDB.query(query)

    console.log(`✅ Found ${result.rows.length} message categories`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching message categories:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch message categories",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
