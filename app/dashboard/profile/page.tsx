"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { User, Shield, Mail, Calendar, Crown, Building, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ProfilePage() {
  const { user, role } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const getRoleInfo = (userRole: string | null) => {
    switch (userRole) {
      case "super_admin":
        return {
          name: "Super Administrator",
          description: "Full system access and control",
          color: "bg-red-100 text-red-800",
          icon: Crown,
          permissions: ["Full System Access", "User Management", "System Administration", "Database Control"],
        }
      case "admin":
        return {
          name: "Administrator",
          description: "GladGrade employee with admin privileges",
          color: "bg-blue-100 text-blue-800",
          icon: Shield,
          permissions: ["User Management", "Content Moderation", "Reports", "Settings"],
        }
      case "moderator":
        return {
          name: "Moderator",
          description: "Content moderation and review management",
          color: "bg-green-100 text-green-800",
          icon: Shield,
          permissions: ["Content Moderation", "Review Management", "Image Approval"],
        }
      case "employee":
        return {
          name: "Employee",
          description: "GladGrade team member",
          color: "bg-gray-100 text-gray-800",
          icon: User,
          permissions: ["Customer Support", "Basic Reports", "Review Responses"],
        }
      case "client":
        return {
          name: "Business Client",
          description: "Business owner or manager",
          color: "bg-purple-100 text-purple-800",
          icon: Building,
          permissions: ["View Reports", "Manage Reviews", "Partner Access", "Business Settings"],
        }
      default:
        return {
          name: "Unknown",
          description: "Role not assigned",
          color: "bg-gray-100 text-gray-800",
          icon: User,
          permissions: [],
        }
    }
  }

  const roleInfo = getRoleInfo(role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark">Profile Settings</h1>
        <Button onClick={() => setIsEditing(!isEditing)} className="bg-primary hover:bg-primary-dark text-dark">
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input id="email" value={user?.email || "demo@gladgrade.com"} disabled={!isEditing} />
              </div>
              {user?.email?.endsWith("@gladgrade.com") && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  GladGrade Employee Domain
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input id="display-name" value={user?.displayName || "Demo User"} disabled={!isEditing} />
            </div>

            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "Demo Account"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Sign In</Label>
              <span className="text-sm text-gray-600">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                  : "Current Session"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RoleIcon className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="flex items-center gap-2">
                <Badge className={roleInfo.color}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleInfo.name}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{roleInfo.description}</p>
            </div>

            <div className="space-y-2">
              <Label>Domain-Based Assignment</Label>
              <div className="text-sm text-gray-600">
                {user?.email?.toLowerCase() === "miguel.giraldo@gladgrade.com" && (
                  <p className="text-red-600 font-medium">🔥 Super Admin - Absolute Administrator</p>
                )}
                {user?.email?.endsWith("@gladgrade.com") &&
                  user?.email?.toLowerCase() !== "miguel.giraldo@gladgrade.com" && (
                    <p className="text-blue-600">👥 GladGrade Employee</p>
                  )}
                {!user?.email?.endsWith("@gladgrade.com") && <p className="text-purple-600">🏢 Business Client</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-1">
                {roleInfo.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="mr-2 mb-1">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Appearance Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Switch between light and dark mode</span>
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Assignment Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Role Assignment Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Super Administrator</span>
              </div>
              <p className="text-sm text-gray-600">miguel.giraldo@gladgrade.com → Full system control</p>
            </div>

            <div className="p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">GladGrade Employees</span>
              </div>
              <p className="text-sm text-gray-600">*@gladgrade.com → Admin/Moderator/Employee roles</p>
            </div>

            <div className="p-3 border rounded-lg bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Business Clients</span>
              </div>
              <p className="text-sm text-gray-600">All other domains → Client access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
