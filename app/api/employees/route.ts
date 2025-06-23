import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

// Import Firebase functions with error handling
let createFirebaseUser: any = null
let setCustomClaims: any = null
let deleteFirebaseUser: any = null

try {
  const firebaseAdmin = require("@/lib/firebase-admin")
  createFirebaseUser = firebaseAdmin.createFirebaseUser
  setCustomClaims = firebaseAdmin.setCustomClaims
  deleteFirebaseUser = firebaseAdmin.deleteFirebaseUser
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

// GET /api/employees
export async function GET() {
  try {
    console.log("👥 Fetching employees from PostgreSQL...")

    const result = await query(`
      SELECT
        e.id,
        e.firebase_uid,
        e.email,
        e.full_name,
        e.department_id,
        d.name as department_name,
        e.role,
        e.status,
        e.hire_date,
        e.last_login,
        e.created_at,
        e.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_permissions ep ON e.id = ep.employee_id
      LEFT JOIN permissions p ON ep.permission_id = p.id
      GROUP BY e.id, e.firebase_uid, e.email, e.full_name, e.department_id, d.name, e.role, e.status, e.hire_date, e.last_login, e.created_at, e.updated_at
      ORDER BY e.full_name
    `)

    console.log(`✅ Found ${result.rows.length} employees`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching employees:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch employees from database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST /api/employees
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const {
      email,
      full_name,
      department_id,
      role = "employee",
      permissions = ["basic_access"],
      create_firebase_account = true,
      temporary_password,
    } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json({ success: false, error: "Email and full name are required" }, { status: 400 })
    }

    console.log(`👤 Creating employee: ${full_name} (${email})`)

    await client.query("BEGIN")

    let firebaseUid = null
    let firebaseAccountCreated = false

    // Create Firebase user if requested and available
    if (create_firebase_account && createFirebaseUser) {
      try {
        console.log("🔥 Creating Firebase Authentication user...")

        const firebaseUser = await createFirebaseUser({
          email: email.toLowerCase().trim(),
          displayName: full_name.trim(),
          password: temporary_password || generateTemporaryPassword(),
          emailVerified: true, // Auto-verify for employees
        })

        firebaseUid = firebaseUser.uid
        firebaseAccountCreated = true
        console.log(`✅ Firebase user created with UID: ${firebaseUid}`)

        // Set custom claims for role-based access
        if (setCustomClaims) {
          await setCustomClaims(firebaseUid, {
            role: role,
            employee_id: null, // Will update after DB insert
            department_id: department_id,
            permissions: permissions,
          })

          console.log(`✅ Custom claims set for Firebase user`)
        }
      } catch (firebaseError: unknown) {
        await client.query("ROLLBACK")
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : "Unknown Firebase error"
        console.error("❌ Firebase user creation failed:", errorMessage)

        return NextResponse.json(
          {
            success: false,
            error: "Failed to create Firebase user",
            details: errorMessage,
          },
          { status: 500 },
        )
      }
    } else if (create_firebase_account && !createFirebaseUser) {
      console.log("⚠️ Firebase account requested but Firebase Admin SDK not available")
    }

    // Insert employee in PostgreSQL
    const empResult = await client.query(
      `INSERT INTO employees (firebase_uid, email, full_name, department_id, role, status) 
       VALUES ($1, $2, $3, $4, $5, 'active') 
       RETURNING *`,
      [firebaseUid, email.toLowerCase().trim(), full_name.trim(), department_id || null, role],
    )

    const employee = empResult.rows[0]

    // Update Firebase custom claims with employee_id
    if (firebaseUid && setCustomClaims) {
      await setCustomClaims(firebaseUid, {
        role: role,
        employee_id: employee.id,
        department_id: department_id,
        permissions: permissions,
      })
    }

    // Insert permissions
    for (const permName of permissions) {
      await client.query(
        `INSERT INTO employee_permissions (employee_id, permission_id)
         SELECT $1, id FROM permissions WHERE name = $2
         ON CONFLICT (employee_id, permission_id) DO NOTHING`,
        [employee.id, permName],
      )
    }

    // Update department employee count
    if (department_id) {
      await client.query(
        `UPDATE departments SET employee_count = (
           SELECT COUNT(*) FROM employees WHERE department_id = $1 AND status = 'active'
         ) WHERE id = $1`,
        [department_id],
      )
    }

    await client.query("COMMIT")

    // Fetch the complete employee with department and permissions
    const completeResult = await query(
      `SELECT
        e.id, e.firebase_uid, e.email, e.full_name, e.department_id,
        d.name as department_name, e.role, e.status, e.hire_date,
        e.last_login, e.created_at, e.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_permissions ep ON e.id = ep.employee_id
      LEFT JOIN permissions p ON ep.permission_id = p.id
      WHERE e.id = $1
      GROUP BY e.id, e.firebase_uid, e.email, e.full_name, e.department_id, d.name, e.role, e.status, e.hire_date, e.last_login, e.created_at, e.updated_at`,
      [employee.id],
    )

    console.log("✅ Employee created successfully:", completeResult.rows[0])

    return NextResponse.json({
      success: true,
      data: completeResult.rows[0],
      firebase_account_created: firebaseAccountCreated,
      temporary_password: firebaseAccountCreated ? temporary_password || "Auto-generated" : null,
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating employee:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorCode = error && typeof error === "object" && "code" in error ? (error as any).code : null

    if (errorCode === "23505") {
      return NextResponse.json({ success: false, error: "Employee email already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create employee",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// PUT /api/employees
export async function PUT(request: NextRequest) {
  const client = await getClient()

  try {
    const { id, email, full_name, department_id, role, status, permissions } = await request.json()

    if (!id || !email || !full_name) {
      return NextResponse.json(
        { success: false, error: "Employee ID, email, and full name are required" },
        { status: 400 },
      )
    }

    console.log(`🔄 Updating employee ${id}: ${full_name}`)

    await client.query("BEGIN")

    // Get current employee data
    const currentEmpResult = await client.query("SELECT * FROM employees WHERE id = $1", [id])
    const currentEmployee = currentEmpResult.rows[0]

    if (!currentEmployee) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    const oldDepartmentId = currentEmployee.department_id

    // Update employee in PostgreSQL
    await client.query(
      `UPDATE employees 
       SET email = $1, full_name = $2, department_id = $3, role = $4, status = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6`,
      [email.toLowerCase().trim(), full_name.trim(), department_id || null, role, status, id],
    )

    // Update Firebase custom claims if Firebase UID exists and function available
    if (currentEmployee.firebase_uid && setCustomClaims) {
      try {
        await setCustomClaims(currentEmployee.firebase_uid, {
          role: role,
          employee_id: id,
          department_id: department_id,
          permissions: permissions || [],
        })
        console.log(`✅ Firebase custom claims updated for UID: ${currentEmployee.firebase_uid}`)
      } catch (firebaseError) {
        console.error("⚠️ Failed to update Firebase custom claims:", firebaseError)
        // Continue with database update even if Firebase fails
      }
    }

    // Update permissions
    await client.query("DELETE FROM employee_permissions WHERE employee_id = $1", [id])

    for (const permName of permissions || []) {
      await client.query(
        `INSERT INTO employee_permissions (employee_id, permission_id)
         SELECT $1, id FROM permissions WHERE name = $2
         ON CONFLICT (employee_id, permission_id) DO NOTHING`,
        [id, permName],
      )
    }

    // Update department employee counts
    const departmentsToUpdate = [oldDepartmentId, department_id].filter(Boolean)
    for (const deptId of departmentsToUpdate) {
      await client.query(
        `UPDATE departments SET employee_count = (
           SELECT COUNT(*) FROM employees WHERE department_id = $1 AND status = 'active'
         ) WHERE id = $1`,
        [deptId],
      )
    }

    await client.query("COMMIT")

    // Fetch updated employee
    const result = await query(
      `SELECT
        e.id, e.firebase_uid, e.email, e.full_name, e.department_id,
        d.name as department_name, e.role, e.status, e.hire_date,
        e.last_login, e.created_at, e.updated_at,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL), 
          ARRAY[]::text[]
        ) as permissions
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_permissions ep ON e.id = ep.employee_id
      LEFT JOIN permissions p ON ep.permission_id = p.id
      WHERE e.id = $1
      GROUP BY e.id, e.firebase_uid, e.email, e.full_name, e.department_id, d.name, e.role, e.status, e.hire_date, e.last_login, e.created_at, e.updated_at`,
      [id],
    )

    console.log("✅ Employee updated successfully:", result.rows[0])

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error updating employee:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update employee",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// DELETE /api/employees
export async function DELETE(request: NextRequest) {
  const client = await getClient()

  try {
    const url = new URL(request.url)
    const id = Number.parseInt(url.searchParams.get("id") || "0")

    if (!id) {
      return NextResponse.json({ success: false, error: "Employee ID is required" }, { status: 400 })
    }

    console.log(`🗑️ Deleting employee ${id}`)

    await client.query("BEGIN")

    // Get employee info before deletion
    const empResult = await client.query("SELECT * FROM employees WHERE id = $1", [id])

    if (empResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 })
    }

    const employee = empResult.rows[0]
    const departmentId = employee.department_id

    // Delete Firebase user if exists and function available
    if (employee.firebase_uid && deleteFirebaseUser) {
      try {
        await deleteFirebaseUser(employee.firebase_uid)
        console.log(`✅ Firebase user deleted: ${employee.firebase_uid}`)
      } catch (firebaseError) {
        console.error("⚠️ Failed to delete Firebase user:", firebaseError)
        // Continue with database deletion even if Firebase fails
      }
    }

    // Delete employee (CASCADE will handle employee_permissions)
    await client.query("DELETE FROM employees WHERE id = $1", [id])

    // Update department employee count
    if (departmentId) {
      await client.query(
        `UPDATE departments SET employee_count = (
           SELECT COUNT(*) FROM employees WHERE department_id = $1 AND status = 'active'
         ) WHERE id = $1`,
        [departmentId],
      )
    }

    await client.query("COMMIT")

    console.log("✅ Employee deleted successfully:", employee)

    return NextResponse.json({
      success: true,
      data: employee,
      firebase_account_deleted: !!employee.firebase_uid,
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error deleting employee:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete employee",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
