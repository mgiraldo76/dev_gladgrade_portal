// Path: /components/sidebar.tsx (Updated)
// Name: Updated Sidebar Component with GladMenu Admin Option

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/app/providers"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  ConciergeBell,
  HelpCircle,
  User,
  TrendingUp,
  Building,
  Heart,
  Database,
  ShieldCheck,
  ImageIcon,
  Utensils, // NEW: Menu icon
  Menu // NEW: Alternative menu icon
} from "lucide-react"
//import { Settings } from "lucide-react"


export function Sidebar() {
  const pathname = usePathname()
  const { user, role, clientRole } = useAuth()
  const [hasClientAccess, setHasClientAccess] = useState(false)

  useEffect(() => {
    async function checkClientAccess() {
      if (role && role !== "client" && user?.email) {
        try {
          const response = await fetch('/api/check-client-access', {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
          })
          if (response.ok) {
            setHasClientAccess(true)
          } else {
            console.error("Client access check failed:", response.statusText)
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
      href: "/dashboard/clients/team",
      icon: Users,
      roles: ["client"],
      clientRoles: ["client_admin"], // Only client admins can manage team
      clientOnly: true,
    },
    
    // === GLADMENU ADMIN SECTION ===
    {
      name: "GladMenu Admin",
      href: "/dashboard/menu",
      icon: Utensils,
      roles: ["super_admin", "admin", "client", "employee"],
      clientRoles: ["client_admin"], // Only client admins can manage menu
      description: "Manage your menu, services, or inventory",
      isNew: true, // Flag to show "NEW" badge
    },

    
    // === SERVICES ADMIN SECTION ===
    {
      name: "Services Management",
      href: "/dashboard/services",
      icon: ConciergeBell,
      roles: ["super_admin", "admin", "client", "employee"],
      clientRoles: ["client_admin"], // Only client admins can access services
      description: "Manage and purchase GladGrade services",
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
        const clientRoleText = clientRole 
          ? clientRole.replace('client_', '').replace('_', ' ')
          : 'Client'
        return { 
          text: clientRoleText.charAt(0).toUpperCase() + clientRoleText.slice(1), 
          className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" 
        }
      default:
        return { text: "User", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" }
    }
  }

  const roleBadge = getRoleBadgeInfo()

  return (
    <div className="pb-12 w-64 bg-background border-r border-border">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Navigation</h2>
            <Badge 
              variant="outline" 
              className={cn("text-xs", roleBadge.className)}
            >
              {roleBadge.text}
            </Badge>
          </div>
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                             (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-muted font-medium"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.name}</span>
                    
                    {/* NEW: Show badge for new features */}
                    {item.isNew && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      >
                        NEW
                      </Badge>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        
        {/* User Info Section */}
        <div className="px-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email || "Demo User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roleBadge.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}