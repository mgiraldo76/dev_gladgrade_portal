// app/api/clients/[id]/locations/route.ts - FIXED: Support both employee and client authentication

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import { AuditLogger } from "@/lib/audit-logger"

// NEW: Helper to authenticate client users from Firebase token
async function getClientUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.replace("Bearer ", "")
    
    // Use the correct Firebase Admin import structure (like in gcloud-proxy)
    try {
      const { getAuth } = await import("firebase-admin/auth")
      
      // Verify the token
      const decodedToken = await getAuth().verifyIdToken(token)
      
      // Check if this is a client user with businessId
      if (decodedToken.role === "client" && decodedToken.businessId) {
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
          businessId: parseInt(decodedToken.businessId),
          role: decodedToken.role,
          clientRole: decodedToken.clientRole
        }
      }
    } catch (adminError) {
      console.log("⚠️ Firebase Admin not available for token verification:", adminError)
      return null
    }

    return null
  } catch (error) {
    console.error("❌ Error verifying client token:", error)
    return null
  }
}

// FIXED: GET /api/clients/[id]/locations - Support both employee and client authentication
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)

    // Try employee authentication first (existing logic)
    const userEmail = request.headers.get("x-user-email") || undefined
    const firebaseUid = request.headers.get("x-firebase-uid") || undefined

    let currentUser = null
    let isEmployeeUser = false
    
    if (firebaseUid) {
      currentUser = await getEmployeeByAuth(firebaseUid)
      isEmployeeUser = !!currentUser
    } else if (userEmail) {
      currentUser = await getEmployeeByAuth(undefined, userEmail)
      isEmployeeUser = !!currentUser
    }

    // NEW: If no employee found, try client user authentication
    let clientUser = null
    if (!currentUser) {
      clientUser = await getClientUserFromToken(request)
      
      if (clientUser) {
        // Validate client can only access their own business data
        if (clientUser.businessId !== clientId) {
          console.log(`❌ Client user ${clientUser.email} tried to access business ${clientId}, but they belong to business ${clientUser.businessId}`)
          return NextResponse.json({ 
            success: false, 
            error: "Access denied - you can only access your own business data" 
          }, { status: 403 })
        }
        console.log(`✅ Client user ${clientUser.email} authenticated for business ${clientId}`)
      }
    }

    // Check if any valid authentication was found
    if (!currentUser && !clientUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`🏢 Loading business locations for client ${clientId}`)
    console.log(`👤 Request by: ${isEmployeeUser ? 'Employee' : 'Client User'}`)

    const result = await query(
      `SELECT 
        bl.*,
        CASE WHEN bl.is_primary THEN 'Primary Location' ELSE 'Additional Location' END as location_type
       FROM business_locations bl
       WHERE bl.business_client_id = $1
       ORDER BY bl.is_primary DESC, bl.created_at ASC`,
      [clientId]
    )

    console.log(`✅ Found ${result.rows.length} business locations`)

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("❌ Error fetching business locations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch business locations" }, { status: 500 })
  }
}

// POST /api/clients/[id]/locations - Create new business location with enhanced authentication
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationData = await request.json()

    // Try employee authentication first
    const userEmail = request.headers.get("x-user-email") || undefined
    let currentUser = await getEmployeeByAuth(undefined, userEmail)
    let isEmployeeUser = !!currentUser

    // NEW: If no employee found, try client user authentication
    let clientUser = null
    if (!currentUser) {
      clientUser = await getClientUserFromToken(request)
      
      if (clientUser) {
        // Validate client can only modify their own business data
        if (clientUser.businessId !== clientId) {
          return NextResponse.json({ 
            success: false, 
            error: "Access denied - you can only modify your own business data" 
          }, { status: 403 })
        }
      }
    }

    if (!currentUser && !clientUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const {
      location_name,
      address,
      city,
      state,
      country = "USA",
      postal_code,
      phone,
      manager_name,
      manager_email,
      is_primary = false,
      place_id,
    } = locationData

    console.log(`🏢 Creating new business location for client ${clientId}`)
    console.log(`📍 Place ID: ${place_id || 'Not provided'}`)
    console.log(`👤 Request by: ${isEmployeeUser ? 'Employee' : 'Client User'}`)

    // Validation
    if (!location_name || !address || !city) {
      return NextResponse.json(
        { success: false, error: "Location name, address, and city are required" }, 
        { status: 400 }
      )
    }

    // If this is set as primary, unset other primary locations
    if (is_primary) {
      console.log(`🎯 Setting as primary location - unsetting other primary locations for client ${clientId}`)
      await query(
        "UPDATE business_locations SET is_primary = false WHERE business_client_id = $1",
        [clientId]
      )
    }

    const result = await query(
      `INSERT INTO business_locations (
        business_client_id, location_name, address, city, state, 
        country, postal_code, phone, manager_name, manager_email,
        is_primary, status, place_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        clientId,
        location_name,
        address,
        city,
        state,
        country,
        postal_code,
        phone,
        manager_name,
        manager_email,
        is_primary,
        "active",
        place_id || null
      ]
    )

    const newLocation = result.rows[0]

    // Log the creation for audit trail (only if employee user)
    if (currentUser) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "CREATE",
        tableName: "business_locations",
        recordId: newLocation.id,
        actionDescription: `Created business location: ${location_name} for client ${clientId}${is_primary ? ' (set as primary)' : ''}`,
        newValues: newLocation,
        businessContext: "client_management",
        severityLevel: "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })
    }

    console.log("✅ Business location created successfully")

    return NextResponse.json({
      success: true,
      data: newLocation,
      message: `Business location created successfully${is_primary ? ' and set as primary' : ''}`,
    })
  } catch (error) {
    console.error("❌ Error creating business location:", error)
    return NextResponse.json({ success: false, error: "Failed to create business location" }, { status: 500 })
  }
}