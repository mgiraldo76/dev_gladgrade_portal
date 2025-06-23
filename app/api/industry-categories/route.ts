import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/industry-categories
export async function GET() {
  try {
    console.log("📋 Fetching industry categories from PostgreSQL...")

    const result = await query(`
      SELECT id, name, description, icon, created_at
      FROM industry_categories
      ORDER BY name
    `)

    console.log(`✅ Found ${result.rows.length} industry categories`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching industry categories:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch industry categories from database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
