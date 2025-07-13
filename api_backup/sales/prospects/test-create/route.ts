import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/database"
import { getEmployeeByAuth } from "@/lib/auth-utils"
import AuditLogger from "@/lib/audit-logger"

export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const body = await request.json()
    console.log("🧪 Test prospect creation with data:", body)

    const {
      business_name,
      test_user_email,
      contact_name = "Test Contact",
      contact_email = "test@example.com",
      estimated_value = 100,
      priority = "medium",
      notes = "Test prospect created via test API",
    } = body

    // Validation
    if (!business_name?.trim()) {
      return NextResponse.json({ success: false, error: "Business name is required" }, { status: 400 })
    }

    if (!test_user_email?.trim()) {
      return NextResponse.json({ success: false, error: "test_user_email is required" }, { status: 400 })
    }

    // Get the test user (simulating authentication)
    console.log("🔍 Looking up test user:", test_user_email)
    const testUser = await getEmployeeByAuth(undefined, test_user_email)

    if (!testUser) {
      return NextResponse.json(
        {
          success: false,
          error: `No active employee found for email: ${test_user_email}`,
          available_employees: [
            "aditafernandez.af@gmail.com",
            "miguel.giraldo@gladgrade.com",
            "patrick.doliny@gladgrade.com",
          ],
        },
        { status: 404 },
      )
    }

    console.log("✅ Test user found:", testUser.name, "ID:", testUser.id)

    // IMPORTANT: The prospect is assigned to the test user (simulating creator ownership)
    const assignedSalespersonId = testUser.id

    await client.query("BEGIN")

    // Insert prospect - assigned to the test user
    const prospectResult = await client.query(
      `INSERT INTO prospects (
        business_name, formatted_address, contact_name, contact_email, 
        assigned_salesperson_id, priority, estimated_value, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [
        business_name.trim(),
        "Test Address",
        contact_name,
        contact_email,
        assignedSalespersonId,
        priority,
        Number.parseFloat(estimated_value.toString()),
        notes,
        "new",
      ],
    )

    const prospect = prospectResult.rows[0]

    // Log initial activity
    await client.query(
      `INSERT INTO sales_activities (prospect_id, employee_id, activity_type, subject, description, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        prospect.id,
        assignedSalespersonId,
        "prospect_created",
        "Test prospect created",
        `Test prospect ${business_name} created for ${testUser.name} via test API`,
      ],
    )

    await client.query("COMMIT")

    // Log the prospect creation in audit log
    await AuditLogger.logProspectCreation(testUser.id, testUser.name, testUser.role, prospect.id, {
      business_name,
      contact_name,
      contact_email,
      assigned_salesperson_id: assignedSalespersonId,
      estimated_value,
      priority,
      services_count: 0,
      test_creation: true,
    })

    console.log("✅ Test prospect created successfully with ID:", prospect.id)

    return NextResponse.json({
      success: true,
      data: prospect,
      message: `Test prospect created successfully and assigned to ${testUser.name}`,
      debug: {
        test_user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
        },
        assigned_to_id: assignedSalespersonId,
        prospect_id: prospect.id,
      },
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating test prospect:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test prospect",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
