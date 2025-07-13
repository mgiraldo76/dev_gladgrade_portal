import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/auth-middleware"

// Get current user session info
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: "No authenticated user found",
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department_name,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user session",
      },
      { status: 500 },
    )
  }
}
