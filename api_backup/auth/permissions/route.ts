import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get this from the authenticated user session
    // For now, we'll simulate getting user info

    const mockUser = {
      id: "1",
      email: "sales@gladgrade.com",
      role: "employee",
      department: "Sales",
      position: "Sales Representative",
    }

    // Determine permissions based on role and department
    const permissions = {
      canViewSales: false,
      canCreateProspects: false,
      canConvertProspects: false,
      canViewAllClients: false,
      canViewOwnClients: false,
      canManageUsers: false,
      canAccessSystem: false,
      canModerateContent: false,
    }

    // Super admin gets everything
    if (mockUser.role === "super_admin") {
      Object.keys(permissions).forEach((key) => {
        permissions[key as keyof typeof permissions] = true
      })
    }
    // Admin gets most things
    else if (mockUser.role === "admin") {
      permissions.canViewSales = true
      permissions.canCreateProspects = true
      permissions.canConvertProspects = true
      permissions.canViewAllClients = true
      permissions.canManageUsers = true
      permissions.canModerateContent = true
    }
    // Sales department employees
    else if (mockUser.department?.toLowerCase() === "sales") {
      permissions.canViewSales = true
      permissions.canCreateProspects = true
      permissions.canConvertProspects = true
      permissions.canViewOwnClients = true
    }
    // Sales role
    else if (mockUser.role === "sales" || mockUser.role === "sales_manager") {
      permissions.canViewSales = true
      permissions.canCreateProspects = true
      permissions.canConvertProspects = true
      permissions.canViewOwnClients = true
    }

    return NextResponse.json({
      success: true,
      user: mockUser,
      permissions,
      salesAccess: permissions.canViewSales,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking permissions:", error)
    return NextResponse.json({ success: false, error: "Failed to check permissions" }, { status: 500 })
  }
}
