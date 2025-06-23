import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Test endpoint to verify user detection logic
export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing user detection...")

    // Get all request headers for debugging
    const headers = Object.fromEntries(request.headers.entries())

    // Check for various auth methods
    const authHeader = request.headers.get("authorization")
    const userEmail = request.headers.get("x-user-email")
    const cookieEmail = request.cookies.get("user-email")?.value

    // Get all active employees for reference
    const employeesResult = await query(
      `SELECT id, full_name, email, role, status, department_id 
       FROM employees 
       WHERE status = 'active' 
       ORDER BY id`,
    )

    const testResults = {
      timestamp: new Date().toISOString(),
      request_info: {
        method: request.method,
        url: request.url,
        user_agent: request.headers.get("user-agent"),
      },
      auth_detection: {
        authorization_header: authHeader ? "Present" : "Missing",
        x_user_email_header: userEmail || "Missing",
        user_email_cookie: cookieEmail || "Missing",
      },
      all_headers: headers,
      active_employees: employeesResult.rows,
      test_scenarios: [
        {
          scenario: "Ada Fernandez Login",
          email: "aditafernandez.af@gmail.com",
          expected_id: 7,
          expected_name: "Ada Fernandez",
          expected_role: "employee",
        },
        {
          scenario: "Miguel Giraldo Login",
          email: "miguel.giraldo@gladgrade.com",
          expected_id: 4,
          expected_name: "Miguel Giraldo",
          expected_role: "super_admin",
        },
        {
          scenario: "Patrick Doliny Login",
          email: "patrick.doliny@gladgrade.com",
          expected_id: 6,
          expected_name: "Patrick Doliny",
          expected_role: "admin",
        },
      ],
      current_implementation_issue: {
        problem: "getCurrentUser() is hardcoded to return Ada Fernandez",
        impact: "All prospects get assigned to Ada regardless of who creates them",
        solution: "Need to implement proper Firebase Auth token verification",
      },
      next_steps: [
        "1. Implement Firebase Admin SDK token verification",
        "2. Extract user email from verified Firebase token",
        "3. Look up employee record by email",
        "4. Return actual logged-in user info",
        "5. Test with different user logins",
      ],
    }

    return NextResponse.json({
      success: true,
      data: testResults,
      message: "User detection test completed",
    })
  } catch (error) {
    console.error("❌ Error in user detection test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST method to test user detection with different scenarios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_email } = body

    if (!test_email) {
      return NextResponse.json({ success: false, error: "test_email is required" }, { status: 400 })
    }

    console.log("🧪 Testing user lookup for email:", test_email)

    // Look up the employee by email (this is what getCurrentUser should do)
    const result = await query(
      `SELECT id, full_name, email, role, status, department_id,
              d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.email = $1 AND e.status = 'active'`,
      [test_email.toLowerCase()],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No active employee found for email: ${test_email}`,
        test_result: "FAIL - User not found",
      })
    }

    const employee = result.rows[0]

    return NextResponse.json({
      success: true,
      message: `Employee found successfully`,
      test_result: "PASS - User detected",
      user_data: {
        id: employee.id,
        name: employee.full_name,
        email: employee.email,
        role: employee.role,
        department: employee.department_name,
        status: employee.status,
      },
      prospect_assignment: {
        would_assign_to: employee.full_name,
        would_assign_id: employee.id,
        can_create_prospects: true,
        can_reassign_prospects: ["super_admin", "sales_manager"].includes(employee.role),
      },
    })
  } catch (error) {
    console.error("❌ Error in POST user detection test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
