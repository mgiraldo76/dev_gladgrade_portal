// app/api/sales/prospects/convert/route.ts - Enhanced with business_locations

import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/database"
import { sendWelcomeEmail } from "@/lib/email-service"

// POST /api/sales/prospects/convert - Convert prospect to client with business_locations
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

    // Validation
    if (!prospect_id) {
      return NextResponse.json(
        { success: false, error: "Prospect ID is required" },
        { status: 400 }
      )
    }

    if (!conversion_value || conversion_value <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Conversion value is required and must be greater than 0",
        },
        { status: 400 }
      )
    }

    console.log(`🔄 Converting prospect ${prospect_id} to client with value $${conversion_value}...`)

    await client.query("BEGIN")

    // Get prospect details with ALL address components
    const prospectResult = await client.query(
      `SELECT p.*, e.full_name as salesperson_name, e.id as salesperson_id
       FROM prospects p
       LEFT JOIN employees e ON p.assigned_salesperson_id = e.id
       WHERE p.id = $1`,
      [prospect_id]
    )

    if (prospectResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Prospect not found" }, { status: 404 })
    }

    const prospect = prospectResult.rows[0]
    console.log("✅ Found prospect:", prospect.business_name)

    // ✅ ENHANCED: Create client record with address
    const clientResult = await client.query(
      `INSERT INTO business_clients (
        business_name, contact_name, contact_email, phone, website,
        business_address, claim_status, claim_method,
        claim_submitted_at, claim_approved_at, lead_source, sales_rep_id,
        original_prospect_id, conversion_value, place_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        prospect.business_name,
        client_contact_name || prospect.contact_name,
        client_contact_email || prospect.contact_email,
        client_contact_phone || prospect.phone,
        prospect.website,
        // Build full address from components for business_clients
        prospect.formatted_address || `${prospect.street_address || ""}, ${prospect.city || ""}, ${prospect.state || ""} ${prospect.zip_code || ""}`.trim(),
        "claimed",
        "sales_conversion",
        new Date(),
        new Date(),
        prospect.lead_source,
        prospect.salesperson_id,
        prospect_id,
        conversion_value,
        prospect.place_id // NEW: Add place_id from prospect
      ]
    )

    const newClient = clientResult.rows[0]
    console.log("✅ Created client:", newClient.id, "with place_id:", newClient.place_id || "null")

    // ✅ NEW: Create business_locations record with address components
    try {
      console.log("🏢 Creating business location record with address components...")
      
      const locationResult = await client.query(
        `INSERT INTO business_locations (
          business_client_id, location_name, address, city, state, 
          country, postal_code, phone, is_primary, status,
          latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          newClient.id,
          `${prospect.business_name} - Main Location`,
          prospect.street_address || prospect.formatted_address || "",
          prospect.city || "",
          prospect.state || "",
          prospect.country || "USA",
          prospect.zip_code || "",
          prospect.phone || "",
          true, // ✅ is_primary = true for first location
          "active",
          null, // latitude - can be populated later
          null  // longitude - can be populated later
        ]
      )
      
      console.log("✅ Business location created:", locationResult.rows[0].id)
      console.log("🎯 Location set as PRIMARY for client:", newClient.id)
    } catch (locationError) {
      console.error("⚠️ Business location creation failed but continuing:", locationError)
      // Don't fail conversion if location creation fails
    }

    // Update prospect status
    await client.query(
      `UPDATE prospects 
       SET status = 'converted', converted_at = CURRENT_TIMESTAMP, 
           converted_to_client_id = $1, conversion_value = $2
       WHERE id = $3`,
      [newClient.id, conversion_value, prospect_id]
    )

    // Create default commission
    let commissionsCreated = 0
    if (prospect.salesperson_id) {
      try {
        const defaultCommissionRate = 15.0
        const commissionAmount = (conversion_value * defaultCommissionRate) / 100

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
          ]
        )
        commissionsCreated++
        console.log("✅ Commission created successfully")
      } catch (commissionError) {
        console.error("⚠️ Commission creation failed but continuing:", commissionError)
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
          `Successfully converted ${prospect.business_name} to client with value $${conversion_value}. Address components saved to business_locations table. Notes: ${notes || "None"}`,
        ]
      )
    } catch (activityError) {
      console.error("⚠️ Activity logging failed but continuing:", activityError)
    }

    await client.query("COMMIT")
    console.log("✅ Transaction committed successfully")

    // Send welcome email
    let emailResult = null
    if (send_welcome_email && (client_contact_email || prospect.contact_email)) {
      try {
        emailResult = await sendWelcomeEmail(
          newClient.business_name || newClient.contact_name,
          client_contact_email || prospect.contact_email,
          newClient.id,
          prospect_id
        )
      } catch (emailError) {
        console.error("⚠️ Welcome email failed but conversion succeeded:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        client: newClient,
        prospect: prospect,
        commissions_created: commissionsCreated,
        conversion_value: conversion_value,
        business_location_created: true,
        location_is_primary: true,
        welcome_email_sent: !!emailResult?.success,
        address_components: {
          street_address: prospect.street_address,
          city: prospect.city,
          state: prospect.state,
          zip_code: prospect.zip_code,
          country: prospect.country
        }
      },
      message: `Successfully converted ${prospect.business_name} to client with primary business location!`,
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
      { status: 500 }
    )
  } finally {
    client.release()
  }
}