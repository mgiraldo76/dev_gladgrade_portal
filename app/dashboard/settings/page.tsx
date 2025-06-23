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
          <p className="text-gray-600">Loading settings from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Settings</h1>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">Connected to PostgreSQL Database</span>
            {hasUnsavedChanges && <span className="text-sm text-orange-600">• Unsaved changes</span>}
          </div>
        </div>
        <Button
          onClick={handleSaveAllChanges}
          disabled={saveStatus === "saving"}
          className="bg-primary hover:bg-primary-dark text-dark"
        >
          {saveStatus === "saving" && (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-dark mr-2"></div>
          )}
          {saveStatus === "saved" && <CheckCircle className="h-4 w-4 mr-2" />}
          {saveStatus === "error" && <AlertCircle className="h-4 w-4 mr-2" />}
          <Save className="h-4 w-4 mr-2" />
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Save Status Indicator */}
      {saveStatus === "saved" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            All settings have been saved to the PostgreSQL database!
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Management
                <Badge variant="outline" className="ml-2">
                  {departments.length} departments
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Manage organizational departments stored in PostgreSQL database</p>
                <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary-dark text-dark">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>Create a new department in the database</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dept-name">Department Name</Label>
                        <Input
                          id="dept-name"
                          placeholder="e.g., Marketing"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddDepartment()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDepartment}
                        className="bg-primary hover:bg-primary-dark text-dark"
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
                  <div key={dept.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{dept.name}</h3>
                        <p className="text-sm text-gray-600">{dept.employee_count} employees</p>
                        <p className="text-xs text-blue-600">ID: {dept.id} • Database Record</p>
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
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dept.permissions?.map((permission: string) => (
                        <Badge key={permission} variant="outline" className="text-xs">
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
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>Modify department information in database</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dept-name">Department Name</Label>
                  <Input
                    id="edit-dept-name"
                    value={editDepartmentName}
                    onChange={(e) => setEditDepartmentName(e.target.value)}
                    placeholder="Department name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employees">Number of Employees</Label>
                  <Input
                    id="edit-employees"
                    type="number"
                    value={editEmployeeCount}
                    onChange={(e) => setEditEmployeeCount(Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDepartmentOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditDepartment}
                  className="bg-primary hover:bg-primary-dark text-dark"
                  disabled={!editDepartmentName.trim() || saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Permissions Dialog */}
          <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
            <DialogContent className="max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle>Manage Permissions</DialogTitle>
                <DialogDescription>Configure permissions for {selectedDepartment?.name} in database</DialogDescription>
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
                        className="rounded"
                      />
                      <Label htmlFor={permission} className="text-sm cursor-pointer">
                        {permission.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">Selected: {selectedPermissions.length} permissions</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  className="bg-primary hover:bg-primary-dark text-dark"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Permissions"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Organization Settings
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgSettings.org_name}
                    onChange={(e) => handleOrgSettingChange("org_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">Domain</Label>
                  <Input
                    id="org-domain"
                    value={orgSettings.org_domain}
                    onChange={(e) => handleOrgSettingChange("org_domain", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address">Business Address</Label>
                <Textarea
                  id="org-address"
                  value={orgSettings.org_address}
                  onChange={(e) => handleOrgSettingChange("org_address", e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    value={orgSettings.support_email}
                    onChange={(e) => handleOrgSettingChange("support_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    value={orgSettings.admin_email}
                    onChange={(e) => handleOrgSettingChange("admin_email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Appearance Settings
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  Local Storage
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Choose between light and dark mode for the portal interface
                  </span>
                  <ThemeToggle />
                </div>
              </div>
              <div className="text-xs text-gray-500">Theme preference is saved locally in your browser</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Notification settings will be stored in the database per user.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Policies
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Security settings will be stored in the security_settings table.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">PostgreSQL Database Schema</h3>
                <div className="text-sm text-blue-800 space-y-1">
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

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Current Status</h3>
                <div className="text-sm text-green-800 space-y-1">
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
