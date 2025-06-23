import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/settings/organization
export async function GET() {
  try {
    console.log("🏢 Fetching organization settings from PostgreSQL...")

    const result = await query("SELECT * FROM organization_settings ORDER BY id LIMIT 1")

    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultResult = await query(
        `
        INSERT INTO organization_settings (org_name, org_domain, org_address, support_email, admin_email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
        [
          "GladGrade Holding Corporation",
          "gladgrade.com",
          "Miami, Florida, USA",
          "support@gladgrade.com",
          "admin@gladgrade.com",
        ],
      )

      console.log("✅ Created default organization settings")
      return NextResponse.json({
        success: true,
        data: defaultResult.rows[0],
      })
    }

    console.log("✅ Organization settings fetched successfully")

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching organization settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organization settings",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// PUT /api/settings/organization
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()

    console.log("🔄 Updating organization settings...")

    const result = await query(
      `
      UPDATE organization_settings
      SET org_name = $1, org_domain = $2, org_address = $3,
          support_email = $4, admin_email = $5, min_gcsg_score = $6,
          max_gcsg_score = $7, gcsg_update_frequency = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM organization_settings ORDER BY id LIMIT 1)
      RETURNING *
    `,
      [
        updates.org_name,
        updates.org_domain,
        updates.org_address,
        updates.support_email,
        updates.admin_email,
        updates.min_gcsg_score,
        updates.max_gcsg_score,
        updates.gcsg_update_frequency,
      ],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Organization settings not found" }, { status: 404 })
    }

    console.log("✅ Organization settings updated successfully")

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    console.error("❌ Error updating organization settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update organization settings",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
