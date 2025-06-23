import { NextResponse } from "next/server"
import { corpDB, ggDB, connectToDatabase } from "@/lib/database-multi"

// GET /api/database/test-all
export async function GET() {
  try {
    console.log("🧪 Testing connections to all databases...")

    // Test corp database
    const corpTest = await corpDB.testConnection()

    // Test gg database
    const ggTest = await ggDB.testConnection()

    // Test dynamic connection to any database
    const dynamicDB = connectToDatabase("postgres") // System database
    const postgresTest = await dynamicDB.testConnection()
    await dynamicDB.close()

    // Get list of all databases in the instance
    const dbListResult = await corpDB.query(`
      SELECT datname as database_name 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname
    `)

    return NextResponse.json({
      success: true,
      connections: {
        corp: corpTest,
        gg: ggTest,
        postgres: postgresTest,
      },
      availableDatabases: dbListResult.rows.map((row: { database_name: string }) => row.database_name),
      instance: "reactgladgrade:us-east4:gg-instance",
      connectionMethod: process.env.NODE_ENV === "production" ? "Unix Socket" : "Public IP",
      message: "All database connections tested successfully!",
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
