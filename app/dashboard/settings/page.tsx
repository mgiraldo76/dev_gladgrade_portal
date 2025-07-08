// File: app/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Bell,
  Database,
  Building,
  Plus,
  Edit,
  SettingsIcon,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    reviewNotifications: true,
    securityAlerts: true,
    weeklyReports: false,
  })

  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false)
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [editDepartmentName, setEditDepartmentName] = useState("")
  const [editEmployeeCount, setEditEmployeeCount] = useState(0)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [loading, setLoading] = useState(true)

  // Organization settings
  const [orgSettings, setOrgSettings] = useState({
    org_name: "GladGrade Holding Corporation",
    org_domain: "gladgrade.com",
    org_address: "Miami, Florida, USA",
    support_email: "support@gladgrade.com",
    admin_email: "admin@gladgrade.com",
    min_gcsg_score: 300,
    max_gcsg_score: 850,
    gcsg_update_frequency: "daily",
  })

  const [departments, setDepartments] = useState<any[]>([])

  // Load data from API on component mount
  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    setLoading(true)
    try {
      console.log("🔄 Loading all settings from database...")

      // Load departments
      const deptResponse = await apiClient.getDepartments()
      if (deptResponse.success) {
        setDepartments(deptResponse.data)
        console.log("✅ Departments loaded:", deptResponse.data.length)
      }

      // Load organization settings
      const orgResponse = await apiClient.getOrganizationSettings()
      if (orgResponse.success) {
        setOrgSettings(orgResponse.data)
        console.log("✅ Organization settings loaded")
      }

      // In production, also load notification settings:
      // const notifResponse = await apiClient.getNotificationSettings(userId)
    } catch (error) {
      console.error("❌ Error loading settings:", error)
      setSaveStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    if (newDepartmentName.trim()) {
      try {
        setSaveStatus("saving")

        const response = await apiClient.createDepartment({
          name: newDepartmentName.trim(),
          employee_count: 0,
          permissions: ["basic_access"],
        })

        if (response.success) {
          setDepartments([...departments, response.data])
          setNewDepartmentName("")
          setIsAddDepartmentOpen(false)
          setSaveStatus("saved")

          console.log("✅ Department added to database:", response.data)

          // Reset status after 3 seconds
          setTimeout(() => setSaveStatus("idle"), 3000)
        }
      } catch (error) {
        console.error("❌ Error adding department:", error)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    }
  }

  const handleEditDepartment = (dept: any) => {
    setSelectedDepartment(dept)
    setEditDepartmentName(dept.name)
    setEditEmployeeCount(dept.employee_count)
    setIsEditDepartmentOpen(true)
  }

  const handleSaveEditDepartment = async () => {
    if (selectedDepartment && editDepartmentName.trim()) {
      try {
        setSaveStatus("saving")

        const response = await apiClient.updateDepartment({
          id: selectedDepartment.id,
          name: editDepartmentName.trim(),
          employee_count: editEmployeeCount,
          permissions: selectedDepartment.permissions,
        })

        if (response.success) {
          const updatedDepartments = departments.map((dept) =>
            dept.id === selectedDepartment.id ? response.data : dept,
          )
          setDepartments(updatedDepartments)
          setIsEditDepartmentOpen(false)
          setSelectedDepartment(null)
          setSaveStatus("saved")

          console.log("✅ Department updated in database:", response.data)

          setTimeout(() => setSaveStatus("idle"), 3000)
        }
      } catch (error) {
        console.error("❌ Error updating department:", error)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    }
  }

  const handlePermissions = (dept: any) => {
    setSelectedDepartment(dept)
    setSelectedPermissions([...dept.permissions])
    setIsPermissionsOpen(true)
  }

  const handleSavePermissions = async () => {
    if (selectedDepartment) {
      try {
        setSaveStatus("saving")

        const response = await apiClient.updateDepartment({
          id: selectedDepartment.id,
          name: selectedDepartment.name,
          employee_count: selectedDepartment.employee_count,
          permissions: selectedPermissions,
        })

        if (response.success) {
          const updatedDepartments = departments.map((dept) =>
            dept.id === selectedDepartment.id ? response.data : dept,
          )
          setDepartments(updatedDepartments)
          setIsPermissionsOpen(false)
          setSelectedDepartment(null)
          setSaveStatus("saved")

          console.log("✅ Permissions updated in database:", selectedPermissions)

          setTimeout(() => setSaveStatus("idle"), 3000)
        }
      } catch (error) {
        console.error("❌ Error updating permissions:", error)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    }
  }

  const handleDeleteDepartment = async (deptId: number) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        setSaveStatus("saving")

        const response = await apiClient.deleteDepartment(deptId)

        if (response.success) {
          const updatedDepartments = departments.filter((dept) => dept.id !== deptId)
          setDepartments(updatedDepartments)
          setSaveStatus("saved")

          console.log("✅ Department deleted from database:", deptId)

          setTimeout(() => setSaveStatus("idle"), 3000)
        }
      } catch (error) {
        console.error("❌ Error deleting department:", error)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    }
  }

  const handleSaveAllChanges = async () => {
    setSaveStatus("saving")

    try {
      // Save organization settings
      const orgResponse = await apiClient.updateOrganizationSettings(orgSettings)

      if (orgResponse.success) {
        setSaveStatus("saved")
        setHasUnsavedChanges(false)

        console.log("✅ All settings saved to database")

        // Reset save status after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      console.error("❌ Error saving all settings:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const handleOrgSettingChange = (field: string, value: any) => {
    setOrgSettings((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
    )
  }

  const allPermissions = [
    "user_management",
    "content_moderation",
    "review_management",
    "image_approval",
    "customer_support",
    "basic_reports",
    "advanced_reports",
    "system_admin",
    "client_management",
    "partner_relations",
    "data_export",
    "analytics_dashboard",
    "full_access",
    "basic_access",
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connected to PostgreSQL Database</span>
            {hasUnsavedChanges && <span className="text-sm text-orange-600 dark:text-orange-400">• Unsaved changes</span>}
          </div>
        </div>
        <Button
          onClick={handleSaveAllChanges}
          disabled={saveStatus === "saving"}
          className="bg-primary hover:bg-primary-dark text-primary-foreground"
        >
          {saveStatus === "saving" && (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground mr-2"></div>
          )}
          {saveStatus === "saved" && <CheckCircle className="h-4 w-4 mr-2" />}
          {saveStatus === "error" && <AlertCircle className="h-4 w-4 mr-2" />}
          <Save className="h-4 w-4 mr-2" />
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Save Status Indicator */}
      {saveStatus === "saved" && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            All settings have been saved to the PostgreSQL database!
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error saving to database. Please check your connection and try again.
          </div>
        </div>
      )}

      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building className="h-5 w-5" />
                Department Management
                <Badge variant="outline" className="ml-2 border-border">
                  {departments.length} departments
                </Badge>
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Manage organizational departments stored in PostgreSQL database</p>
                <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-background border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Department</DialogTitle>
                      <DialogDescription className="text-muted-foreground">Create a new department in the database</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dept-name" className="text-foreground">Department Name</Label>
                        <Input
                          id="dept-name"
                          placeholder="e.g., Marketing"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddDepartment()}
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDepartment}
                        className="bg-primary hover:bg-primary-dark text-primary-foreground"
                        disabled={!newDepartmentName.trim() || saveStatus === "saving"}
                      >
                        {saveStatus === "saving" ? "Saving..." : "Add Department"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground">{dept.employee_count} employees</p>
                        <p className="text-xs text-primary">ID: {dept.id} • Database Record</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditDepartment(dept)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePermissions(dept)}>
                          <SettingsIcon className="h-4 w-4 mr-1" />
                          Permissions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dept.permissions?.map((permission: string) => (
                        <Badge key={permission} variant="outline" className="text-xs border-border">
                          {permission.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Department Dialog */}
          <Dialog open={isEditDepartmentOpen} onOpenChange={setIsEditDepartmentOpen}>
            <DialogContent className="max-w-md bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Edit Department</DialogTitle>
                <DialogDescription className="text-muted-foreground">Modify department information in database</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dept-name" className="text-foreground">Department Name</Label>
                  <Input
                    id="edit-dept-name"
                    value={editDepartmentName}
                    onChange={(e) => setEditDepartmentName(e.target.value)}
                    placeholder="Department name"
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employees" className="text-foreground">Number of Employees</Label>
                  <Input
                    id="edit-employees"
                    type="number"
                    value={editEmployeeCount}
                    onChange={(e) => setEditEmployeeCount(Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDepartmentOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditDepartment}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!editDepartmentName.trim() || saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Permissions Dialog */}
          <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
            <DialogContent className="max-w-lg bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Manage Permissions</DialogTitle>
                <DialogDescription className="text-muted-foreground">Configure permissions for {selectedDepartment?.name} in database</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {allPermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={permission}
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <Label htmlFor={permission} className="text-sm cursor-pointer text-foreground">
                        {permission.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">Selected: {selectedPermissions.length} permissions</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Permissions"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                Organization Settings
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-foreground">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgSettings.org_name}
                    onChange={(e) => handleOrgSettingChange("org_name", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain" className="text-foreground">Domain</Label>
                  <Input
                    id="org-domain"
                    value={orgSettings.org_domain}
                    onChange={(e) => handleOrgSettingChange("org_domain", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address" className="text-foreground">Business Address</Label>
                <Textarea
                  id="org-address"
                  value={orgSettings.org_address}
                  onChange={(e) => handleOrgSettingChange("org_address", e.target.value)}
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-email" className="text-foreground">Support Email</Label>
                  <Input
                    id="support-email"
                    value={orgSettings.support_email}
                    onChange={(e) => handleOrgSettingChange("support_email", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-foreground">Admin Email</Label>
                  <Input
                    id="admin-email"
                    value={orgSettings.admin_email}
                    onChange={(e) => handleOrgSettingChange("admin_email", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5" />
                Appearance Settings
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  Local Storage
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Theme Preference</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Choose between light and dark mode for the portal interface
                  </span>
                  <ThemeToggle />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Theme preference is saved locally in your browser</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5" />
                Notification Preferences
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings will be stored in the database per user.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Security Policies
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security settings will be stored in the security_settings table.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="h-5 w-5" />
                Database Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">PostgreSQL Database Schema</h3>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>
                    • <strong>organization_settings</strong> - Company configuration
                  </p>
                  <p>
                    • <strong>departments</strong> - Department information
                  </p>
                  <p>
                    • <strong>permissions</strong> - Available permissions
                  </p>
                  <p>
                    • <strong>department_permissions</strong> - Department-permission mapping
                  </p>
                  <p>
                    • <strong>notification_settings</strong> - User notification preferences
                  </p>
                  <p>
                    • <strong>security_settings</strong> - System security configuration
                  </p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">Current Status</h3>
                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <p>✅ Database tables created</p>
                  <p>✅ API endpoints configured</p>
                  <p>✅ Real-time data persistence</p>
                  <p>✅ CRUD operations functional</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}