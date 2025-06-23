import { auth } from "@/services/firebase"
import { query } from "@/lib/database"
import type { User } from "firebase/auth"

// Type definitions
interface EmployeeData {
  id: number
  name: string
  email: string
  role: string
  status: string
  department_id: number | null
  department_name: string | null
}

// Get current user from Firebase Auth (client-side)
export async function getCurrentFirebaseUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Get employee data by Firebase UID or email
export async function getEmployeeByAuth(uid?: string, email?: string): Promise<EmployeeData | null> {
  try {
    console.log("🔍 getEmployeeByAuth called with:", { uid, email })

    let result

    if (uid) {
      console.log("🔍 Looking up by Firebase UID:", uid)
      result = await query(
        `SELECT e.id, e.full_name, e.email, e.role, e.status, e.department_id,
                d.name as department_name
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE e.firebase_uid = $1 AND e.status = 'active'`,
        [uid],
      )
      console.log("📊 UID lookup result:", result.rows.length, "rows")
    }

    // Fallback to email if UID lookup fails or no UID provided
    if ((!result || result.rows.length === 0) && email) {
      console.log("🔍 Looking up by email:", email)
      result = await query(
        `SELECT e.id, e.full_name, e.email, e.role, e.status, e.department_id,
                d.name as department_name
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE LOWER(e.email) = LOWER($1) AND e.status = 'active'`,
        [email],
      )
      console.log("📊 Email lookup result:", result.rows.length, "rows")
      if (result.rows.length > 0) {
        console.log("✅ Found employee:", result.rows[0])
      }
    }

    if (!result || result.rows.length === 0) {
      console.log("❌ No employee found")
      return null
    }

    const employee = result.rows[0]
    const employeeData = {
      id: employee.id,
      name: employee.full_name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      department_id: employee.department_id,
      department_name: employee.department_name,
    }

    console.log("✅ Returning employee data:", employeeData)
    return employeeData
  } catch (error) {
    console.error("❌ Error getting employee by auth:", error)
    return null
  }
}
