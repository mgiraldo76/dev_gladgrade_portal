// app/api/clients/[id]/locations/[locationId]/route.ts - Enhanced with place_id and primary location logic

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import { AuditLogger } from "@/lib/audit-logger"

// PUT /api/clients/[id]/locations/[locationId] - Update business location with enhanced features
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationId = Number.parseInt(params.locationId)
    const updates = await request.json()

    // Get current user for access control and audit logging
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log(`🏢 Updating business location ${locationId} for client ${clientId}`)

    // Get current location data for audit comparison
    const currentResult = await query(
      "SELECT * FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Business location not found" }, { status: 404 })
    }

    const currentData = currentResult.rows[0]

    // Enhanced: Build update query dynamically with place_id support
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
      "status",
      "place_id" // NEW: Allow place_id updates
    ]

    const updateFields = []
    const updateValues = []
    const changedFields = []
    let paramIndex = 1

    // Special handling for primary location logic
    const isPrimaryChange = updates.is_primary !== undefined && 
                           updates.is_primary !== currentData.is_primary

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

    // If this is being set as primary, unset other primary locations first
    if (updates.is_primary === true && !currentData.is_primary) {
      console.log(`🎯 Setting location ${locationId} as primary - unsetting other primary locations for client ${clientId}`)
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

    // Enhanced: Log the changes with audit system
    if (currentUser) {
      const actionDescription = isPrimaryChange && updates.is_primary
        ? `Updated business location and set as primary: ${currentData.location_name} for client ${clientId}`
        : `Updated business location: ${currentData.location_name} for client ${clientId}`

      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: isPrimaryChange ? "STATUS_CHANGE" : "UPDATE",
        tableName: "business_locations",
        recordId: locationId,
        actionDescription,
        oldValues: Object.fromEntries(changedFields.map((field) => [field, currentData[field]])),
        newValues: Object.fromEntries(changedFields.map((field) => [field, updates[field]])),
        changedFields,
        businessContext: "client_management",
        severityLevel: "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      console.log(`✅ Location ${locationId} updated by ${currentUser.name}. Changed fields: ${changedFields.join(", ")}`)
      
      if (isPrimaryChange && updates.is_primary) {
        console.log(`🎯 Location ${locationId} set as primary for client ${clientId}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: `Business location updated successfully${isPrimaryChange && updates.is_primary ? ' and set as primary' : ''}`,
      changedFields,
      primaryLocationChanged: isPrimaryChange && updates.is_primary,
    })
  } catch (error) {
    console.error("❌ Error updating business location:", error)
    return NextResponse.json({ success: false, error: "Failed to update business location" }, { status: 500 })
  }
}

// DELETE /api/clients/[id]/locations/[locationId] - Delete business location with enhanced validation
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    const locationId = Number.parseInt(params.locationId)

    // Get current user for access control and audit logging
    const userEmail = request.headers.get("x-user-email") || undefined
    const currentUser = await getEmployeeByAuth(undefined, userEmail)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get location details for validation and audit logging
    const locationResult = await query(
      "SELECT * FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    if (locationResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Business location not found" }, { status: 404 })
    }

    const locationData = locationResult.rows[0]
    const isPrimary = locationData.is_primary

    // Enhanced: Don't allow deletion of primary location if there are other locations
    if (isPrimary) {
      const otherLocationsResult = await query(
        "SELECT COUNT(*) as count FROM business_locations WHERE business_client_id = $1 AND id != $2",
        [clientId, locationId]
      )

      if (Number.parseInt(otherLocationsResult.rows[0].count) > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Cannot delete primary location while other locations exist. Please set another location as primary first.",
            isPrimaryLocation: true 
          }, 
          { status: 400 }
        )
      }
    }

    // Perform the deletion
    await query(
      "DELETE FROM business_locations WHERE id = $1 AND business_client_id = $2",
      [locationId, clientId]
    )

    // Log the deletion for audit trail
    if (currentUser) {
      await AuditLogger.log({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "DELETE",
        tableName: "business_locations",
        recordId: locationId,
        actionDescription: `Deleted business location: ${locationData.location_name} for client ${clientId}${isPrimary ? ' (was primary location)' : ''}`,
        oldValues: locationData,
        businessContext: "client_management",
        severityLevel: isPrimary ? "warning" : "info",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      console.log(`✅ Location ${locationId} deleted by ${currentUser.name}`)
      
      if (isPrimary) {
        console.log(`⚠️ Primary location deleted for client ${clientId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Business location deleted successfully${isPrimary ? ' (was primary location)' : ''}`,
      wasPrimaryLocation: isPrimary,
    })
  } catch (error) {
    console.error("❌ Error deleting business location:", error)
    return NextResponse.json({ success: false, error: "Failed to delete business location" }, { status: 500 })
  }
}