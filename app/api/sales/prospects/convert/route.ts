import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/database"
import { sendWelcomeEmail } from "@/lib/email-service"

// POST /api/sales/prospects/convert - Convert prospect to client
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const requestBody = await request.json()
    console.log("🔍 Received conversion request:", requestBody)

    const {
      prospect_id,
      conversion_value,
      client_contact_name,
      client_contact_email,
      client_contact_phone,
      create_firebase_account = true,
      send_welcome_email = true,
      generate_qr_codes = true,
      notes,
    } = requestBody

    console.log("🔍 Extracted values:", {
      prospect_id,
      conversion_value,
      client_contact_name,
      client_contact_email,
    })

    if (!prospect_id) {
      console.error("❌ Missing prospect_id")
      return NextResponse.json(
        { success: false, error: "Prospect ID is required", details: "prospect_id field is missing" },
        { status: 400 },
      )
    }

    if (!conversion_value || conversion_value <= 0) {
      console.error("❌ Invalid conversion_value:", conversion_value)
      return NextResponse.json(
        {
          success: false,
          error: "Conversion value is required and must be greater than 0",
          details: `Received conversion_value: ${conversion_value}`,
        },
        { status: 400 },
      )
    }

    console.log(`🔄 Converting prospect ${prospect_id} to client with value $${conversion_value}...`)

    await client.query("BEGIN")

    // Get prospect details
    const prospectResult = await client.query(
      `SELECT p.*, e.full_name as salesperson_name, e.id as salesperson_id
       FROM prospects p
       LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
       WHERE p.id = $1`,
      [prospect_id],
    )

    if (prospectResult.rows.length === 0) {
      await client.query("ROLLBACK")
      console.error("❌ Prospect not found:", prospect_id)
      return NextResponse.json({ success: false, error: "Prospect not found" }, { status: 404 })
    }

    const prospect = prospectResult.rows[0]
    console.log("✅ Found prospect:", prospect.business_name)

    // Create client record - SIMPLIFIED VERSION TO AVOID TRANSACTION ERRORS
    let clientResult
    try {
      console.log("🔄 Creating client record...")
      clientResult = await client.query(
        `INSERT INTO business_clients (
          business_name, contact_name, contact_email, phone, website,
          business_address, claim_status, claim_method,
          claim_submitted_at, claim_approved_at, lead_source, sales_rep_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          prospect.business_name,
          client_contact_name || prospect.contact_name,
          client_contact_email || prospect.contact_email,
          client_contact_phone || prospect.phone,
          prospect.website,
          prospect.formatted_address,
          "claimed",
          "sales_conversion",
          new Date(),
          new Date(),
          prospect.lead_source,
          prospect.salesperson_id,
        ],
      )
      console.log("✅ Client record created successfully")
    } catch (clientError) {
      console.error("❌ Error creating client:", clientError)
      await client.query("ROLLBACK")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create client record",
          details: clientError instanceof Error ? clientError.message : "Unknown client creation error",
        },
        { status: 500 },
      )
    }

    const newClient = clientResult.rows[0]
    console.log("✅ Created client:", newClient.id)

    // Update prospect status
    try {
      await client.query(
        `UPDATE prospects 
         SET status = 'converted', converted_at = CURRENT_TIMESTAMP, 
             converted_to_client_id = $1, conversion_value = $2
         WHERE id = $3`,
        [newClient.id, conversion_value, prospect_id],
      )
      console.log("✅ Updated prospect status to converted")
    } catch (updateError) {
      console.error("❌ Error updating prospect:", updateError)
      await client.query("ROLLBACK")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update prospect status",
          details: updateError instanceof Error ? updateError.message : "Unknown update error",
        },
        { status: 500 },
      )
    }

    // Create default commission
    let commissionsCreated = 0
    if (prospect.salesperson_id) {
      try {
        const defaultCommissionRate = 15.0 // 15% default
        const commissionAmount = (conversion_value * defaultCommissionRate) / 100

        console.log(
          `💰 Creating default commission: Sale=$${conversion_value}, Rate=${defaultCommissionRate}%, Commission=$${commissionAmount}`,
        )

        await client.query(
          `INSERT INTO commissions (
            salesperson_id, client_id, prospect_id,
            sale_amount, commission_rate, commission_amount,
            status, earned_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            prospect.salesperson_id,
            newClient.id,
            prospect_id,
            conversion_value,
            defaultCommissionRate,
            commissionAmount,
            "pending",
            new Date(),
          ],
        )
        commissionsCreated++
        console.log("✅ Commission created successfully")
      } catch (commissionError) {
        console.error("⚠️ Commission creation failed but continuing:", commissionError)
        // Don't fail the entire conversion if commission fails
      }
    }

    // Log conversion activity
    try {
      await client.query(
        `INSERT INTO sales_activities (
          prospect_id, employee_id, activity_type, subject, description
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          prospect_id,
          prospect.salesperson_id,
          "conversion",
          "Prospect converted to client",
          `Successfully converted ${prospect.business_name} to client with value $${conversion_value}. Notes: ${notes || "None"}`,
        ],
      )
      console.log("✅ Activity logged successfully")
    } catch (activityError) {
      console.error("⚠️ Activity logging failed but continuing:", activityError)
      // Don't fail the entire conversion if activity logging fails
    }

    await client.query("COMMIT")
    console.log("✅ Transaction committed successfully")

    // Send welcome email AFTER successful conversion
    let emailResult = null
    if (send_welcome_email && (client_contact_email || prospect.contact_email)) {
      try {
        console.log("📧 Sending welcome email...")
        emailResult = await sendWelcomeEmail(
          newClient.business_name || newClient.contact_name,
          client_contact_email || prospect.contact_email,
          newClient.id,
          prospect_id,
        )
        console.log("✅ Welcome email result:", emailResult)
      } catch (emailError) {
        console.error("⚠️ Welcome email failed but conversion succeeded:", emailError)
        // Don't fail the conversion if email fails
      }
    } else {
      console.log(
        "⚠️ Welcome email skipped - send_welcome_email:",
        send_welcome_email,
        "email:",
        client_contact_email || prospect.contact_email,
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        client: newClient,
        prospect: prospect,
        commissions_created: commissionsCreated,
        conversion_value: conversion_value,
        welcome_email_sent: !!emailResult?.success,
        welcome_email_result: emailResult,
      },
      message: `Successfully converted ${prospect.business_name} to client!`,
    })
  } catch (error: unknown) {
    console.error("❌ Error converting prospect to client:", error)
    try {
      await client.query("ROLLBACK")
    } catch (rollbackError) {
      console.error("❌ Rollback failed:", rollbackError)
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to convert prospect to client",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
