import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/database/status
export async function GET() {
  try {
    // Get database status and statistics
    const statusResult = await query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version,
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
    `)

    // Get table information
    const tablesResult = await query(`
      SELECT 
        table_schema as schemaname,
        table_name as tablename,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // Get recent activity
    const activityResult = await query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows
      FROM pg_stat_user_tables
      ORDER BY tablename
    `)

    return NextResponse.json({
      success: true,
      status: statusResult.rows[0],
      tables: tablesResult.rows,
      activity: activityResult.rows,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error("❌ Error getting database status:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get database status",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
