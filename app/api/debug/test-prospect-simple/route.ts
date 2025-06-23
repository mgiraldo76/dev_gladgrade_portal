import { NextResponse } from "next/server"
import { getClient } from "@/lib/database"

export async function POST() {
  const client = await getClient()

  try {
    console.log("🧪 Testing simple prospect creation WITHOUT audit logging...")

    await client.query("BEGIN")

    // Create prospect without any audit logging
    const prospectResult = await client.query(
      `INSERT INTO prospects (
        business_name, formatted_address, contact_name, contact_email, 
        assigned_salesperson_id, priority, estimated_value, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        "Test Business Simple",
        "Test Address",
        "Test Contact",
        "test@example.com",
        4, // Miguel's ID
        "medium",
        100,
        "Simple test without audit logging",
        "new",
      ],
    )

    const prospect = prospectResult.rows[0]

    await client.query("COMMIT")

    return NextResponse.json({
      success: true,
      prospect_id: prospect.id,
      message: "Simple prospect creation successful!",
      debug: "This tests if the issue is in prospect creation or audit logging",
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Simple prospect creation failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        debug: "If this fails, the issue is in prospect creation, not audit logging",
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
