import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/roles - Get all roles
export async function GET() {
  try {
    console.log("🎭 Fetching all roles...")

    const result = await query(`
      SELECT id, name, description, permissions, is_sales_role, created_at
      FROM roles
      ORDER BY 
        CASE 
          WHEN name = 'Super Admin' THEN 1
          WHEN name = 'Admin' THEN 2
          WHEN is_sales_role = TRUE THEN 3
          ELSE 4
        END,
        name
    `)

    console.log(`✅ Found ${result.rows.length} roles`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching roles:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch roles",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
