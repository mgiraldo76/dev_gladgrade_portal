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

// GET /api/clients - Get all business clients from gg.businesses
export async function GET() {
  try {
    console.log("🏢 Fetching business clients from gg.businesses...")

    const result = await query(`
      SELECT
        b.id,
        b.businessname,
        b.placeid,
        b.businesstype,
        b.streetaddress,
        b.city,
        b.state,
        b.zipcode,
        b.country,
        b.phone,
        b.website,
        b.logourl,
        b.isactive,
        b.isverified,
        b.datecreated,
        b.lastupdated,
        u.firstname || ' ' || u.lastname as contact_name,
        u.email as contact_email,
        u.id as user_id,
        u.firebaseuid,
        emp.full_name as sales_rep_name,
        emp.id as sales_rep_id,
        bt.businesstype as business_type_name,
        -- Calculate GCSG score from ratings
        COALESCE(
          CASE 
            WHEN COUNT(cr.ratingvalue) > 0 
            THEN 300 + (AVG(cr.ratingvalue::numeric) * 55)
            ELSE 300 
          END, 300
        )::integer as gcsg_score,
        COUNT(cr.id) as total_reviews,
        COALESCE(AVG(cr.ratingvalue::numeric), 0)::numeric(3,2) as average_rating
      FROM gg.businesses b
      LEFT JOIN gg.users u ON b.userid = u.id
      LEFT JOIN corp.employees emp ON u.email = emp.email -- Link via email for sales rep
      LEFT JOIN gg.businesstypes bt ON b.businesstypeid = bt.id
      LEFT JOIN gg.consumerratings cr ON b.placeid = cr.placeid
      WHERE b.isactive = true
      GROUP BY b.id, u.id, emp.id, bt.businesstype
      ORDER BY b.datecreated DESC
    `)

    console.log(`✅ Found ${result.rows.length} business clients`)

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
        error: "Failed to fetch business clients from database",
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

    // Get business details
    const businessResult = await client.query("SELECT * FROM gg.businesses WHERE id = $1 AND isactive = true", [
      business_id,
    ])

    if (businessResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 })
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
            business_name: business.businessname,
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

    // Create user in gg.users table
    const [firstName, ...lastNameParts] = user_name.trim().split(" ")
    const lastName = lastNameParts.join(" ") || ""

    const userResult = await client.query(
      `INSERT INTO gg.users (
        firebaseuid, email, firstname, lastname, displayname, primaryroleid, isactive
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        firebaseUid,
        user_email.toLowerCase().trim(),
        firstName,
        lastName,
        user_name.trim(),
        3, // Client role ID from your schema
        true,
      ],
    )

    const newUser = userResult.rows[0]

    // Link user to business (update business.userid)
    await client.query("UPDATE gg.businesses SET userid = $1, lastupdated = NOW() WHERE id = $2", [
      newUser.id,
      business_id,
    ])

    await client.query("COMMIT")

    console.log("✅ Client user created successfully:", newUser)

    return NextResponse.json({
      success: true,
      data: {
        user: newUser,
        business: business,
        firebase_account_created: firebaseAccountCreated,
        temporary_password: firebaseAccountCreated ? temporary_password || "Auto-generated" : null,
      },
      login_instructions: firebaseAccountCreated
        ? "The client can now log in at portal.gladgrade.com with their email and password"
        : "Database record created. Firebase account can be created later.",
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
