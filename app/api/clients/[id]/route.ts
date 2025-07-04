// app/api/clients/[id]/route.ts - Enhanced with security_level support

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { AuditLogger } from "@/lib/audit-logger"
import { getEmployeeByAuth } from "@/lib/auth-utils"

// Get single client details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    const result = await query(
      `
      SELECT 
        bc.*,
        e.full_name as sales_rep_name,
        e.email as sales_rep_email
      FROM business_clients bc
      LEFT JOIN employees e ON bc.sales_rep_id = e.id
      WHERE bc.id = $1
      `,
      [clientId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("❌ Error fetching client:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch client" }, { status: 500 })
  }
}

// Update client details with audit logging and enhanced security_level support
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    const updates = await request.json()

    // Get current user for audit logging
    async function getCurrentUser(request: NextRequest) {
      try {
        const firebaseUid = request.headers.get("x-firebase-uid")
        if (firebaseUid) {
          const result = await query(
            "SELECT id, full_name as name, email, role FROM employees WHERE firebase_uid = $1 AND status = 'active'",
            [firebaseUid]
          )
          if (result.rows.length > 0) return result.rows[0]
        }

        const userEmail = request.headers.get("x-user-email")
        if (userEmail) {
          const result = await query(
            "SELECT id, full_name as name, email, role FROM employees WHERE email = $1 AND status = 'active'",
            [userEmail.toLowerCase()]
          )
          if (result.rows.length > 0) return result.rows[0]
        }

        return null
      } catch (error) {
        console.error("❌ Error getting current user:", error)
        return null
      }
    }

    const currentUser = await getCurrentUser(request)

    // Get current client data for audit comparison
    const currentResult = await query("SELECT * FROM business_clients WHERE id = $1", [clientId])

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    const currentData = currentResult.rows[0]

    // Enhanced: Build update query dynamically with security_level support
    const allowedFields = [
      "business_name",
      "contact_name", 
      "contact_email",
      "phone",
      "website",
      "business_address",
      "industry_category_id",
      "claim_status",
      "security_level", // NEW: Allow security_level updates
      "sales_rep_id"
    ]

    const updateFields = []
    const updateValues = []
    const changedFields = []
    let paramIndex = 1

    // Handle security_level changes with special logging
    const isSecurityLevelChange = updates.security_level && 
                                updates.security_level !== currentData.security_level

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && currentData[key] !== value) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        changedFields.push(key)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
        data: currentData,
      })
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`)
    updateValues.push(clientId) // For WHERE clause

    const updateQuery = `
      UPDATE business_clients 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)
    const updatedClient = result.rows[0]

    // Enhanced: Log the changes with special handling for security_level
    if (currentUser) {
      const actionDescription = isSecurityLevelChange 
        ? `Updated client security level: ${currentData.business_name} (${currentData.security_level} → ${updates.security_level})`
        : `Updated client: ${currentData.business_name}`

      const severityLevel = isSecurityLevelChange 
        ? (updates.security_level === "flagged" || updates.security_level === "suspended" ? "warning" : "info")
        : "info"

      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: isSecurityLevelChange ? "STATUS_CHANGE" : "UPDATE",
        tableName: "business_clients",
        recordId: clientId,
        actionDescription,
        oldValues: Object.fromEntries(changedFields.map((field) => [field, currentData[field]])),
        newValues: Object.fromEntries(changedFields.map((field) => [field, updates[field]])),
        changedFields,
        businessContext: "client_management",
        severityLevel,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      console.log(`✅ Client ${clientId} updated by ${currentUser.name}. Changed fields: ${changedFields.join(", ")}`)
      
      // Additional logging for security level changes
      if (isSecurityLevelChange) {
        console.log(`🔒 Security level changed: ${currentData.security_level} → ${updates.security_level} for client ${currentData.business_name}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: `Client updated successfully. Changed: ${changedFields.join(", ")}`,
      changedFields,
      securityLevelChanged: isSecurityLevelChange,
    })
  } catch (error) {
    console.error("❌ Error updating client:", error)
    return NextResponse.json({ success: false, error: "Failed to update client" }, { status: 500 })
  }
}