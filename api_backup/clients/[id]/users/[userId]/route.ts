// app/api/clients/[id]/users/[userId]/route.ts - Edit and delete client portal users - FIXED FIREBASE CLAIMS

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import { AuditLogger } from "@/lib/audit-logger"

// Import Firebase functions with error handling
let updateFirebaseUser: any = null
let setCustomClaims: any = null
let deleteFirebaseUser: any = null

try {
  const firebaseAdmin = require("@/lib/firebase-admin")
  updateFirebaseUser = firebaseAdmin.updateFirebaseUser
  setCustomClaims = firebaseAdmin.setCustomClaims
  deleteFirebaseUser = firebaseAdmin.deleteFirebaseUser
} catch (error) {
  console.log("⚠️ Firebase Admin functions not available, using database-only mode")
}

// Helper function to check if email exists anywhere in the system (excluding current user)
async function checkEmailExistsForEdit(email: string, excludeUserId?: string): Promise<{ exists: boolean; table: string; details?: string }> {
  const lowerEmail = email.toLowerCase().trim()
  
  // Check employees table (GladGrade staff)
  const employeeResult = await query(
    "SELECT id, full_name, role FROM employees WHERE LOWER(email) = $1 AND status = 'active'",
    [lowerEmail]
  )
  
  if (employeeResult.rows.length > 0) {
    const employee = employeeResult.rows[0]
    return {
      exists: true,
      table: 'employees',
      details: `GladGrade employee: ${employee.full_name} (${employee.role})`
    }
  }
  
  // Check client_portal_users table (all clients, excluding current user if editing)
  let clientUserQuery = "SELECT cpu.id, cpu.full_name, cpu.role, bc.business_name FROM client_portal_users cpu JOIN business_clients bc ON cpu.business_client_id = bc.id WHERE LOWER(cpu.email) = $1 AND cpu.status = 'active'"
  let queryParams: any[] = [lowerEmail]
  
  // If editing, exclude the current user
  if (excludeUserId) {
    clientUserQuery += " AND cpu.id != $2"
    queryParams.push(parseInt(excludeUserId))
  }
  
  const clientUserResult = await query(clientUserQuery, queryParams)
  
  if (clientUserResult.rows.length > 0) {
    const clientUser = clientUserResult.rows[0]
    return {
      exists: true,
      table: 'client_portal_users',
      details: `Client user: ${clientUser.full_name} (${clientUser.role}) at ${clientUser.business_name}`
    }
  }
  
  return { exists: false, table: '' }
}

// Helper function to get context-aware error message
function getEmailExistsErrorMessage(userType: 'employee' | 'client', emailCheckResult: any): string {
  const baseMessage = "Oh oh, the email for the user you are attempting to edit already exists and cannot be reused. Please check and try again."
  
  let contactMessage = ""
  if (userType === 'employee') {
    contactMessage = "If you believe this is an error, contact the Portal administrator."
  } else {
    contactMessage = "If you believe this is an error, contact your GladGrade representative."
  }
  
  let detailMessage = ""
  if (emailCheckResult.details) {
    detailMessage = ` (Found in system: ${emailCheckResult.details})`
  }
  
  return `${baseMessage}${detailMessage} ${contactMessage}`
}

// Helper function to get permissions for role
function getPermissionsForRole(role: string): string[] {
  const permissions = {
    client_admin: [
      'client_view_dashboard', 'client_view_reports', 'client_manage_reviews',
      'client_purchase_services', 'client_manage_users', 'client_manage_profile',
      'client_view_billing', 'client_manage_billing', 'client_api_access', 'client_export_data'
    ],
    client_moderator: [
      'client_view_dashboard', 'client_view_reports', 'client_manage_reviews',
      'client_purchase_services', 'client_manage_profile', 'client_view_billing', 'client_export_data'
    ],
    client_user: [
      'client_view_dashboard', 'client_view_reports', 'client_purchase_services',
      'client_manage_profile', 'client_view_billing'
    ],
    client_viewer: [
      'client_view_dashboard', 'client_view_reports'
    ]
  }
  
  return permissions[role as keyof typeof permissions] || permissions.client_viewer
}

