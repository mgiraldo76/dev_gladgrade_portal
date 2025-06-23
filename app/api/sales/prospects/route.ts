import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import AuditLogger from "@/lib/audit-logger"

// IMPROVED: Get current user from request with better detection
async function getCurrentUser(request: NextRequest) {
  try {
    // Method 1: Try Firebase UID from header
    const firebaseUid = request.headers.get("x-firebase-uid")
    if (firebaseUid) {
      const user = await getEmployeeByAuth(firebaseUid)
      if (user) {
        console.log("✅ User found by Firebase UID:", user.name)
        return user
      }
    }

    // Method 2: Try email from header
    const userEmail = request.headers.get("x-user-email")
    if (userEmail) {
      const user = await getEmployeeByAuth(undefined, userEmail)
      if (user) {
        console.log("✅ User found by email:", user.name)
        return user
      }
    }

    // Method 3: Try to extract from Authorization header (if using Firebase tokens)
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // TODO: Implement Firebase token verification here
      console.log("🔍 Found Bearer token, but verification not implemented yet")
    }

    // Method 4: For testing, check for a test user header
    const testUser = request.headers.get("x-test-user")
    if (testUser) {
      const user = await getEmployeeByAuth(undefined, testUser)
      if (user) {
        console.log("🧪 Test user found:", user.name)
        return user
      }
    }

    console.log("❌ No authenticated user found in request")
    return null
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

// GET /api/sales/prospects - Get prospects with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const salespersonId = searchParams.get("salesperson_id")
    const userEmail = request.headers.get("x-user-email")
    const viewAll = searchParams.get("view_all") === "true"

    console.log("🔍 Prospects API called with:", { salespersonId, userEmail, viewAll })

    // Get current user to determine access level
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let whereClause = ""
    let queryParams: any[] = []

    // Role-based access control
    const canViewAll = ["super_admin", "sales_manager", "admin"].includes(currentUser.role)

    if (viewAll && canViewAll) {
      // Super admin, sales manager, admin can see all prospects
      console.log(`🔓 ${currentUser.role} viewing all prospects`)
      whereClause = "" // No filtering
    } else if (salespersonId) {
      // Specific salesperson filter
      whereClause = "WHERE p.assigned_salesperson_id = $1"
      queryParams = [Number.parseInt(salespersonId)]
    } else {
      // Regular employees see only their own prospects
      whereClause = "WHERE p.assigned_salesperson_id = $1"
      queryParams = [currentUser.id]
      console.log(`🔒 ${currentUser.role} viewing own prospects only (ID: ${currentUser.id})`)
    }

    const result = await query(
      `SELECT 
        p.*,
        e.full_name as assigned_salesperson_name,
        e.email as assigned_salesperson_email,
        e.role as assigned_salesperson_role,
        d.name as assigned_salesperson_department
       FROM prospects p
       LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      queryParams,
    )

    console.log(`📊 Found ${result.rows.length} prospects for ${currentUser.name} (${currentUser.role})`)

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      user_role: currentUser.role,
      can_view_all: canViewAll,
    })
  } catch (error) {
    console.error("❌ Error fetching prospects:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prospects",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST /api/sales/prospects - Create new prospect (assigned to creator)
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const body = await request.json()
    console.log("📝 Creating prospect with data:", body)

    const {
      business_name,
      place_id,
      address,
      phone,
      website,
      industry,
      contact_name,
      contact_email,
      estimated_value,
      priority = "medium",
      notes,
      services = [],
      // Allow manual assignment for testing
      assigned_salesperson_id,
    } = body

    // Validation
    if (!business_name?.trim()) {
      return NextResponse.json({ success: false, error: "Business name is required" }, { status: 400 })
    }

    // Get current user (the person creating the prospect)
    const currentUser = await getCurrentUser(request)

    // If no authenticated user found, use the manually assigned salesperson or default to Ada
    let finalSalespersonId = assigned_salesperson_id || 7 // Default to Ada for now

    if (currentUser) {
      // IMPORTANT: The prospect is assigned to the person who creates it
      finalSalespersonId = currentUser.id
      console.log(`🔍 Assigning prospect to authenticated creator: ${currentUser.name} (ID: ${finalSalespersonId})`)
    } else {
      console.log(`⚠️ No authenticated user found, using assigned_salesperson_id: ${finalSalespersonId}`)
    }

    await client.query("BEGIN")

    // Insert prospect - assigned to the creator or specified salesperson
    const prospectResult = await client.query(
      `INSERT INTO prospects (
        business_name, place_id, formatted_address, phone, website, business_type,
        contact_name, contact_email, assigned_salesperson_id, priority, 
        estimated_value, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        business_name.trim(),
        place_id || null,
        address || null,
        phone || null,
        website || null,
        industry || null,
        contact_name?.trim() || null,
        contact_email?.toLowerCase().trim() || null,
        finalSalespersonId,
        priority,
        Number.parseFloat(estimated_value?.toString() || "0") || 0,
        notes || null,
        "new",
      ],
    )

    const prospect = prospectResult.rows[0]

    // Add services to prospect if provided
    if (services && services.length > 0) {
      for (const serviceId of services) {
        await client.query(
          `INSERT INTO prospect_services (prospect_id, service_id, quantity)
           VALUES ($1, $2, $3)`,
          [prospect.id, serviceId, 1],
        )
      }
    }

    // Log initial activity
    await client.query(
      `INSERT INTO sales_activities (prospect_id, employee_id, activity_type, subject, description, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        prospect.id,
        finalSalespersonId,
        "prospect_created",
        "New prospect created",
        `Prospect ${business_name} created ${currentUser ? `by ${currentUser.name}` : "via API"} with ${services.length} services assigned`,
      ],
    )

    await client.query("COMMIT")

    // Log the prospect creation in audit log
    if (currentUser) {
      await AuditLogger.logProspectCreation(currentUser.id, currentUser.name, currentUser.role, prospect.id, {
        business_name,
        contact_name,
        contact_email,
        assigned_salesperson_id: finalSalespersonId,
        estimated_value,
        priority,
        services_count: services.length,
      })
    }

    console.log("✅ Prospect created successfully with ID:", prospect.id)

    return NextResponse.json({
      success: true,
      data: prospect,
      message: `Prospect created successfully and assigned to ${currentUser ? currentUser.name : `employee ID ${finalSalespersonId}`}`,
      debug: {
        authenticated_user: currentUser ? currentUser.name : "None",
        assigned_to_id: finalSalespersonId,
      },
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating prospect:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create prospect",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// PUT /api/sales/prospects - Update prospect with ownership change restrictions
export async function PUT(request: NextRequest) {
  const client = await getClient()

  try {
    const body = await request.json()
    const { id, assigned_salesperson_id, change_reason, ...otherFields } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Prospect ID is required" }, { status: 400 })
    }

    // Get current user
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    await client.query("BEGIN")

    // Get current prospect data
    const currentProspectResult = await client.query("SELECT * FROM prospects WHERE id = $1", [id])
    const currentProspect = currentProspectResult.rows[0]

    if (!currentProspect) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Prospect not found" }, { status: 404 })
    }

    // Check if ownership is being changed
    const isOwnershipChange =
      assigned_salesperson_id && assigned_salesperson_id !== currentProspect.assigned_salesperson_id

    // Only allow ownership changes by super_admin or sales_manager
    if (isOwnershipChange) {
      const allowedRoles = ["super_admin", "sales_manager"]
      if (!allowedRoles.includes(currentUser.role)) {
        await client.query("ROLLBACK")
        return NextResponse.json(
          {
            success: false,
            error: "Only Super Admin or Sales Manager can change prospect ownership",
          },
          { status: 403 },
        )
      }

      // Log the ownership change
      await AuditLogger.logProspectOwnershipChange(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        id,
        currentProspect.assigned_salesperson_id,
        assigned_salesperson_id,
        change_reason || "Ownership reassignment",
      )
    }

    // Update prospect
    const updateFields = []
    const updateValues = []
    let paramCount = 0

    for (const [key, value] of Object.entries(otherFields)) {
      if (value !== undefined) {
        paramCount++
        updateFields.push(`${key} = $${paramCount}`)
        updateValues.push(value)
      }
    }

    if (assigned_salesperson_id) {
      paramCount++
      updateFields.push(`assigned_salesperson_id = $${paramCount}`)
      updateValues.push(assigned_salesperson_id)
    }

    paramCount++
    updateFields.push(`updated_at = $${paramCount}`)
    updateValues.push(new Date())

    updateValues.push(id) // For WHERE clause

    const updateQuery = `
      UPDATE prospects 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `

    const result = await client.query(updateQuery, updateValues)

    await client.query("COMMIT")

    // Log the general update
    await AuditLogger.log({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "UPDATE",
      tableName: "prospects",
      recordId: id,
      actionDescription: `Updated prospect: ${currentProspect.business_name}`,
      oldValues: currentProspect,
      newValues: result.rows[0],
      businessContext: "sales_pipeline",
      severityLevel: isOwnershipChange ? "warning" : "info",
    })

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: isOwnershipChange ? "Prospect ownership changed successfully" : "Prospect updated successfully",
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error updating prospect:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update prospect",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
