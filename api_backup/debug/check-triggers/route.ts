import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Check for triggers on prospects table
    const triggersResult = await query(`
      SELECT 
          t.trigger_name,
          t.event_manipulation,
          t.event_object_table,
          t.action_statement,
          t.action_timing,
          t.action_orientation
      FROM information_schema.triggers t
      WHERE t.event_object_table = 'prospects'
      ORDER BY t.trigger_name;
    `)

    // Check for audit-related functions
    const functionsResult = await query(`
      SELECT 
          p.proname as function_name,
          pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND (p.proname LIKE '%audit%' OR p.proname LIKE '%trigger%')
      ORDER BY p.proname;
    `)

    return NextResponse.json({
      success: true,
      triggers: triggersResult.rows,
      functions: functionsResult.rows,
      debug: "Looking for database triggers that might be causing the audit constraint violation",
    })
  } catch (error: unknown) {
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
