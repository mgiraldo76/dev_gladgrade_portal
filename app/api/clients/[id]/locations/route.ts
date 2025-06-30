// app/api/clients/[id]/locations/route.ts - Clean version without duplicates

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"

// GET /api/clients/[id]/locations - Get all locations for a client
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

    console.log(`🏢 Loading business locations for client ${clientId}`)

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

// POST /api/clients/[id]/locations - Create new business location
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationData = await request.json()

    // Get current user for access control
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
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
    } = locationData

    console.log(`🏢 Creating new business location for client ${clientId}`)

    // If this is set as primary, unset other primary locations
    if (is_primary) {
      await query(
        "UPDATE business_locations SET is_primary = false WHERE business_client_id = $1",
        [clientId]
      )
    }

    const result = await query(
      `INSERT INTO business_locations (
        business_client_id, location_name, address, city, state, 
        country, postal_code, phone, manager_name, manager_email,
        is_primary, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
        "active"
      ]
    )

    console.log("✅ Business location created successfully")

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Business location created successfully",
    })
  } catch (error) {
    console.error("❌ Error creating business location:", error)
    return NextResponse.json({ success: false, error: "Failed to create business location" }, { status: 500 })
  }
}