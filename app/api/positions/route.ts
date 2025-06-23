import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/positions - Get all company positions
export async function GET() {
  try {
    console.log("🏢 Fetching all company positions...")

    const result = await query(`
      SELECT id, title, description, level, additional_permissions, can_access_sales, created_at
      FROM company_positions
      ORDER BY level DESC, title
    `)

    console.log(`✅ Found ${result.rows.length} positions`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching positions:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch positions",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
