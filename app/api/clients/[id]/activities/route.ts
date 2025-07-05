// app/api/clients/[id]/activities/route.ts - Client activities management (identical to prospect activities)

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import { AuditLogger } from "@/lib/audit-logger"

// GET /api/clients/[id]/activities - Get all activities for a client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    // Get current user for access control
    const userEmail = request.headers.get("x-user-email") || undefined
    const firebaseUid = request.headers.get("x-firebase-uid") || undefined

    let currentUser = null
    if (firebaseUid) {
      currentUser = await getEmployeeByAuth(firebaseUid)
    } else if (userEmail) {
      currentUser = await getEmployeeByAuth(undefined, userEmail)
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`📋 Loading activities for client ${clientId}`)

    const result = await query(
      `SELECT 
        ca.*,
        e.full_name as employee_name,
        e.role as employee_role,
        bc.business_name
       FROM client_activities ca
       LEFT JOIN employees e ON ca.employee_id = e.id
       LEFT JOIN business_clients bc ON ca.client_id = bc.id
       WHERE ca.client_id = $1
       ORDER BY ca.completed_at DESC, ca.created_at DESC`,
      [clientId]
    )

    console.log(`✅ Found ${result.rows.length} activities for client`)

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("❌ Error fetching client activities:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch client activities" }, { status: 500 })
  }
}

// POST /api/clients/[id]/activities - Create new activity for client
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    const activityData = await request.json()

    // Get current user for access control and audit logging
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const {
      activity_type,
      subject,
      description,
      outcome,
      next_action,
      scheduled_for,
    } = activityData

    console.log(`📋 Creating new activity for client ${clientId}`)

    // Validation
    if (!activity_type || !subject) {
      return NextResponse.json(
        { success: false, error: "Activity type and subject are required" }, 
        { status: 400 }
      )
    }

    // Validate activity type
    const validActivityTypes = ['call', 'email', 'meeting', 'note', 'follow_up', 'proposal', 'contract', 'payment', 'support']
    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid activity type" }, 
        { status: 400 }
      )
    }

    // Check if client exists
    const clientResult = await query(
      "SELECT business_name FROM business_clients WHERE id = $1",
      [clientId]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    const client = clientResult.rows[0]

    // Create the activity
    const result = await query(
      `INSERT INTO client_activities (
        client_id, employee_id, activity_type, subject, description,
        outcome, next_action, scheduled_for, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        clientId,
        currentUser.id,
        activity_type,
        subject,
        description || null,
        outcome || null,
        next_action || null,
        scheduled_for || null,
      ]
    )

    const newActivity = result.rows[0]

    // Log the activity creation for audit trail
    if (currentUser) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "CREATE",
        tableName: "client_activities",
        recordId: newActivity.id,
        actionDescription: `Created ${activity_type} activity: ${subject} for client ${client.business_name}`,
        newValues: newActivity,
        businessContext: "client_management",
        severityLevel: "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    console.log("✅ Client activity created successfully")

    return NextResponse.json({
      success: true,
      data: {
        ...newActivity,
        employee_name: currentUser.name,
        employee_role: currentUser.role,
        business_name: client.business_name,
      },
      message: "Activity created successfully",
    })
  } catch (error) {
    console.error("❌ Error creating client activity:", error)
    return NextResponse.json({ success: false, error: "Failed to create client activity" }, { status: 500 })
  }
}