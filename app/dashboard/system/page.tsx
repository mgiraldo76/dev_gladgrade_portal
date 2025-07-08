// File: app/dashboard/system/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { Crown, Database, Users, Shield, Activity, AlertTriangle } from "lucide-react"

export default function SystemAdminPage() {
  const { user, role } = useAuth()

  // Only super admin can access this page
  if (role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">This area is only accessible to Super Administrators</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
            <p className="text-muted-foreground">Super Admin Control Panel - Miguel Giraldo</p>
          </div>
        </div>
        <Badge className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 px-3 py-1">
          <Crown className="h-4 w-4 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">1,247</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">15.2K</div>
                <div className="text-sm text-muted-foreground">Daily Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">0</div>
                <div className="text-sm text-muted-foreground">Critical Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Management */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Domain-Based Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-foreground">miguel.giraldo@gladgrade.com</p>
                  <p className="text-sm text-muted-foreground">Super Administrator - Full System Access</p>
                </div>
              </div>
              <Badge className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Super Admin</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-foreground">*@gladgrade.com</p>
                  <p className="text-sm text-muted-foreground">GladGrade Employees - Admin/Moderator/Employee</p>
                </div>
              </div>
              <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">Employee Domain</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">All Other Domains</p>
                  <p className="text-sm text-muted-foreground">Business Clients - Limited Access</p>
                </div>
              </div>
              <Badge className="bg-muted text-muted-foreground border-border">Client</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">System Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">Backup Database</Button>
            <Button variant="outline" className="w-full">
              View System Logs
            </Button>
            <Button variant="outline" className="w-full">
              Manage API Keys
            </Button>
            <Button variant="destructive" className="w-full">
              Emergency Maintenance Mode
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">Promote User to Admin</Button>
            <Button variant="outline" className="w-full">
              Reset User Password
            </Button>
            <Button variant="outline" className="w-full">
              View All Sessions
            </Button>
            <Button variant="destructive" className="w-full">
              Suspend User Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}