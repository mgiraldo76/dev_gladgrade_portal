import { NextResponse } from "next/server"

// GET /api/database/connection-info
export async function GET() {
  try {
    const isProduction = process.env.NODE_ENV === "production"
    const isGoogleCloud = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID

    const connectionMethod = isProduction && isGoogleCloud ? "Unix Socket" : "Public IP"

    const connectionInfo = {
      method: connectionMethod,
      environment: process.env.NODE_ENV,
      isGoogleCloud: !!isGoogleCloud,
      host:
        connectionMethod === "Unix Socket"
          ? `/cloudsql/${process.env.FIREBASE_PROJECT_ID}:us-east4:gg-instance`
          : process.env.DB_HOST,
      port: connectionMethod === "Unix Socket" ? "N/A" : process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      ssl: connectionMethod === "Public IP",
      instance: `${process.env.FIREBASE_PROJECT_ID}:us-east4:gg-instance`,
    }

    return NextResponse.json({
      success: true,
      connection: connectionInfo,
      message: `Using ${connectionMethod} connection method`,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get connection info",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
