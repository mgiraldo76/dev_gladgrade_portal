import { type NextRequest, NextResponse } from "next/server"
import { getEmployeeByAuth } from "@/lib/auth-utils"

// Get current authenticated user info
export async function GET(request: NextRequest) {
  try {
    // Try to get user info from various sources
    const authHeader = request.headers.get("authorization")
    const userEmail = request.headers.get("x-user-email")
    const firebaseUid = request.headers.get("x-firebase-uid")

    console.log("🔍 Auth detection:", { authHeader: !!authHeader, userEmail, firebaseUid })

    // For now, we'll use a simple approach based on the current auth system
    // In your providers.tsx, you determine role by email domain
    // Let's use that same logic here

    let currentUser = null

    // Try Firebase UID first, then email
    if (firebaseUid) {
      currentUser = await getEmployeeByAuth(firebaseUid)
    }

    if (!currentUser && userEmail) {
      currentUser = await getEmployeeByAuth(undefined, userEmail)
    }

    // If no headers, try to detect from session/cookies
    if (!currentUser) {
      // Check if there's a way to get current user from your existing auth
      // For now, return null to indicate no authenticated user
      return NextResponse.json({
        success: false,
        error: "No authenticated user found",
        debug: {
          authHeader: !!authHeader,
          userEmail,
          firebaseUid,
          suggestion: "Need to pass user info in headers or implement proper token verification",
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: currentUser,
      message: "Current user retrieved successfully",
    })
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get current user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
