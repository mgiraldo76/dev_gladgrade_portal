// app/api/clients/[id]/locations/[locationId]/route.ts - Update specific location

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"

// PUT /api/clients/[id]/locations/[locationId] - Update business location
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationId = Number.parseInt(params.locationId)
    const updates = await request.json()

    // Get current user for access control
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`🏢 Updating business location ${locationId} for client ${clientId}`)

    // Get current location data
    const currentResult = await query(
      "SELECT * FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Business location not found" }, { status: 404 })
    }

    // Build update query dynamically
    const allowedFields = [
      "location_name",
      "address",
      "city", 
      "state",
      "country",
      "postal_code",
      "phone",
      "manager_name",
      "manager_email",
      "is_primary",
      "status"
    ]

    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
        data: currentResult.rows[0],
      })
    }

    // If this is being set as primary, unset other primary locations
    if (updates.is_primary === true) {
      await query(
        "UPDATE business_locations SET is_primary = false WHERE business_client_id = $1 AND id != $2",
        [clientId, locationId]
      )
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`)
    updateValues.push(locationId, clientId) // For WHERE clause

    const updateQuery = `
      UPDATE business_locations 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND business_client_id = $${paramIndex + 1}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)
    const updatedLocation = result.rows[0]

    console.log("✅ Business location updated successfully")

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: "Business location updated successfully",
    })
  } catch (error) {
    console.error("❌ Error updating business location:", error)
    return NextResponse.json({ success: false, error: "Failed to update business location" }, { status: 500 })
  }
}

// DELETE /api/clients/[id]/locations/[locationId] - Delete business location
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationId = Number.parseInt(params.locationId)

    // Get current user for access control
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if this is the primary location
    const locationResult = await query(
      "SELECT is_primary FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    if (locationResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Business location not found" }, { status: 404 })
    }

    const isPrimary = locationResult.rows[0].is_primary

    // Don't allow deletion of primary location if there are other locations
    if (isPrimary) {
      const otherLocationsResult = await query(
        "SELECT COUNT(*) as count FROM business_locations WHERE business_client_id = $1 AND id != $2",
        [clientId, locationId]
      )

      if (Number.parseInt(otherLocationsResult.rows[0].count) > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Cannot delete primary location. Please set another location as primary first." 
          }, 
          { status: 400 }
        )
      }
    }

    await query(
      "DELETE FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    console.log("✅ Business location deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Business location deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting business location:", error)
    return NextResponse.json({ success: false, error: "Failed to delete business location" }, { status: 500 })
  }
}