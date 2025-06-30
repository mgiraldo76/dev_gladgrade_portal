"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/providers"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  ImageIcon,
  HelpCircle,
  User,
  Crown,
  Database,
  Building,
  Heart,
  TrendingUp,
} from "lucide-react"
import { useState, useEffect } from "react"


export function Sidebar() {
  const pathname = usePathname()
  const { role, user } = useAuth() // Add user here
  const [hasClientAccess, setHasClientAccess] = useState(false)

  // Check client access for any logged-in user
  useEffect(() => {
    const checkAccess = async () => {
      // Super admin and admin always have client access
      if (role === "super_admin" || role === "admin" || role === "employee") {
        setHasClientAccess(true)
        return
      }
      
      // For other users, check database
      if (user?.uid || user?.email) {
        try {
          const response = await fetch("/api/user-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              userId: user.uid, // Try ID first
              email: user.email // Fallback to email
            })
          })
          const data = await response.json()
          setHasClientAccess(data.hasClientAccess)
          
          // Optional: Log for debugging
          console.log("Client access check:", {
            isEmployee: data.isEmployee,
            hasAccess: data.hasClientAccess,
            userInfo: data.userInfo
          })
        } catch (error) {
          console.error("Access check failed:", error)
          setHasClientAccess(false)
        }
      } else {
        setHasClientAccess(false)
      }
    }
    
    checkAccess()
  }, [role, user?.uid, user?.email])

  // Function to check if user has client access based on enhanced access control
  const checkClientAccess = async () => {
    try {
      // Check if user is a GladGrade employee
      const isEmployee = user?.email?.endsWith("@gladgrade.com") || false
      
      if (!isEmployee) {
        setHasClientAccess(false)
        return
      }

      // For GladGrade employees, check department and role
      const response = await fetch("/api/employees/enhanced")
      if (response.ok) {
        const data = await response.json()
        const currentEmployee = data.data.find((emp: any) => emp.email === user?.email)
        
        if (currentEmployee) {
          // Check access criteria:
          // 1. Department = "Sales" OR
          // 2. Role in ("CEO", "CCO", "Sales Manager")
          const hasSalesDepartment = currentEmployee.department_name === "Sales"
          const hasLeadershipRole = ["CEO", "CCO", "Sales Manager"].includes(currentEmployee.position_title)
          
          setHasClientAccess(hasSalesDepartment || hasLeadershipRole)
        }
      }
    } catch (error) {
      console.error("Error checking client access:", error)
      setHasClientAccess(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      checkClientAccess()
    }
  }, [user?.email])

  // Function to check if user has sales access
  const hasSalesAccess = () => {
    // Super admin and admin always have access
    if (role === "super_admin" || role === "admin") return true

    // Employees can have sales access (we'll check department from database later)
    if (role === "employee") return true

    return false
  }

  // Define navigation items with enhanced role-based access
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
    },
    {
      name: "Sales Pipeline",
      href: "/dashboard/sales",
      icon: TrendingUp,
      roles: ["super_admin", "admin", "employee"],
      requiresSalesAccess: true,
    },
    {
      name: "Reviews",
      href: "/dashboard/reviews",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
    },
    {
      name: "Clients",
      href: "/dashboard/clients",
      icon: Building,
      roles: ["super_admin", "admin", "employee"], // Updated to include employees
      requiresClientAccess: true, // New flag for client access
    },




    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Partners",
      href: "/dashboard/partners",
      icon: Heart,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Content Moderation",
      href: "/dashboard/moderation",
      icon: ImageIcon,
      roles: ["super_admin", "admin", "moderator"],
    },
    {
      name: "User Management",
      href: "/dashboard/users",
      icon: ShieldCheck,
      roles: ["super_admin", "admin"],
    },
    {
      name: "System Admin",
      href: "/dashboard/system",
      icon: Database,
      roles: ["super_admin"],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
    },
    {
      name: "Help & Support",
      href: "/dashboard/support",
      icon: HelpCircle,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
    },
  ]

  // Enhanced filtering logic that considers both sales and client access
  const filteredNavItems = navItems.filter((item) => {
    const hasRoleAccess = role && item.roles.includes(role)
  
    if (item.requiresSalesAccess) {
      return hasRoleAccess && hasSalesAccess()
    }
  
    // Add this new check for client access
    if (item.requiresClientAccess) {
      // Super admin and admin always have access
      if (role === "super_admin" || role === "admin") {
        return hasRoleAccess
      }
      // For employees, check the dynamic access
      return hasRoleAccess && hasClientAccess
    }
  
    return hasRoleAccess
  })

  return (
    <aside className="fixed left-0 top-[73px] z-40 h-[calc(100vh-73px)] w-64 bg-white border-r border-gray-200 pt-6 transition-transform md:translate-x-0 sidebar-scrollbar overflow-y-auto">
      <div className="h-full px-3 pb-4">
        {/* Role indicator */}
        {role && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              {role === "super_admin" && <Crown className="h-4 w-4 text-primary" />}
              {role === "admin" && <ShieldCheck className="h-4 w-4 text-blue-600" />}
              {role === "moderator" && <ImageIcon className="h-4 w-4 text-green-600" />}
              {role === "employee" && <User className="h-4 w-4 text-gray-600" />}
              {role === "client" && <Users className="h-4 w-4 text-purple-600" />}
              <span className="text-sm font-medium capitalize">
                {role === "super_admin" ? "Super Admin" : role.replace("_", " ")}
              </span>
            </div>
            {/* Show client access indicator for employees */}
            {role === "employee" && hasClientAccess && (
              <div className="mt-1 text-xs text-green-600">
                ✓ Client Access Enabled
              </div>
            )}
          </div>
        )}

        <ul className="space-y-2 font-medium">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center p-3 rounded-lg group hover:bg-primary/10 transition-colors",
                  pathname === item.href && "bg-primary/20 text-dark border-r-2 border-primary",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition",
                    pathname === item.href ? "text-primary" : "text-gray-500 group-hover:text-primary",
                  )}
                />
                <span className="ml-3">{item.name}</span>
                {item.name === "System Admin" && <Crown className="ml-auto h-4 w-4 text-primary" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}