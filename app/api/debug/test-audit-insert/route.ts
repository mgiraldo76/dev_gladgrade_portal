import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST() {
  try {
    console.log("🧪 Testing direct audit log insert...")

    // Test the exact same insert that's failing
    const result = await query(
      `
      INSERT INTO audit_logs (
        user_id, user_email, user_name, user_role,
        action_type, table_name, record_id, action_description,
        old_values, new_values, changed_fields,
        ip_address, user_agent,
        business_context, severity_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `,
      [
        4, // user_id
        "miguel.giraldo@gladgrade.com", // user_email
        "Miguel Giraldo", // user_name
        "super_admin", // user_role
        "CREATE", // action_type - this should be allowed!
        "prospects", // table_name
        999, // record_id (fake)
        "Test audit log creation", // action_description
        null, // old_values
        JSON.stringify({ test: true }), // new_values
        null, // changed_fields
        null, // ip_address
        null, // user_agent
        "sales_pipeline", // business_context
        "info", // severity_level
      ],
    )

    return NextResponse.json({
      success: true,
      audit_log_id: result.rows[0].id,
      message: "Direct audit insert successful!",
      debug: "This proves the constraint allows CREATE action_type",
    })
  } catch (error: unknown) {
    console.error("❌ Direct audit insert failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        debug: "This will show us the exact error",
      },
      { status: 500 },
    )
  }
}
