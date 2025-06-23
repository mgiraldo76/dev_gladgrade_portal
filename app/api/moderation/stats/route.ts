import { type NextRequest, NextResponse } from "next/server"
import { ggDB } from "@/lib/database-multi"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching moderation statistics...")

    // Get stats for each content type
    const imageStats = await ggDB.query(`
      SELECT 
        COALESCE(moderation_status_id, 1) as status_id,
        COUNT(*) as count
      FROM imageURLs 
      GROUP BY COALESCE(moderation_status_id, 1)
    `)

    const reviewStats = await ggDB.query(`
      SELECT 
        COALESCE(moderation_status_id, 1) as status_id,
        COUNT(*) as count
      FROM consumerReviews 
      GROUP BY COALESCE(moderation_status_id, 1)
    `)

    const adStats = await ggDB.query(`
      SELECT 
        COALESCE(moderation_status_id, 1) as status_id,
        COUNT(*) as count
      FROM ads 
      GROUP BY COALESCE(moderation_status_id, 1)
    `)

    const commStats = await ggDB.query(`
      SELECT 
        COALESCE(moderation_status_id, 1) as status_id,
        COUNT(*) as count
      FROM client_user_communications 
      GROUP BY COALESCE(moderation_status_id, 1)
    `)

    // Status mapping
    const statusNames: { [key: number]: string } = {
      1: "pending",
      2: "approved",
      3: "flagged",
      4: "deleted",
      5: "rejected",
    }

    // Aggregate stats
    const statsByType: { [key: string]: { [key: string]: number } } = {
      image: {},
      review: {},
      ad: {},
      communication: {},
    }

    const totalsByStatus: { [key: string]: number } = {
      pending: 0,
      approved: 0,
      flagged: 0,
      deleted: 0,
      rejected: 0,
    }

    // Process image stats
    imageStats.rows.forEach((row) => {
      const statusName = statusNames[row.status_id] || "pending"
      statsByType.image[statusName] = Number.parseInt(row.count)
      totalsByStatus[statusName] += Number.parseInt(row.count)
    })

    // Process review stats
    reviewStats.rows.forEach((row) => {
      const statusName = statusNames[row.status_id] || "pending"
      statsByType.review[statusName] = Number.parseInt(row.count)
      totalsByStatus[statusName] += Number.parseInt(row.count)
    })

    // Process ad stats
    adStats.rows.forEach((row) => {
      const statusName = statusNames[row.status_id] || "pending"
      statsByType.ad[statusName] = Number.parseInt(row.count)
      totalsByStatus[statusName] += Number.parseInt(row.count)
    })

    // Process communication stats
    commStats.rows.forEach((row) => {
      const statusName = statusNames[row.status_id] || "pending"
      statsByType.communication[statusName] = Number.parseInt(row.count)
      totalsByStatus[statusName] += Number.parseInt(row.count)
    })

    const summary = {
      totalPending: totalsByStatus.pending || 0,
      totalApproved: totalsByStatus.approved || 0,
      totalFlagged: totalsByStatus.flagged || 0,
      totalRejected: totalsByStatus.rejected || 0,
      totalDeleted: totalsByStatus.deleted || 0,
    }

    console.log("✅ Moderation stats calculated:", summary)

    return NextResponse.json({
      success: true,
      data: {
        statsByType,
        totalsByStatus,
        summary,
      },
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching moderation stats:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch moderation stats",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
