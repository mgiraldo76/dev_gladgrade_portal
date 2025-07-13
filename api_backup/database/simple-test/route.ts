import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Running simple database test...")

    // Check if we can import pg
    const { Pool } = await import("pg")
    console.log("✅ pg module imported successfully")

    // Create a simple connection
    const pool = new Pool({
      host: process.env.DB_HOST || "34.86.121.148",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "corp",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })

    console.log("🔗 Pool created, testing connection...")

    // Simple query
    const client = await pool.connect()
    const result = await client.query("SELECT NOW() as current_time, current_database() as db_name")
    client.release()
    await pool.end()

    console.log("✅ Simple test successful:", result.rows[0])

    return NextResponse.json({
      success: true,
      result: result.rows[0],
      message: "Database connection successful",
    })
  } catch (error: unknown) {
    console.error("❌ Simple test failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Simple database test failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
