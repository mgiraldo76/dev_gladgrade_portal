import { NextResponse } from "next/server"
import { Pool } from "pg"
import nodemailer from "nodemailer"
import QRCode from "qrcode"

interface DatabaseCheck {
  exists: boolean
  count?: number
  error?: string
}

interface EmailCheck {
  configured: boolean
  host?: string
  user?: string
  status?: string
  error?: string
}

interface QRCheck {
  available: boolean
  test_generated?: boolean
  error?: string
}

interface TestResults {
  database: Record<string, DatabaseCheck>
  email: EmailCheck
  qr: QRCheck
}

interface Recommendation {
  type: string
  category: string
  message: string
  action: string
}

function generateRecommendations(results: TestResults): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Check database tables
  const missingTables = Object.entries(results.database)
    .filter(([, info]) => !info.exists)
    .map(([table]) => table)

  if (missingTables.length > 0) {
    recommendations.push({
      type: "error",
      category: "Database",
      message: `Missing database tables: ${missingTables.join(", ")}`,
      action: "Run scripts/create-sales-pipeline-tables.sql",
    })
  }

  // Check email configuration
  if (!results.email.configured) {
    recommendations.push({
      type: "error",
      category: "Email",
      message: "Email system not configured",
      action: "Configure SMTP settings in .env.local",
    })
  }

  // Check QR code functionality
  if (!results.qr.available) {
    recommendations.push({
      type: "error",
      category: "QR Codes",
      message: "QR code generation not available",
      action: "Install qrcode package: npm install qrcode",
    })
  }

  return recommendations
}

export async function GET() {
  try {
    const results: TestResults = {
      database: {},
      email: { configured: false },
      qr: { available: false },
    }

    // Test database tables - using the EXACT table names from the SQL script
    const requiredTables = [
      "roles",
      "company_positions",
      "services",
      "prospects",
      "prospect_services",
      "sales_activities", // This is what the SQL script creates, not "prospect_activities"
      "commissions",
      "client_qr_codes", // This is what the SQL script creates, not "qr_codes"
      "email_logs", // This is what the SQL script creates, not "email_queue"
    ]

    const pool = new Pool({
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

    for (const table of requiredTables) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'`,
          [table],
        )

        const exists = Number.parseInt(result.rows[0].count) > 0

        if (exists) {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
          results.database[table] = {
            exists: true,
            count: Number.parseInt(countResult.rows[0].count),
          }
        } else {
          results.database[table] = {
            exists: false,
            error: "Table does not exist",
          }
        }
      } catch (error) {
        results.database[table] = {
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    await pool.end()

    // Test email configuration
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      })

      // Verify the connection
      await transporter.verify()

      results.email = {
        configured: true,
        host: process.env.SMTP_HOST,
        user: process.env.SMTP_USER,
        status: "SMTP connection verified",
      }
    } catch (error) {
      results.email = {
        configured: false,
        error: error instanceof Error ? error.message : "SMTP configuration failed",
      }
    }

    // Test QR code generation
    try {
      const testQR = await QRCode.toDataURL("https://portal.gladgrade.com/test")
      results.qr = {
        available: true,
        test_generated: true,
      }
    } catch (error) {
      results.qr = {
        available: false,
        error: error instanceof Error ? error.message : "QR generation failed",
      }
    }

    const recommendations = generateRecommendations(results)

    return NextResponse.json({
      success: true,
      results,
      recommendations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Send test email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send test email to yourself
      subject: "GladGrade Portal - Test Email",
      html: `
        <h2>Test Email from GladGrade Portal</h2>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${process.env.SMTP_FROM}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    })
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Email test failed",
      },
      { status: 500 },
    )
  }
}
