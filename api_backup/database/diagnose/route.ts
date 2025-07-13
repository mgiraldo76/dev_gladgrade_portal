import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Starting database diagnosis...")

    // Check environment variables
    const envCheck = {
      DB_HOST: !!process.env.DB_HOST,
      DB_NAME: !!process.env.DB_NAME,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_PORT: !!process.env.DB_PORT,
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    }

    console.log("📋 Environment variables:", envCheck)

    // Try to import database module
    let dbImportError = null
    let connectionTest = null

    try {
      const { testConnection } = await import("@/lib/database")
      console.log("✅ Database module imported successfully")

      // Test connection
      connectionTest = await testConnection()
      console.log("🔗 Connection test result:", connectionTest)
    } catch (error) {
      dbImportError = error instanceof Error ? error.message : "Unknown import error"
      console.error("❌ Database import/connection error:", dbImportError)
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        environment: envCheck,
        dbImportError,
        connectionTest,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error("❌ Diagnosis failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Diagnosis failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
