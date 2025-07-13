import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/database-multi"

// POST /api/database/switch-db
export async function POST(request: NextRequest) {
  try {
    const { database } = await request.json()

    if (!database) {
      return NextResponse.json({ success: false, error: "Database name is required" }, { status: 400 })
    }

    console.log(`🔄 Switching to database: ${database}`)

    // Create connection to the specified database
    const db = connectToDatabase(database)

    // Test the connection
    const testResult = await db.testConnection()

    if (!testResult.success) {
      await db.close()
      return NextResponse.json(
        { success: false, error: `Failed to connect to database '${database}'`, details: testResult.error },
        { status: 500 },
      )
    }

    // Get some info about the database
    const infoResult = await db.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `)

    // Close the connection
    await db.close()

    return NextResponse.json({
      success: true,
      database: database,
      info: infoResult.rows[0],
      message: `Successfully connected to database '${database}'`,
    })
  } catch (error: unknown) {
    console.error("❌ Database switch failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to switch database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
