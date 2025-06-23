import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting employee lookup debug...")

    // Test 1: Get all employees
    const allEmployees = await query(`
      SELECT id, full_name, email, role, status, department_id, firebase_uid
      FROM employees 
      ORDER BY id
    `)

    console.log("📊 All employees:", allEmployees.rows)

    // Test 2: Get active employees only
    const activeEmployees = await query(`
      SELECT id, full_name, email, role, status, department_id, firebase_uid
      FROM employees 
      WHERE status = 'active'
      ORDER BY id
    `)

    console.log("✅ Active employees:", activeEmployees.rows)

    // Test 3: Test specific email lookups
    const miguelTest = await query(
      `
      SELECT id, full_name, email, role, status, department_id, firebase_uid
      FROM employees 
      WHERE email = $1
    `,
      ["miguel.giraldo@gladgrade.com"],
    )

    console.log("🔍 Miguel lookup:", miguelTest.rows)

    const adaTest = await query(
      `
      SELECT id, full_name, email, role, status, department_id, firebase_uid
      FROM employees 
      WHERE email = $1
    `,
      ["aditafernandez.af@gmail.com"],
    )

    console.log("🔍 Ada lookup:", adaTest.rows)

    // Test 4: Test case-insensitive lookup
    const miguelLowerTest = await query(
      `
      SELECT id, full_name, email, role, status, department_id, firebase_uid
      FROM employees 
      WHERE LOWER(email) = LOWER($1)
    `,
      ["miguel.giraldo@gladgrade.com"],
    )

    console.log("🔍 Miguel lowercase lookup:", miguelLowerTest.rows)

    return NextResponse.json({
      success: true,
      debug_results: {
        all_employees: {
          count: allEmployees.rows.length,
          data: allEmployees.rows,
        },
        active_employees: {
          count: activeEmployees.rows.length,
          data: activeEmployees.rows,
        },
        miguel_direct_lookup: {
          count: miguelTest.rows.length,
          data: miguelTest.rows,
        },
        ada_direct_lookup: {
          count: adaTest.rows.length,
          data: adaTest.rows,
        },
        miguel_case_insensitive: {
          count: miguelLowerTest.rows.length,
          data: miguelLowerTest.rows,
        },
      },
      test_queries: [
        "SELECT * FROM employees ORDER BY id",
        "SELECT * FROM employees WHERE status = 'active'",
        "SELECT * FROM employees WHERE email = 'miguel.giraldo@gladgrade.com'",
        "SELECT * FROM employees WHERE email = 'aditafernandez.af@gmail.com'",
      ],
    })
  } catch (error) {
    console.error("❌ Database debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("🧪 Testing specific email lookup:", email)

    // Test the exact query from auth-utils
    const result = await query(
      `
      SELECT id, full_name, email, role, status, department_id,
             d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.email = $1 AND e.status = 'active'
    `,
      [email.toLowerCase()],
    )

    console.log("📊 Query result:", result.rows)

    return NextResponse.json({
      success: true,
      email_tested: email,
      email_lowercase: email.toLowerCase(),
      query_result: {
        count: result.rows.length,
        data: result.rows,
      },
    })
  } catch (error) {
    console.error("❌ Email lookup test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Email lookup test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
