import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// POST /api/database/execute-sql - Execute SQL commands (for development only)
export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ success: false, error: "SQL query is required" }, { status: 400 })
    }

    console.log("🔍 Executing SQL:", sql.substring(0, 200) + "...")

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(";")
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith("--"))

    const results = []

    for (const statement of statements) {
      if (statement.toLowerCase().includes("select")) {
        // For SELECT statements, return the results
        const result = await query(statement)
        results.push({
          statement: statement.substring(0, 100) + "...",
          rowCount: result.rowCount,
          rows: result.rows,
        })
      } else {
        // For other statements, just execute them
        const result = await query(statement)
        results.push({
          statement: statement.substring(0, 100) + "...",
          rowCount: result.rowCount,
          success: true,
        })
      }
    }

    console.log("✅ SQL executed successfully")

    return NextResponse.json({
      success: true,
      results: results,
      message: `Executed ${statements.length} SQL statements`,
    })
  } catch (error: unknown) {
    console.error("❌ Error executing SQL:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute SQL",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
