import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

// GET /api/employees/enhanced - Get employees with roles and positions
export async function GET() {
  try {
    console.log("👥 Fetching enhanced employees with roles and positions...")

    const result = await query(`
      SELECT
        e.id,
        e.firebase_uid,
        e.email,
        e.full_name,
        e.department_id,
        d.name as department_name,
        e.role as legacy_role,
        e.status,
        e.hire_date,
        e.last_login,
        e.sales_quota,
        e.commission_rate,
        
        -- Primary Role
        pr.id as primary_role_id,
        pr.name as primary_role_name,
        pr.description as primary_role_description,
        pr.is_sales_role as primary_is_sales,
        pr.permissions as primary_permissions,
        
        -- Company Position
        cp.id as position_id,
        cp.title as position_title,
        cp.level as position_level,
        cp.additional_permissions as position_permissions,
        cp.can_access_sales as position_sales_access,
        
        -- Secondary Roles (aggregated)
        COALESCE(
          ARRAY_AGG(sr.name) FILTER (WHERE sr.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as secondary_roles,
        
        -- Combined permissions
        COALESCE(pr.permissions, ARRAY[]::text[]) || 
        COALESCE(cp.additional_permissions, ARRAY[]::text[]) as all_permissions,
        
        -- Sales access determination
        CASE 
          WHEN pr.is_sales_role = TRUE OR cp.can_access_sales = TRUE OR cp.title = 'CEO' 
          THEN TRUE 
          ELSE FALSE 
        END as has_sales_access,
        
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN roles pr ON e.primary_role_id = pr.id
      LEFT JOIN company_positions cp ON e.company_position_id = cp.id
      LEFT JOIN LATERAL unnest(COALESCE(e.secondary_role_ids, ARRAY[]::integer[])) AS sr_id ON true
      LEFT JOIN roles sr ON sr.id = sr_id
      GROUP BY e.id, d.name, pr.id, pr.name, pr.description, pr.is_sales_role, pr.permissions, 
               cp.id, cp.title, cp.level, cp.additional_permissions, cp.can_access_sales
      ORDER BY e.full_name
    `)

    console.log(`✅ Found ${result.rows.length} enhanced employees`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching enhanced employees:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch enhanced employees",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// PUT /api/employees/enhanced - Update employee with roles and position
export async function PUT(request: NextRequest) {
  const client = await getClient()

  try {
    const {
      id,
      email,
      full_name,
      department_id,
      primary_role_id,
      secondary_role_ids = [],
      company_position_id,
      sales_quota = 0,
      commission_rate = 0,
      status,
    } = await request.json()

    if (!id || !email || !full_name || !primary_role_id) {
      return NextResponse.json(
        { success: false, error: "Employee ID, email, full name, and primary role are required" },
        { status: 400 },
      )
    }

    console.log(`🔄 Updating enhanced employee ${id}: ${full_name}`)

    await client.query("BEGIN")

    // Update employee with enhanced fields
    await client.query(
      `UPDATE employees 
       SET email = $1, full_name = $2, department_id = $3, 
           primary_role_id = $4, secondary_role_ids = $5, company_position_id = $6,
           sales_quota = $7, commission_rate = $8, status = $9,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10`,
      [
        email.toLowerCase().trim(),
        full_name.trim(),
        department_id || null,
        primary_role_id,
        secondary_role_ids.length > 0 ? secondary_role_ids : null,
        company_position_id || null,
        sales_quota,
        commission_rate,
        status,
        id,
      ],
    )

    await client.query("COMMIT")

    // Fetch updated employee with all related data
    const result = await query(
      `SELECT
        e.id, e.firebase_uid, e.email, e.full_name, e.department_id,
        d.name as department_name, e.status, e.sales_quota, e.commission_rate,
        pr.name as primary_role_name, pr.is_sales_role,
        cp.title as position_title, cp.can_access_sales,
        CASE 
          WHEN pr.is_sales_role = TRUE OR cp.can_access_sales = TRUE OR cp.title = 'CEO' 
          THEN TRUE 
          ELSE FALSE 
        END as has_sales_access
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN roles pr ON e.primary_role_id = pr.id
      LEFT JOIN company_positions cp ON e.company_position_id = cp.id
      WHERE e.id = $1`,
      [id],
    )

    console.log("✅ Enhanced employee updated successfully:", result.rows[0])

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error updating enhanced employee:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update enhanced employee",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
