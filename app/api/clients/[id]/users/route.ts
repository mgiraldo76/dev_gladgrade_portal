import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Get users for a specific client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    const result = await query(
      `
      SELECT 
        bcu.*,
        bc.business_name
      FROM business_client_users bcu
      JOIN business_clients bc ON bcu.business_id = bc.id
      WHERE bcu.business_id = $1
      ORDER BY bcu.created_at DESC
      `,
      [clientId],
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("❌ Error fetching client users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch client users" }, { status: 500 })
  }
}