// PUT /api/clients/[id]/users/[userId] - Update client portal user
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const userId = Number.parseInt(params.userId)
    const updates = await request.json()

    // Get current user for access control and audit logging
    const requestUserEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, requestUserEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const {
      email,
      full_name,
      role,
      status,
      reset_password = false,
      new_password,
    } = updates

    console.log(`👤 Updating client portal user ${userId} for client ${clientId}`)

    // Get current user data
    const currentUserResult = await query(
      "SELECT * FROM client_portal_users WHERE id = $1 AND business_client_id = $2",
      [userId, clientId]
    )

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client user not found" }, { status: 404 })
    }

    const currentUserData = currentUserResult.rows[0]

    // Get client data
    const clientResult = await query(
      "SELECT business_name FROM business_clients WHERE id = $1",
      [clientId]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    const client = clientResult.rows[0]

    // If email is being changed, check for conflicts
    if (email && email.toLowerCase() !== currentUserData.email.toLowerCase()) {
      const emailCheck = await checkEmailExistsForEdit(email, userId.toString())
      
      if (emailCheck.exists) {
        console.error("❌ Email validation failed during edit:", emailCheck)
        
        // Determine if current user is GladGrade employee or client user
        const userType = 'employee' // TODO: Update when client portal is implemented
        
        const errorMessage = getEmailExistsErrorMessage(userType, emailCheck)
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            errorCode: 'EMAIL_EXISTS',
            conflictDetails: emailCheck
          }, 
          { status: 409 }
        )
      }
    }

    // Build update query dynamically
    const allowedFields = ['email', 'full_name', 'role', 'status']
    const updateFields = []
    const updateValues = []
    const changedFields = []
    let paramIndex = 1

    for (const [key, value] of Object.entries({ email, full_name, role, status })) {
      if (allowedFields.includes(key) && value !== undefined && currentUserData[key] !== value) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        changedFields.push(key)
        paramIndex++
      }
    }

    // Add password reset flag if requested
    if (reset_password) {
      updateFields.push(`password_reset_required = $${paramIndex}`)
      updateValues.push(true)
      changedFields.push('password_reset_required')
      paramIndex++
    }

    if (updateFields.length === 0 && !new_password) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
        data: currentUserData,
      })
    }

    // Add updated_at and updated_by
    updateFields.push(`updated_at = NOW()`, `updated_by = $${paramIndex}`)
    updateValues.push(currentUser.id)
    paramIndex++

    // Add WHERE clause parameters
    updateValues.push(userId, clientId)

    let updatedUser = currentUserData

    // Update database if there are changes
    if (updateFields.length > 2) { // More than just updated_at and updated_by
      const updateQuery = `
        UPDATE client_portal_users 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex - 1} AND business_client_id = $${paramIndex}
        RETURNING *
      `

      const result = await query(updateQuery, updateValues)
      updatedUser = result.rows[0]
    }

    // Update Firebase if user has Firebase account and relevant fields changed
    if (currentUserData.firebase_uid && (email || new_password || role)) {
      try {
        // Update Firebase user profile
        if (updateFirebaseUser && (email || new_password)) {
          const firebaseUpdates: any = {}
          
          if (email) {
            firebaseUpdates.email = email.toLowerCase()
          }
          
          if (new_password) {
            firebaseUpdates.password = new_password
          }
          
          if (full_name) {
            firebaseUpdates.displayName = full_name
          }

          await updateFirebaseUser(currentUserData.firebase_uid, firebaseUpdates)
          console.log(`✅ Firebase user updated`)
        }

        // FIXED: Update custom claims if role changed with correct structure
        if (setCustomClaims && role && role !== currentUserData.role) {
          const permissions = getPermissionsForRole(role)
          
          await setCustomClaims(currentUserData.firebase_uid, {
            // ✅ FIXED: Maintain role as 'client' for providers.tsx compatibility
            role: "client",                    // This matches UserRole in providers.tsx
            userType: "client",               // Additional context
            businessId: clientId,             // Client business ID
            businessName: client.business_name, // Client business name
            clientRole: role,                 // Updated specific client role (client_admin, client_user, etc.)
            permissions: permissions,         // Updated role-based permissions
          })

          console.log(`✅ Firebase custom claims updated for role change with role: 'client'`)
        }
      } catch (firebaseError: unknown) {
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : "Unknown Firebase error"
        console.error("⚠️ Firebase update failed but database update succeeded:", errorMessage)
        // Don't fail the whole operation for Firebase errors
      }
    }

    // Log the changes for audit trail
    if (currentUser && changedFields.length > 0) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "UPDATE",
        tableName: "client_portal_users",
        recordId: userId,
        actionDescription: `Updated client portal user: ${currentUserData.full_name} for ${client.business_name}`,
        oldValues: Object.fromEntries(changedFields.map((field) => [field, currentUserData[field]])),
        newValues: Object.fromEntries(changedFields.map((field) => [field, updatedUser[field]])),
        changedFields,
        businessContext: "client_management",
        severityLevel: "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    console.log("✅ Client portal user updated successfully")

    // Remove sensitive data from response
    const { temporary_password, password_reset_token, ...safeUser } = updatedUser

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: `Client portal user updated successfully`,
      changedFields,
    })
  } catch (error) {
    console.error("❌ Error updating client portal user:", error)
    return NextResponse.json({ success: false, error: "Failed to update client portal user" }, { status: 500 })
  }
}

