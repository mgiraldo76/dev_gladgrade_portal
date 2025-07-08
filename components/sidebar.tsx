// File: components/sidebar.tsx
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
  const { role, user } = useAuth()
  const [hasClientAccess, setHasClientAccess] = useState(false)

  // Check client access for GladGrade employees
  useEffect(() => {
    const checkClientAccess = async () => {
      // Super admin and admin always have client access
      if (role === "super_admin" || role === "admin") {
        setHasClientAccess(true)
        return
      }
      
      // Check for employees
      if (role === "employee" && user?.email) {
        try {
          const response = await fetch("/api/user-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: user.email  // Only send email, not Firebase UID
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setHasClientAccess(data.hasClientAccess || false)
            
            console.log("Client access check:", {
              isEmployee: data.isEmployee,
              hasAccess: data.hasClientAccess,
              userInfo: data.userInfo
            })
          } else {
            console.error("Failed to check client access:", response.statusText)
            setHasClientAccess(false)
          }
        } catch (error) {
          console.error("Error checking client access:", error)
          setHasClientAccess(false)
        }
      } else {
        setHasClientAccess(false)
      }
    }

    checkClientAccess()
  }, [role, user?.email])

  // Define menu items with role-based access
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
    },
    {
      name: "Sales",
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
      roles: ["super_admin", "admin", "employee"],
      requiresClientAccess: true,
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

  // Filter navigation items based on user role and access
  const filteredNavigation = navigationItems.filter((item) => {
    // Check role access
    if (!role || !item.roles.includes(role)) {
      return false
    }

    // Check special access requirements
    if (item.requiresClientAccess && !hasClientAccess) {
      return false
    }

    if (item.requiresSalesAccess) {
      // Sales access logic - you can customize this
      return role === "super_admin" || role === "admin" || role === "employee"
    }

    return true
  })

  const getRoleBadgeInfo = () => {
    switch (role) {
      case "super_admin":
        return { text: "Super Admin", className: "bg-purple-100 text-purple-800" }
      case "admin":
        return { text: "Admin", className: "bg-blue-100 text-blue-800" }
      case "employee":
        return { text: "Employee", className: "bg-green-100 text-green-800" }
      case "moderator":
        return { text: "Moderator", className: "bg-yellow-100 text-yellow-800" }
      case "client":
        return { text: "Client", className: "bg-gray-100 text-gray-800" }
      default:
        return { text: "User", className: "bg-gray-100 text-gray-800" }
    }
  }

  const roleBadge = getRoleBadgeInfo()

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border sidebar-scrollbar overflow-y-auto">
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email || "User"}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className={cn("px-2 py-0.5 rounded text-xs font-medium", roleBadge.className)}>
                {roleBadge.text}
              </div>
              {role === "super_admin" && (
                <Crown className="h-3 w-3 text-primary" />
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}