import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import AuditLogger from "@/lib/audit-logger"

// Get current user from request
async function getCurrentUser(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get("x-firebase-uid")
    if (firebaseUid) {
      const user = await getEmployeeByAuth(firebaseUid)
      if (user) return user
    }

    const userEmail = request.headers.get("x-user-email")
    if (userEmail) {
      const user = await getEmployeeByAuth(undefined, userEmail)
      if (user) return user
    }

    const testUser = request.headers.get("x-test-user")
    if (testUser) {
      const user = await getEmployeeByAuth(undefined, testUser)
      if (user) return user
    }

    return null
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

// GET /api/sales/activities - Get activities for a prospect
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospect_id")

    if (!prospectId) {
      return NextResponse.json({ success: false, error: "Prospect ID is required" }, { status: 400 })
    }

    const result = await query(
      `SELECT 
        sa.*,
        e.full_name as employee_name,
        e.email as employee_email
       FROM sales_activities sa
       LEFT JOIN employees e ON sa.employee_id = e.id
       WHERE sa.prospect_id = $1
       ORDER BY sa.completed_at DESC, sa.created_at DESC`,
      [Number.parseInt(prospectId)],
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("❌ Error fetching activities:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST /api/sales/activities - Create new activity
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const body = await request.json()
    const { prospect_id, activity_type, subject, description } = body

    // Validation
    if (!prospect_id || !activity_type || !subject?.trim()) {
      return NextResponse.json(
        { success: false, error: "Prospect ID, activity type, and subject are required" },
        { status: 400 },
      )
    }

    // Get current user
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    await client.query("BEGIN")

    // Insert activity
    const result = await client.query(
      `INSERT INTO sales_activities (
        prospect_id, employee_id, activity_type, subject, description, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [Number.parseInt(prospect_id), currentUser.id, activity_type, subject.trim(), description?.trim() || null],
    )

    const activity = result.rows[0]

    await client.query("COMMIT")

    // Log the activity creation
    await AuditLogger.log({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "CREATE",
      tableName: "sales_activities",
      recordId: activity.id,
      actionDescription: `Added ${activity_type} activity: ${subject}`,
      newValues: activity,
      businessContext: "sales_pipeline",
      severityLevel: "info",
    })

    console.log("✅ Activity created successfully:", activity.id)

    return NextResponse.json({
      success: true,
      data: activity,
      message: "Activity added successfully",
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating activity:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create activity",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