// DELETE /api/clients/[id]/users/[userId] - Deactivate client portal user
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const userId = Number.parseInt(params.userId)

    // Get current user for access control and audit logging
    const requestUserEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, requestUserEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`👤 Deactivating client portal user ${userId} for client ${clientId}`)

    // Get user data before deletion
    const userResult = await query(
      "SELECT * FROM client_portal_users WHERE id = $1 AND business_client_id = $2",
      [userId, clientId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client user not found" }, { status: 404 })
    }

    const userData = userResult.rows[0]

    // Get client data
    const clientResult = await query(
      "SELECT business_name FROM business_clients WHERE id = $1",
      [clientId]
    )

    const client = clientResult.rows[0]

    // Soft delete - deactivate instead of hard delete
    const result = await query(
      `UPDATE client_portal_users 
       SET status = 'inactive', updated_at = NOW(), updated_by = $1
       WHERE id = $2 AND business_client_id = $3
       RETURNING *`,
      [currentUser.id, userId, clientId]
    )

    // Disable Firebase account if exists
    if (userData.firebase_uid && updateFirebaseUser) {
      try {
        await updateFirebaseUser(userData.firebase_uid, { disabled: true })
        console.log(`✅ Firebase user disabled`)
      } catch (firebaseError: unknown) {
        console.error("⚠️ Firebase disable failed but database update succeeded:", firebaseError)
      }
    }

    // Log the deactivation for audit trail
    if (currentUser) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "DELETE",
        tableName: "client_portal_users",
        recordId: userId,
        actionDescription: `Deactivated client portal user: ${userData.full_name} for ${client.business_name}`,
        oldValues: userData,
        businessContext: "client_management",
        severityLevel: "warning",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    console.log("✅ Client portal user deactivated successfully")

    return NextResponse.json({
      success: true,
      message: `Client portal user deactivated successfully`,
    })
  } catch (error) {
    console.error("❌ Error deactivating client portal user:", error)
    return NextResponse.json({ success: false, error: "Failed to deactivate client portal user" }, { status: 500 })
  }
}