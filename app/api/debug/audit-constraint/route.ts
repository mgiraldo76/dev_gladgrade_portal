import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Check constraint definition
    const constraintResult = await query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'audit_logs_action_type_check'
    `)

    // Check existing action types
    const actionTypesResult = await query(`
      SELECT DISTINCT action_type, COUNT(*) 
      FROM audit_logs 
      GROUP BY action_type
      ORDER BY action_type
    `)

    return NextResponse.json({
      success: true,
      constraint: constraintResult.rows[0] || null,
      existing_action_types: actionTypesResult.rows,
      debug: "Checking audit_logs constraint and existing data",
    })
  } catch (error: unknown) {
    console.error("❌ Error checking audit constraint:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
