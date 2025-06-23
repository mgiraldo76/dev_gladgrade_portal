import { getEmployeeByAuth } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

// Middleware to extract user from Firebase Auth token
export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    // Method 1: Get Firebase token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      // TODO: Verify Firebase token and extract user info
      // const decodedToken = await admin.auth().verifyIdToken(token)
      // return await getEmployeeByAuth(decodedToken.uid, decodedToken.email)
    }

    // Method 2: For testing - use test headers (current method)
    const testEmail = request.headers.get("x-user-email")
    if (testEmail) {
      return await getEmployeeByAuth(undefined, testEmail)
    }

    return null
  } catch (error) {
    console.error("Error getting user from request:", error)
    return null
  }
}
