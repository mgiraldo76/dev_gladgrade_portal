import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/sales/services - Get all services
export async function GET() {
  try {
    console.log("🛠️ Fetching all services...")

    const result = await query(`
      SELECT 
        id, name, description, category, price, commission_rate,
        is_active, is_recurring, billing_cycle, created_at, updated_at
      FROM services
      WHERE is_active = TRUE
      ORDER BY category, name
    `)

    console.log(`✅ Found ${result.rows.length} services`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching services:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch services",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST /api/sales/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      category,
      price,
      commission_rate,
      is_recurring = false,
      billing_cycle = "one_time",
    } = await request.json()

    if (!name || !category || price === undefined || commission_rate === undefined) {
      return NextResponse.json(
        { success: false, error: "Name, category, price, and commission rate are required" },
        { status: 400 },
      )
    }

    console.log(`🛠️ Creating service: ${name}`)

    const result = await query(
      `INSERT INTO services (name, description, category, price, commission_rate, is_recurring, billing_cycle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name.trim(), description, category, price, commission_rate, is_recurring, billing_cycle],
    )

    console.log("✅ Service created successfully:", result.rows[0])

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    console.error("❌ Error creating service:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create service",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
