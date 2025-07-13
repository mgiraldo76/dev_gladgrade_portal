import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

// Mock data for demonstration
const mockDepartments = [
  {
    id: 1,
    name: "Content Moderation",
    employee_count: 8,
    permissions: ["content_moderation", "review_management", "image_approval"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Customer Support",
    employee_count: 12,
    permissions: ["customer_support", "basic_reports"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Operations",
    employee_count: 5,
    permissions: ["full_access", "system_admin", "user_management"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// GET /api/settings/departments
export async function GET() {
  try {
    console.log("📊 Fetching departments from PostgreSQL...")

    const result = await query(`
      SELECT
        d.id,
        d.name,
        d.employee_count,
        d.created_at,
        d.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM departments d
      LEFT JOIN department_permissions dp ON d.id = dp.department_id
      LEFT JOIN permissions p ON dp.permission_id = p.id
      GROUP BY d.id, d.name, d.employee_count, d.created_at, d.updated_at
      ORDER BY d.name
    `)

    console.log(`✅ Found ${result.rows.length} departments`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching departments:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch departments from database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST /api/settings/departments
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const { name, employee_count = 0, permissions = ["basic_access"] } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 })
    }

    console.log(`🏢 Creating department: ${name} with ${permissions.length} permissions`)

    await client.query("BEGIN")

    // Insert department
    const deptResult = await client.query(
      "INSERT INTO departments (name, employee_count) VALUES ($1, $2) RETURNING *",
      [name.trim(), employee_count],
    )

    const department = deptResult.rows[0]

    // Insert permissions
    for (const permName of permissions) {
      await client.query(
        `
        INSERT INTO department_permissions (department_id, permission_id)
        SELECT $1, id FROM permissions WHERE name = $2
        ON CONFLICT (department_id, permission_id) DO NOTHING
      `,
        [department.id, permName],
      )
    }

    await client.query("COMMIT")

    // Fetch the complete department with permissions
    const completeResult = await query(
      `
      SELECT
        d.id,
        d.name,
        d.employee_count,
        d.created_at,
        d.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM departments d
      LEFT JOIN department_permissions dp ON d.id = dp.department_id
      LEFT JOIN permissions p ON dp.permission_id = p.id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.employee_count, d.created_at, d.updated_at
    `,
      [department.id],
    )

    console.log("✅ Department created successfully:", completeResult.rows[0])

    return NextResponse.json({
      success: true,
      data: completeResult.rows[0],
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating department:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorCode = error && typeof error === "object" && "code" in error ? (error as any).code : null

    if (errorCode === "23505") {
      // Unique constraint violation
      return NextResponse.json({ success: false, error: "Department name already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create department",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// PUT /api/settings/departments
export async function PUT(request: NextRequest) {
  const client = await getClient()

  try {
    const { id, name, employee_count, permissions } = await request.json()

    if (!id || !name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Department ID and name are required" }, { status: 400 })
    }

    console.log(`🔄 Updating department ${id}: ${name}`)

    await client.query("BEGIN")

    // Update department
    await client.query(
      "UPDATE departments SET name = $1, employee_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [name.trim(), employee_count, id],
    )

    // Update permissions - remove all existing and add new ones
    await client.query("DELETE FROM department_permissions WHERE department_id = $1", [id])

    for (const permName of permissions) {
      await client.query(
        `
        INSERT INTO department_permissions (department_id, permission_id)
        SELECT $1, id FROM permissions WHERE name = $2
        ON CONFLICT (department_id, permission_id) DO NOTHING
      `,
        [id, permName],
      )
    }

    await client.query("COMMIT")

    // Fetch the updated department with permissions
    const result = await query(
      `
      SELECT
        d.id,
        d.name,
        d.employee_count,
        d.created_at,
        d.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM departments d
      LEFT JOIN department_permissions dp ON d.id = dp.department_id
      LEFT JOIN permissions p ON dp.permission_id = p.id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.employee_count, d.created_at, d.updated_at
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 })
    }

    console.log("✅ Department updated successfully:", result.rows[0])

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error updating department:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update department",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// DELETE /api/settings/departments/[id]
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = Number.parseInt(url.searchParams.get("id") || "0")

    if (!id) {
      return NextResponse.json({ success: false, error: "Department ID is required" }, { status: 400 })
    }

    console.log(`🗑️ Deleting department ${id}`)

    // Get department info before deletion
    const deptResult = await query("SELECT * FROM departments WHERE id = $1", [id])

    if (deptResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 })
    }

    const department = deptResult.rows[0]

    // Delete department (CASCADE will handle department_permissions)
    await query("DELETE FROM departments WHERE id = $1", [id])

    console.log("✅ Department deleted successfully:", department)

    return NextResponse.json({
      success: true,
      data: department,
    })
  } catch (error: unknown) {
    console.error("❌ Error deleting department:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete department",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
