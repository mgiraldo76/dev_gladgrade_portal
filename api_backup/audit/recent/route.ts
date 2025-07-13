import { NextResponse } from "next/server"
import AuditLogger from "@/lib/audit-logger"

// GET /api/audit/recent - Get recent audit activity
export async function GET() {
  try {
    const recentActivity = await AuditLogger.getRecentActivity(100)

    return NextResponse.json({
      success: true,
      data: recentActivity,
      total: recentActivity.length,
    })
  } catch (error) {
    console.error("❌ Error fetching recent audit activity:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit activity",
      },
      { status: 500 },
    )
  }
}
