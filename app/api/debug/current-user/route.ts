import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// GET /api/debug/current-user - Debug current user and employee setup
export async function GET() {
  try {
    console.log("🔍 Debugging current user setup...")

    // Get all employees using the correct schema
    const employeesResult = await query(`
      SELECT e.id, e.full_name, e.email, e.department_id, e.role, e.status,
             d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.id
    `)

    // Get departments
    const departmentsResult = await query(`SELECT * FROM departments ORDER BY id`)

    // Get prospects and their assignments using correct schema
    const prospectsResult = await query(`
      SELECT p.id, p.business_name, p.assigned_salesperson_id, p.status,
             e.full_name as salesperson_name
      FROM prospects p
      LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `)

    // Find Ada specifically using the correct column name
    const adaResult = await query(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE LOWER(e.full_name) LIKE '%ada%' OR LOWER(e.email) LIKE '%ada%'
    `)

    // Get sales department info
    const salesDeptResult = await query(`
      SELECT d.*, COUNT(e.id) as actual_employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE LOWER(d.name) = 'sales'
      GROUP BY d.id
    `)

    return NextResponse.json({
      success: true,
      data: {
        employees: employeesResult.rows,
        departments: departmentsResult.rows,
        recent_prospects: prospectsResult.rows,
        ada_records: adaResult.rows,
        sales_department: salesDeptResult.rows,
        total_employees: employeesResult.rows.length,
        total_prospects: prospectsResult.rows.length,
        schema_info: {
          employee_name_column: "full_name",
          prospect_assignment_column: "assigned_salesperson_id",
          client_sales_rep_column: "sales_rep_id",
        },
      },
      message: "Current user debug data with correct schema",
    })
  } catch (error: unknown) {
    console.error("❌ Error debugging current user:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to debug current user",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
