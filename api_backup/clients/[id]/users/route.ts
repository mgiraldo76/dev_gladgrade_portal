// app/api/clients/[id]/users/route.ts - Client portal users management - FIXED FIREBASE CLAIMS

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import { AuditLogger } from "@/lib/audit-logger"

// Import Firebase functions with error handling
let createFirebaseUser: any = null
let setCustomClaims: any = null

try {
  const firebaseAdmin = require("@/lib/firebase-admin")
  createFirebaseUser = firebaseAdmin.createFirebaseUser
  setCustomClaims = firebaseAdmin.setCustomClaims
} catch (error) {
  console.log("⚠️ Firebase Admin functions not available, using database-only mode")
}

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Helper function to check if email exists anywhere in the system
async function checkEmailExists(email: string, excludeUserId?: string): Promise<{ exists: boolean; table: string; details?: string }> {
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
  
  // Check client_portal_users table (all clients)
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
  const baseMessage = "Oh oh, the email for the user you are attempting to add already exists and cannot be reused. Please check and try again."
  
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

// GET /api/clients/[id]/users - Get all portal users for a client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    // Get current user for access control
    const requestUserEmail = request.headers.get("x-user-email") || undefined
    const firebaseUid = request.headers.get("x-firebase-uid") || undefined

    let currentUser = null
    if (firebaseUid) {
      currentUser = await getEmployeeByAuth(firebaseUid)
    } else if (requestUserEmail) {
      currentUser = await getEmployeeByAuth(undefined, requestUserEmail)
    }

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`👤 Loading portal users for client ${clientId}`)

    // Check if user has permission to view client users
    // TODO: Add client user authentication check here when implementing client portal

    const result = await query(
      `SELECT 
        cpu.*,
        bc.business_name,
        CASE 
          WHEN cpu.created_by IS NOT NULL THEN e.full_name
          WHEN cpu.created_by_client_user IS NOT NULL THEN cpu2.full_name
          ELSE 'System'
        END as created_by_name,
        CASE 
          WHEN cpu.created_by IS NOT NULL THEN 'employee'
          WHEN cpu.created_by_client_user IS NOT NULL THEN 'client_user'
          ELSE 'system'
        END as created_by_type
       FROM client_portal_users cpu
       LEFT JOIN business_clients bc ON cpu.business_client_id = bc.id
       LEFT JOIN employees e ON cpu.created_by = e.id
       LEFT JOIN client_portal_users cpu2 ON cpu.created_by_client_user = cpu2.id
       WHERE cpu.business_client_id = $1
       ORDER BY cpu.created_at DESC`,
      [clientId]
    )

    console.log(`✅ Found ${result.rows.length} portal users`)

    // Remove sensitive data
    const users = result.rows.map((user: any) => {
      const { temporary_password, password_reset_token, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    })
  } catch (error) {
    console.error("❌ Error fetching client portal users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch client portal users" }, { status: 500 })
  }
}

