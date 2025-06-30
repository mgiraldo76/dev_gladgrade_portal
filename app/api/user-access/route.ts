import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()
    
    if (!userId && !email) {
      return NextResponse.json({ hasClientAccess: false })
    }

    // Check if user exists in employees table by ID or email
    let whereClause = "WHERE e.id = $1"
    let param = userId
    
    if (!userId && email) {
      whereClause = "WHERE e.email = $1"
      param = email.toLowerCase()
    }

    const result = await query(`
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
    `, [param])

    const userRecord = result.rows[0]
    const isEmployee = userRecord?.is_employee || false
    const hasAccess = isEmployee && (userRecord?.has_client_access || false)

    return NextResponse.json({ 
      hasClientAccess: hasAccess,
      isEmployee: isEmployee,
      userInfo: userRecord || null
    })
  } catch (error) {
    console.error("Error checking user access:", error)
    return NextResponse.json({ 
      hasClientAccess: false,
      isEmployee: false 
    })
  }
}