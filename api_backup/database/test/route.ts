import { NextResponse } from "next/server"
import { testConnection, query } from "@/lib/database"

// GET /api/database/test
export async function GET() {
  try {
    console.log("🧪 Testing database connection...")

    // Test basic connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: connectionTest.error,
        },
        { status: 500 },
      )
    }

    // Test table existence
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('departments', 'permissions', 'organization_settings', 'department_permissions')
      ORDER BY table_name
    `)

    // Test data counts
    const countsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM departments) as departments_count,
        (SELECT COUNT(*) FROM permissions) as permissions_count,
        (SELECT COUNT(*) FROM organization_settings) as org_settings_count,
        (SELECT COUNT(*) FROM department_permissions) as dept_permissions_count
    `)

    return NextResponse.json({
      success: true,
      connection: connectionTest.data,
      tables: tablesResult.rows.map((row: { table_name: string }) => row.table_name),
      counts: countsResult.rows[0] as {
        departments_count: string
        permissions_count: string
        org_settings_count: string
        dept_permissions_count: string
      },
      message: "Database connection and schema verified successfully!",
    })
  } catch (error: unknown) {
    console.error("❌ Database test failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