// POST /api/clients/[id]/users - Create new client portal user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    const userData = await request.json()

    // Get current user for access control and audit logging
    const requestUserEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, requestUserEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const {
      email,
      user_email, // Alternative field name from frontend
      full_name,
      user_name, // Alternative field name from frontend
      role = 'client_user',
      temporary_password,
      send_welcome_email = true,
      create_firebase_account = true,
    } = userData

    // Handle both field naming conventions
    const userEmailValue = email || user_email
    const userFullNameValue = full_name || user_name

    console.log(`👤 Creating new portal user for client ${clientId}`)
    console.log(`📧 Email: ${userEmailValue}`)
    console.log(`👤 Name: ${userFullNameValue}`)
    console.log(`🔒 Role: ${role}`)

    // Validation
    if (!userEmailValue || !userFullNameValue) {
      console.error("❌ Validation failed:", { userEmailValue, userFullNameValue })
      return NextResponse.json(
        { success: false, error: "Email and full name are required" }, 
        { status: 400 }
      )
    }

    if (!['client_admin', 'client_moderator', 'client_user', 'client_viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role specified" }, 
        { status: 400 }
      )
    }

    // Check if client exists
    const clientResult = await query(
      "SELECT * FROM business_clients WHERE id = $1",
      [clientId]
    )

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
    }

    const client = clientResult.rows[0]

    // Enhanced: Check if email exists anywhere in the system
    const emailCheck = await checkEmailExists(userEmailValue)
    
    if (emailCheck.exists) {
      console.error("❌ Email validation failed:", emailCheck)
      
      // Determine if current user is GladGrade employee or client user
      // For now, assuming GladGrade employee since client users can't access this yet
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

    // Check if user already exists for this client
    const existingUserResult = await query(
      "SELECT id FROM client_portal_users WHERE business_client_id = $1 AND email = $2",
      [clientId, userEmailValue.toLowerCase()]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists for this client" }, 
        { status: 409 }
      )
    }

    // Generate password if not provided
    const userPassword = temporary_password || generateTemporaryPassword()

    let firebaseUid = null
    let firebaseAccountCreated = false

    // Create Firebase user if requested and available
    if (create_firebase_account && createFirebaseUser) {
      try {
        console.log("🔥 Creating Firebase Authentication user for client portal...")

        const firebaseUser = await createFirebaseUser({
          email: userEmailValue.toLowerCase().trim(),
          displayName: userFullNameValue.trim(),
          password: userPassword,
          emailVerified: false,
        })

        firebaseUid = firebaseUser.uid
        firebaseAccountCreated = true
        console.log(`✅ Firebase user created with UID: ${firebaseUid}`)

        // FIXED: Set custom claims for client portal access with correct structure
        if (setCustomClaims) {
          const permissions = getPermissionsForRole(role)
          
          await setCustomClaims(firebaseUid, {
            // ✅ FIXED: Set role as 'client' for providers.tsx compatibility
            role: "client",                    // This matches UserRole in providers.tsx
            userType: "client",               // Additional context
            businessId: clientId,             // Client business ID
            businessName: client.business_name, // Client business name
            clientRole: role,                 // Specific client role (client_admin, client_user, etc.)
            permissions: permissions,         // Role-based permissions
          })

          console.log(`✅ Custom claims set for Firebase client user with role: 'client'`)
        }
      } catch (firebaseError: unknown) {
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : "Unknown Firebase error"
        console.error("❌ Firebase user creation failed:", errorMessage)

        return NextResponse.json(
          {
            success: false,
            error: "Failed to create Firebase user for client portal",
            details: errorMessage,
          },
          { status: 500 }
        )
      }
    }

    // Create client portal user record
    const result = await query(
      `INSERT INTO client_portal_users (
        business_client_id, firebase_uid, email, full_name, role, status,
        temporary_password, password_reset_required, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        clientId,
        firebaseUid,
        userEmailValue.toLowerCase(),
        userFullNameValue,
        role,
        'active',
        userPassword, // Store temporarily for sharing
        true,
        currentUser.id,
      ]
    )

    const newUser = result.rows[0]

    // Log the creation for audit trail
    if (currentUser) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "CREATE",
        tableName: "client_portal_users",
        recordId: newUser.id,
        actionDescription: `Created client portal user: ${userFullNameValue} (${userEmailValue}) for ${client.business_name}`,
        newValues: { ...newUser, temporary_password: '[REDACTED]' },
        businessContext: "client_management",
        severityLevel: "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    console.log("✅ Client portal user created successfully")

    // TODO: Send welcome email if requested
    if (send_welcome_email) {
      console.log("📧 Welcome email functionality to be implemented")
      // await sendClientUserWelcomeEmail(newUser, client, userPassword)
    }

    // Remove sensitive data from response
    const { temporary_password: _, password_reset_token, ...safeUser } = newUser

    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        firebase_account_created: firebaseAccountCreated,
        firebase_uid: firebaseUid,
        temporary_password: userPassword, // Include in response for creator
      },
      message: `Client portal user created successfully${firebaseAccountCreated ? ' with Firebase account' : ''}`,
    })
  } catch (error) {
    console.error("❌ Error creating client portal user:", error)
    return NextResponse.json({ success: false, error: "Failed to create client portal user" }, { status: 500 })
  }
}