import { NextResponse } from "next/server"

interface DependencyCheck {
  available: boolean
  error?: string
}

interface DatabaseCheck {
  connected: boolean
  database?: string
  user?: string
  timestamp?: string
  error?: string
}

interface EnvironmentCheck {
  [key: string]: {
    present: boolean
    value: string
  }
}

interface Recommendation {
  type: "error" | "warning" | "info"
  category: string
  message: string
  action: string
}

interface SetupChecks {
  environment: EnvironmentCheck
  database: DatabaseCheck
  dependencies: {
    pg: DependencyCheck
    nodemailer: DependencyCheck
    qrcode: DependencyCheck
  }
  recommendations: Recommendation[]
}

export async function GET() {
  const checks: SetupChecks = {
    environment: {},
    database: { connected: false },
    dependencies: {
      pg: { available: false },
      nodemailer: { available: false },
      qrcode: { available: false },
    },
    recommendations: [],
  }

  try {
    // 1. Environment Variables Check
    const requiredEnvVars = [
      "DB_HOST",
      "DB_NAME",
      "DB_USER",
      "DB_PASSWORD",
      "DB_PORT",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM",
    ]

    checks.environment = requiredEnvVars.reduce((acc, varName) => {
      acc[varName] = {
        present: !!process.env[varName],
        value: varName.includes("PASSWORD") ? "[HIDDEN]" : process.env[varName] || "NOT SET",
      }
      return acc
    }, {} as EnvironmentCheck)

    // 2. Dependencies Check
    try {
      await import("pg")
      checks.dependencies.pg = { available: true }
    } catch {
      checks.dependencies.pg = { available: false, error: "pg package not installed" }
    }

    try {
      await import("nodemailer")
      checks.dependencies.nodemailer = { available: true }
    } catch {
      checks.dependencies.nodemailer = { available: false, error: "nodemailer package not installed" }
    }

    try {
      await import("qrcode")
      checks.dependencies.qrcode = { available: true }
    } catch {
      checks.dependencies.qrcode = { available: false, error: "qrcode package not installed" }
    }

    // 3. Database Connection Check
    try {
      const { Pool } = await import("pg")
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      })

      const client = await pool.connect()
      const result = await client.query("SELECT current_database(), current_user, NOW()")
      client.release()
      await pool.end()

      checks.database = {
        connected: true,
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        timestamp: result.rows[0].now,
      }
    } catch (error) {
      checks.database = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown database error",
      }
    }

    // 4. Generate Recommendations
    const recommendations: Recommendation[] = []

    // Environment recommendations
    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])
    if (missingEnvVars.length > 0) {
      recommendations.push({
        type: "error",
        category: "Environment",
        message: `Missing environment variables: ${missingEnvVars.join(", ")}`,
        action: "Add these variables to your .env.local file",
      })
    }

    // Database recommendations
    if (!checks.database.connected) {
      recommendations.push({
        type: "error",
        category: "Database",
        message: "Database connection failed",
        action: "Check your database credentials and ensure the database is running",
      })
    }

    // Dependencies recommendations
    Object.entries(checks.dependencies).forEach(([dep, info]) => {
      if (!info.available) {
        recommendations.push({
          type: "error",
          category: "Dependencies",
          message: `${dep} package not available`,
          action: `Run: npm install ${dep}`,
        })
      }
    })

    checks.recommendations = recommendations

    return NextResponse.json({
      success: true,
      checks,
      summary: {
        environment_ok: missingEnvVars.length === 0,
        database_ok: checks.database.connected,
        dependencies_ok: Object.values(checks.dependencies).every((dep) => dep.available),
        ready_for_sales_pipeline: missingEnvVars.length === 0 && checks.database.connected,
      },
    })
  } catch (error: unknown) {
    console.error("❌ Setup check failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Setup check failed",
        details: errorMessage,
        checks,
      },
      { status: 500 },
    )
  }
}
