import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()
    
    console.log("🔍 API CALLED - User access check:", { userId, email })
    
    if (!userId && !email) {
      console.log("❌ No userId or email provided")
      return NextResponse.json({ hasClientAccess: false })
    }

    // Check if user exists in employees table by ID or email
    let whereClause = "WHERE e.id = $1"
    let param = userId
    
    if (!userId && email) {
      whereClause = "WHERE LOWER(e.email) = LOWER($1)"
      param = email
    }

    console.log("🔍 Query parameters:", { whereClause, param })

    const sqlQuery = `
      SELECT 
        e.id,
        e.email,
        e.full_name,
        d.name as department_name,
        cp.title as position_title,
        e.role as legacy_role,
        CASE 
          WHEN d.name = 'Sales' THEN TRUE
          WHEN cp.title IN ('CEO', 'CCO', 'Sales Manager') THEN TRUE
          ELSE FALSE 
        END as has_client_access,
        CASE 
          WHEN e.id IS NOT NULL THEN TRUE
          ELSE FALSE 
        END as is_employee
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN company_positions cp ON e.company_position_id = cp.id
      ${whereClause}
    `

    console.log("🔍 SQL Query:", sqlQuery)
    console.log("🔍 SQL Parameters:", [param])

    const result = await query(sqlQuery, [param])

    console.log("📊 Database query result:", {
      rowCount: result.rows.length,
      rows: result.rows
    })

    const userRecord = result.rows[0]
    const isEmployee = userRecord?.is_employee || false
    const hasAccess = isEmployee && (userRecord?.has_client_access || false)

    console.log("✅ Final calculation:", { 
      isEmployee, 
      hasAccess, 
      userRecord: userRecord || "NO RECORD FOUND"
    })

    const response = { 
      hasClientAccess: hasAccess,
      isEmployee: isEmployee,
      userInfo: userRecord || null
    }

    console.log("📤 API Response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ ERROR in user access API:", error)
    return NextResponse.json({ 
      hasClientAccess: false,
      isEmployee: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}