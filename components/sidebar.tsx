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
  const { role, clientRole, user } = useAuth()
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
    // === UNIVERSAL SECTIONS (Everyone) ===
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
      clientRoles: ["client_admin", "client_moderator", "client_user", "client_viewer"],
    },
    
    // === GLADGRADE EMPLOYEE ONLY SECTIONS ===
    {
      name: "Sales",
      href: "/dashboard/sales",
      icon: TrendingUp,
      roles: ["super_admin", "admin", "employee"],
      requiresSalesAccess: true,
      employeeOnly: true,
    },
    {
      name: "Clients",
      href: "/dashboard/clients",
      icon: Building,
      roles: ["super_admin", "admin", "employee"],
      requiresClientAccess: true,
      employeeOnly: true,
    },
    {
      name: "Partners",
      href: "/dashboard/partners",
      icon: Heart,
      roles: ["super_admin", "admin"],
      employeeOnly: true,
    },
    {
      name: "Content Moderation",
      href: "/dashboard/moderation",
      icon: ImageIcon,
      roles: ["super_admin", "admin", "moderator"],
      employeeOnly: true,
    },
    {
      name: "System Admin",
      href: "/dashboard/system",
      icon: Database,
      roles: ["super_admin"],
      employeeOnly: true,
    },
    {
      name: "User Management",
      href: "/dashboard/users",
      icon: ShieldCheck,
      roles: ["super_admin", "admin"],
      employeeOnly: true,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
      employeeOnly: true,
    },
    
    // === SHARED SECTIONS (Both employees and clients) ===
    {
      name: "Reviews",
      href: "/dashboard/reviews",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
      clientRoles: ["client_admin", "client_moderator", "client_user", "client_viewer"],
    },
    
    // === CLIENT-SPECIFIC SECTIONS ===
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "client"],
      clientRoles: ["client_admin", "client_user"], // client_moderator and client_viewer excluded
      clientOnly: true,
    },
    {
      name: "Team Management",
      href: "/dashboard/team",
      icon: Users,
      roles: ["client"],
      clientRoles: ["client_admin"], // Only client admins can manage team
      clientOnly: true,
    },
    
    // === UNIVERSAL SECTIONS (Everyone) ===
    {
      name: "Help & Support",
      href: "/dashboard/support",
      icon: HelpCircle,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
      clientRoles: ["client_admin", "client_moderator", "client_user", "client_viewer"],
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: ["super_admin", "admin", "client", "employee", "moderator"],
      clientRoles: ["client_admin", "client_moderator", "client_user", "client_viewer"],
    },
  ]

  // Filter navigation items based on user role and access
  const filteredNavigation = navigationItems.filter((item) => {
    // Check role access
    if (!role || !item.roles.includes(role)) {
      return false
    }

    // For client users, check specific client role permissions
    if (role === "client" && item.clientRoles) {
      if (!clientRole || !item.clientRoles.includes(clientRole)) {
        return false
      }
    }

    // Skip employee-only sections for clients
    if (role === "client" && item.employeeOnly) {
      return false
    }

    // Skip client-only sections for employees
    if (role !== "client" && item.clientOnly) {
      return false
    }

    // Check special access requirements for employees
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
        return { text: "Super Admin", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" }
      case "admin":
        return { text: "Admin", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" }
      case "employee":
        return { text: "Employee", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
      case "moderator":
        return { text: "Moderator", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" }
      case "client":
        // Show specific client role
        const clientRoleText = clientRole ? 
          clientRole.replace('client_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
          'Client'
        return { text: clientRoleText, className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" }
      default:
        return { text: "User", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" }
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