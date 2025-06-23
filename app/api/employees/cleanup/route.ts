import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST() {
  try {
    console.log("🧹 Starting cleanup of default sample employees...")

    // Get current state before cleanup
    const beforeResult = await query(`
      SELECT 
        id, full_name, email, role, status,
        CASE 
          WHEN email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com') 
          THEN 'DEFAULT_SAMPLE' 
          ELSE 'REAL_EMPLOYEE' 
        END as employee_type
      FROM employees 
      ORDER BY id
    `)

    console.log("📊 Employees before cleanup:", beforeResult.rows)

    // Update prospects assigned to default employees
    await query(`
      UPDATE prospects 
      SET assigned_salesperson_id = 7 
      WHERE assigned_salesperson_id IN (
        SELECT id FROM employees 
        WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
      )
    `)

    // Update commissions
    await query(`
      UPDATE commissions 
      SET salesperson_id = 7 
      WHERE salesperson_id IN (
        SELECT id FROM employees 
        WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
      )
    `)

    // Update business clients
    await query(`
      UPDATE business_clients 
      SET sales_rep_id = 7 
      WHERE sales_rep_id IN (
        SELECT id FROM employees 
        WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
      )
    `)

    // Clean up related records
    await query(
      `DELETE FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))`,
    )
    await query(
      `DELETE FROM employee_sessions WHERE employee_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))`,
    )
    await query(
      `DELETE FROM sales_activities WHERE employee_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))`,
    )
    await query(
      `DELETE FROM email_logs WHERE employee_id IN (SELECT id FROM employees WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com'))`,
    )

    // Delete the default employees
    const deleteResult = await query(`
      DELETE FROM employees 
      WHERE email IN ('sarah@gladgrade.com', 'mike@gladgrade.com', 'lisa@gladgrade.com')
      RETURNING id, full_name, email
    `)

    console.log("🗑️ Deleted employees:", deleteResult.rows)

    // Update department counts
    await query(`
      UPDATE departments SET employee_count = (
        SELECT COUNT(*) FROM employees WHERE department_id = departments.id AND status = 'active'
      )
    `)

    // Get final state
    const afterResult = await query(`
      SELECT id, full_name, email, role, status, department_id, created_at
      FROM employees 
      ORDER BY id
    `)

    const departmentCounts = await query(`
      SELECT 
        d.name as department_name,
        d.employee_count as recorded_count,
        COUNT(e.id) as actual_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id, d.name, d.employee_count
      ORDER BY d.name
    `)

    console.log("✅ Cleanup completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Default sample employees removed successfully!",
      data: {
        employees_before: beforeResult.rows,
        employees_deleted: deleteResult.rows,
        employees_after: afterResult.rows,
        department_counts: departmentCounts.rows,
      },
    })
  } catch (error: unknown) {
    console.error("❌ Error during cleanup:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup default employees",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
