import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

// Import Firebase functions with error handling
let createFirebaseUser: any = null
let setCustomClaims: any = null

try {
  const firebaseAdmin = require("@/lib/firebase-admin")
  createFirebaseUser = firebaseAdmin.createFirebaseUser
  setCustomClaims = firebaseAdmin.setCustomClaims
} catch (error) {
  console.log("⚠️ Firebase Admin functions not available, using database-only mode")
}

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// GET /api/clients - Get all business clients from corp.business_clients
export async function GET() {
  try {
    console.log("🏢 Fetching business clients from corp.business_clients...")

    const result = await query(`
      SELECT
        bc.id,
        bc.business_name as business_name,
        bc.contact_name,
        bc.contact_email,
        bc.phone,
        bc.website,
        bc.business_address,
        bc.claim_status,
        bc.claim_method,
        bc.security_level,
        bc.verification_status,
        bc.gcsg_score,
        bc.monthly_reviews,
        bc.total_reviews,
        bc.average_rating,
        bc.subscription_plan,
        bc.subscription_status,
        bc.onboarding_completed,
        bc.lead_source,
        bc.lead_status,
        bc.created_at as datecreated,
        bc.updated_at as lastupdated,
        bc.last_login,
        -- Industry category
        ic.name as industry_category_name,
        ic.icon as industry_icon,
        -- Sales representative
        emp.full_name as sales_rep_name,
        emp.email as sales_rep_email,
        emp.id as sales_rep_id,
        dept.name as sales_rep_department,
        -- Status indicators
        CASE 
          WHEN bc.firebase_uid IS NOT NULL THEN true
          ELSE false
        END as has_firebase_account,
        CASE 
          WHEN bc.verification_status = 'verified' THEN true
          ELSE false
        END as isverified,
        CASE 
          WHEN bc.security_level IN ('verified', 'pending') THEN true
          ELSE false
        END as isactive
      FROM business_clients bc
      LEFT JOIN industry_categories ic ON bc.industry_category_id = ic.id
      LEFT JOIN employees emp ON bc.sales_rep_id = emp.id
      LEFT JOIN departments dept ON emp.department_id = dept.id
      ORDER BY bc.created_at DESC
    `)

    console.log(`✅ Found ${result.rows.length} business clients from corp database`)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching business clients:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch business clients from corp database",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST /api/clients - Create client user for existing business
export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    const {
      business_id,
      user_email,
      user_name,
      user_role = "client_admin",
      create_firebase_account = true,
      temporary_password,
    } = await request.json()

    if (!business_id || !user_email || !user_name) {
      return NextResponse.json(
        { success: false, error: "Business ID, user email, and name are required" },
        { status: 400 },
      )
    }

    console.log(`👤 Creating client user for business ID: ${business_id}`)

    await client.query("BEGIN")

    // Get business details from corp.business_clients
    const businessResult = await client.query("SELECT * FROM business_clients WHERE id = $1", [business_id])

    if (businessResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Business client not found" }, { status: 404 })
    }

    const business = businessResult.rows[0]

    let firebaseUid = null
    let firebaseAccountCreated = false

    // Create Firebase user if requested and available
    if (create_firebase_account && createFirebaseUser) {
      try {
        console.log("🔥 Creating Firebase Authentication user for client...")

        const firebaseUser = await createFirebaseUser({
          email: user_email.toLowerCase().trim(),
          displayName: user_name.trim(),
          password: temporary_password || generateTemporaryPassword(),
          emailVerified: false,
        })

        firebaseUid = firebaseUser.uid
        firebaseAccountCreated = true
        console.log(`✅ Firebase user created with UID: ${firebaseUid}`)

        // Set custom claims for client access
        if (setCustomClaims) {
          await setCustomClaims(firebaseUid, {
            role: "client",
            business_id: business_id,
            business_name: business.business_name,
            user_role: user_role,
            permissions: ["client_access", "view_reports", "manage_reviews", "manage_ads"],
          })

          console.log(`✅ Custom claims set for Firebase client user`)
        }
      } catch (firebaseError: unknown) {
        await client.query("ROLLBACK")
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : "Unknown Firebase error"
        console.error("❌ Firebase user creation failed:", errorMessage)

        return NextResponse.json(
          {
            success: false,
            error: "Failed to create Firebase user for client",
            details: errorMessage,
          },
          { status: 500 },
        )
      }
    }

    // Update business_clients record with Firebase UID
    await client.query(
      `UPDATE business_clients 
       SET firebase_uid = $1, updated_at = NOW() 
       WHERE id = $2`,
      [firebaseUid, business_id],
    )

    await client.query("COMMIT")

    console.log("✅ Client user created successfully for business:", business.business_name)

    return NextResponse.json({
      success: true,
      data: {
        business: business,
        firebase_account_created: firebaseAccountCreated,
        firebase_uid: firebaseUid,
        temporary_password: firebaseAccountCreated ? temporary_password || "Auto-generated" : null,
      },
      login_instructions: firebaseAccountCreated
        ? "The client can now log in at portal.gladgrade.com with their email and password"
        : "Database record updated. Firebase account can be created later.",
    })
  } catch (error: unknown) {
    await client.query("ROLLBACK")
    console.error("❌ Error creating client user:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorCode = error && typeof error === "object" && "code" in error ? (error as any).code : null

    if (errorCode === "23505") {
      return NextResponse.json({ success: false, error: "User email already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create client user",
        details: errorMessage,
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
