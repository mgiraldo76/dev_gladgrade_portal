import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/sales/stats - Get sales statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const salesperson_id = searchParams.get("salesperson_id")

    console.log("📊 Fetching sales statistics...")

    let whereClause = ""
    const params: any[] = []

    if (salesperson_id) {
      whereClause = "WHERE p.assigned_salesperson_id = $1"
      params.push(Number.parseInt(salesperson_id))
    }

    // Get comprehensive sales statistics
    const statsResult = await query(
      `SELECT
        -- Prospect counts
        COUNT(CASE WHEN p.status != 'converted' AND p.status != 'lost' THEN 1 END) as total_prospects,
        COUNT(CASE WHEN p.status = 'converted' THEN 1 END) as total_clients,
        
        -- Conversion rate
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((COUNT(CASE WHEN p.status = 'converted' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1)
          ELSE 0 
        END as conversion_rate,
        
        -- Average sales cycle (days from created to converted)
        COALESCE(
          ROUND(AVG(EXTRACT(DAY FROM (p.converted_at - p.created_at))), 0),
          0
        ) as avg_sales_cycle,
        
        -- Total estimated value
        COALESCE(SUM(p.estimated_value), 0) as total_pipeline_value,
        COALESCE(SUM(CASE WHEN p.status = 'converted' THEN p.conversion_value END), 0) as total_converted_value
        
      FROM prospects p
      ${whereClause}`,
      params,
    )

    // Get commission statistics
    const commissionResult = await query(
      `SELECT
        COALESCE(SUM(commission_amount), 0) as total_commissions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid_commissions,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending_commissions,
        COUNT(*) as total_commission_records
      FROM commissions
      ${salesperson_id ? "WHERE salesperson_id = $1" : ""}`,
      salesperson_id ? [Number.parseInt(salesperson_id)] : [],
    )

    const stats = statsResult.rows[0]
    const commissions = commissionResult.rows[0]

    const salesStats = {
      totalProspects: Number.parseInt(stats.total_prospects) || 0,
      totalClients: Number.parseInt(stats.total_clients) || 0,
      conversionRate: Number.parseFloat(stats.conversion_rate) || 0,
      avgSalesCycle: Number.parseInt(stats.avg_sales_cycle) || 0,
      totalPipelineValue: Number.parseFloat(stats.total_pipeline_value) || 0,
      totalConvertedValue: Number.parseFloat(stats.total_converted_value) || 0,
      totalCommissions: Number.parseFloat(commissions.total_commissions) || 0,
      paidCommissions: Number.parseFloat(commissions.paid_commissions) || 0,
      pendingCommissions: Number.parseFloat(commissions.pending_commissions) || 0,
      totalCommissionRecords: Number.parseInt(commissions.total_commission_records) || 0,
    }

    console.log("✅ Sales statistics calculated:", salesStats)

    return NextResponse.json({
      success: true,
      data: salesStats,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching sales statistics:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sales statistics",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
