import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"
import crypto from "crypto"

// Helper function to generate claim token
function generateClaimToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Helper function to calculate approval score
function calculateApprovalScore(claimData: any): number {
  let score = 0

  // Email domain matching (high confidence)
  if (claimData.claim_method === "email_domain") {
    const emailDomain = claimData.contact_email.split("@")[1]
    const websiteDomain = claimData.website?.replace(/^https?:\/\//, "").replace(/^www\./, "")

    if (websiteDomain && emailDomain === websiteDomain) {
      score += 80 // High confidence
    } else if (emailDomain.includes(claimData.business_name.toLowerCase().replace(/\s+/g, ""))) {
      score += 60 // Medium confidence
    }
  }

  // Phone verification
  if (claimData.phone && claimData.phone.length >= 10) {
    score += 20
  }

  // Business address provided
  if (claimData.business_address) {
    score += 10
  }

  return score
}

// POST /api/clients/claim - Submit business claim request
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const {
      business_name,
      contact_name,
      contact_email,
      phone,
      business_address,
      website,
      industry_category_id,
      claim_method = "email_domain",
    } = await request.json()

    if (!business_name || !contact_name || !contact_email) {
      return NextResponse.json(
        { success: false, error: "Business name, contact name, and email are required" },
        { status: 400 },
      )
    }

    console.log(`🏢 Processing business claim request: ${business_name} (${contact_email})`)

    await client.query("BEGIN")

    // Check if business already exists or has pending claim
    const existingBusiness = await client.query(
      "SELECT id, claim_status FROM business_clients WHERE LOWER(business_name) = LOWER($1) OR LOWER(contact_email) = LOWER($2)",
      [business_name.trim(), contact_email.toLowerCase().trim()],
    )

    if (existingBusiness.rows.length > 0) {
      await client.query("ROLLBACK")
      const existing = existingBusiness.rows[0]

      if (existing.claim_status === "claimed") {
        return NextResponse.json({ success: false, error: "This business has already been claimed" }, { status: 409 })
      } else if (existing.claim_status === "pending") {
        return NextResponse.json(
          { success: false, error: "A claim request for this business is already pending review" },
          { status: 409 },
        )
      }
    }

    // Check for existing claim request
    const existingClaim = await client.query(
      "SELECT id FROM business_claim_requests WHERE LOWER(contact_email) = LOWER($1) AND status = $2",
      [contact_email.toLowerCase().trim(), "pending"],
    )

    if (existingClaim.rows.length > 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "You already have a pending claim request" }, { status: 409 })
    }

    const claimToken = generateClaimToken()
    const claimData = {
      business_name: business_name.trim(),
      contact_name: contact_name.trim(),
      contact_email: contact_email.toLowerCase().trim(),
      phone,
      business_address,
      website,
      claim_method,
    }

    const approvalScore = calculateApprovalScore(claimData)
    const autoApproved = approvalScore >= 80 // Auto-approve high-confidence claims

    // Insert claim request
    const claimResult = await client.query(
      `INSERT INTO business_claim_requests (
        business_name, contact_name, contact_email, phone, business_address,
        website, industry_category_id, claim_method, claim_token,
        approval_score, auto_approved, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        claimData.business_name,
        claimData.contact_name,
        claimData.contact_email,
        phone || null,
        business_address || null,
        website || null,
        industry_category_id || null,
        claim_method,
        claimToken,
        approvalScore,
        autoApproved,
        autoApproved ? "approved" : "pending",
      ],
    )

    const claimRequest = claimResult.rows[0]

    // If auto-approved, create the business client immediately
    if (autoApproved) {
      console.log(`✅ Auto-approving claim request (score: ${approvalScore})`)

      const businessResult = await client.query(
        `INSERT INTO business_clients (
          business_name, contact_name, contact_email, phone, website,
          business_address, industry_category_id, claim_status, claim_method,
          claim_submitted_at, claim_approved_at, lead_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          claimData.business_name,
          claimData.contact_name,
          claimData.contact_email,
          phone || null,
          website || null,
          business_address || null,
          industry_category_id || null,
          "claimed",
          claim_method,
          new Date(),
          new Date(),
          "organic",
        ],
      )

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        auto_approved: true,
        business_id: businessResult.rows[0].id,
        message:
          "Congratulations! Your business claim has been automatically approved. You can now create your account and start using GladGrade.",
        next_steps: [
          "Create your GladGrade account",
          "Complete your business profile",
          "Start monitoring your reviews",
        ],
      })
    }

    await client.query("COMMIT")

    console.log(`📋 Claim request submitted for manual review (score: ${approvalScore})`)

    return NextResponse.json({
      success: true,
      auto_approved: false,
      claim_id: claimRequest.id,
      approval_score: approvalScore,
      message:
        "Your business claim request has been submitted for review. Our team will verify your ownership and get back to you within 2-3 business days.",
      next_steps: [
        "Check your email for verification instructions",
        "Prepare business documents if requested",
        "Wait for approval notification",
      ],
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error processing claim request:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process business claim request",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// GET /api/clients/claim - Get pending claim requests (for employees)
export async function GET() {
  try {
    console.log("📋 Fetching pending business claim requests...")

    const result = await query(`
      SELECT
        bcr.*,
        ic.name as industry_category,
        ic.icon as industry_icon,
        e.full_name as reviewed_by_name
      FROM business_claim_requests bcr
      LEFT JOIN industry_categories ic ON bcr.industry_category_id = ic.id
      LEFT JOIN employees e ON bcr.reviewed_by = e.id
      ORDER BY bcr.created_at DESC
    `)

    console.log(`✅ Found ${result.rows.length} claim requests`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching claim requests:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch claim requests",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
