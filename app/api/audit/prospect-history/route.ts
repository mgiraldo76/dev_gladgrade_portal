import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/audit/prospect-history?prospect_id=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospect_id")

    if (!prospectId) {
      return NextResponse.json({ success: false, error: "Prospect ID is required" }, { status: 400 })
    }

    // Get audit history for the prospect
    const auditHistory = await query(
      `
      SELECT 
        al.*,
        e.full_name as user_full_name
      FROM audit_logs al
      LEFT JOIN employees e ON al.user_id = e.id
      WHERE al.table_name = 'prospects' AND al.record_id = $1
      ORDER BY al.created_at DESC
    `,
      [prospectId],
    )

    // Get ownership change history
    const ownershipHistory = await query(
      `
      SELECT * FROM prospect_ownership_history
      WHERE prospect_id = $1
      ORDER BY changed_at DESC
    `,
      [prospectId],
    )

    return NextResponse.json({
      success: true,
      data: {
        audit_history: auditHistory.rows,
        ownership_history: ownershipHistory.rows,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching prospect history:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prospect history",
      },
      { status: 500 },
    )
  }
}
