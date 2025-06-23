import { type NextRequest, NextResponse } from "next/server"
import { getEmployeeByAuth } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firebase_uid, method } = body

    console.log("🧪 Testing user detection:", { email, firebase_uid, method })

    let result = null
    const testMethod = method || "email"

    // Test different methods
    if (testMethod === "email" || testMethod === "both") {
      if (email) {
        console.log("🔍 Testing email lookup:", email)
        result = await getEmployeeByAuth(undefined, email)
        if (result) {
          console.log("✅ Found user by email:", result.name)
        } else {
          console.log("❌ No user found by email")
        }
      }
    }

    if ((testMethod === "firebase_uid" || testMethod === "both") && !result) {
      if (firebase_uid) {
        console.log("🔍 Testing Firebase UID lookup:", firebase_uid)
        result = await getEmployeeByAuth(firebase_uid)
        if (result) {
          console.log("✅ Found user by Firebase UID:", result.name)
        } else {
          console.log("❌ No user found by Firebase UID")
        }
      }
    }

    return NextResponse.json({
      success: true,
      method: testMethod,
      input: { email, firebase_uid },
      result,
      found: !!result,
      debug: {
        email_provided: !!email,
        firebase_uid_provided: !!firebase_uid,
        lookup_method: testMethod,
      },
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

export async function GET(request: NextRequest) {
  try {
    // Get all active employees for reference
    const { query } = await import("@/lib/database")

    const employeesResult = await query(
      `SELECT id, full_name, email, role, status, department_id,
              d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.status = 'active' 
       ORDER BY id`,
    )

    return NextResponse.json({
      success: true,
      active_employees: employeesResult.rows,
      total_count: employeesResult.rows.length,
      message: "Active employees retrieved successfully",
    })
  } catch (error) {
    console.error("❌ Error getting employees:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get employees",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
