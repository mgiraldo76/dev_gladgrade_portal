// File: app/dashboard/users/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Shield, Users, Building, AlertTriangle, Database, Key } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  //const [clients, setClients] = useState<any[]>([])
  //const [clientsLoading, setClientsLoading] = useState(true)

  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [editEmployee, setEditEmployee] = useState({
    id: 0,
    email: "",
    full_name: "",
    department_id: "",
    role: "employee",
    status: "active",
    permissions: [] as string[],
  })

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    full_name: "",
    department_id: "",
    role: "employee",
    create_firebase_account: true,
    temporary_password: "",
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    //setClientsLoading(true)
    try {
      console.log("📊 Loading employees and departments...")

      // Load employees
      const empResponse = await apiClient.getEmployees()
      if (empResponse.success) {
        setEmployees(empResponse.data)
        console.log("✅ Employees loaded:", empResponse.data.length)
      }

      // Load departments
      const deptResponse = await apiClient.getDepartments()
      if (deptResponse.success) {
        setDepartments(deptResponse.data)
        console.log("✅ Departments loaded:", deptResponse.data.length)
      }

      // Load clients
      //console.log("📊 Loading business clients...")
      //const clientResponse = await apiClient.getClients()
      //if (clientResponse.success) {
      //  setClients(clientResponse.data)
      //  console.log("✅ Clients loaded:", clientResponse.data.length)
      //}
    } catch (error) {
      console.error("❌ Error loading data:", error)
    } finally {
      setLoading(false)
      //setClientsLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    if (!newEmployee.email || !newEmployee.full_name) {
      alert("Email and full name are required")
      return
    }

    try {
      console.log("👤 Creating employee with Firebase account:", newEmployee.create_firebase_account)

      const response = await apiClient.createEmployee({
        email: newEmployee.email,
        full_name: newEmployee.full_name,
        department_id: newEmployee.department_id ? Number.parseInt(newEmployee.department_id) : undefined,
        role: newEmployee.role,
        permissions: ["basic_access"],
        create_firebase_account: newEmployee.create_firebase_account,
        temporary_password: newEmployee.temporary_password || undefined,
      })

      if (response.success) {
        setEmployees([...employees, response.data])
        setNewEmployee({
          email: "",
          full_name: "",
          department_id: "",
          role: "employee",
          create_firebase_account: true,
          temporary_password: "",
        })
        setIsCreateUserOpen(false)

        // Show success message with Firebase info
        if (response.firebase_account_created) {
          alert(
            `✅ Employee created successfully!\n\n🔥 Firebase account created\n🔑 Temporary password: ${response.temporary_password || "Auto-generated"}\n\n📧 The employee can now log in with their email and password.`,
          )
        } else {
          alert("✅ Employee created successfully in database only (no Firebase account)")
        }

        console.log("✅ Employee created:", response.data)
      }
    } catch (error) {
      console.error("❌ Error creating employee:", error)
      alert("Failed to create employee. Please try again.")
    }
  }

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    setEditEmployee({
      id: employee.id,
      email: employee.email,
      full_name: employee.full_name,
      department_id: employee.department_id?.toString() || "0",
      role: employee.role,
      status: employee.status,
      permissions: employee.permissions || [],
    })
    setIsEditEmployeeOpen(true)
  }

  const handleSaveEditEmployee = async () => {
    if (!editEmployee.email || !editEmployee.full_name) {
      alert("Email and full name are required")
      return
    }

    try {
      console.log("🔄 Updating employee:", editEmployee.id)

      const response = await apiClient.updateEmployee({
        id: editEmployee.id,
        email: editEmployee.email,
        full_name: editEmployee.full_name,
        department_id: editEmployee.department_id ? Number.parseInt(editEmployee.department_id) : undefined,
        role: editEmployee.role,
        status: editEmployee.status,
        permissions: editEmployee.permissions,
      })

      if (response.success) {
        // Update the employee in the local state
        const updatedEmployees = employees.map((emp) => (emp.id === editEmployee.id ? response.data : emp))
        setEmployees(updatedEmployees)
        setIsEditEmployeeOpen(false)
        setSelectedEmployee(null)

        alert("✅ Employee updated successfully!")
        console.log("✅ Employee updated:", response.data)
      }
    } catch (error) {
      console.error("❌ Error updating employee:", error)
      alert("Failed to update employee. Please try again.")
    }
  }

  const securityLevels = [
    { value: "verified", label: "Verified", color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
    { value: "pending", label: "Pending Verification", color: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
    { value: "flagged", label: "Security Review", color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
    { value: "suspended", label: "Suspended", color: "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">PostgreSQL + Firebase Integration</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-background border-border">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-foreground">Create New Employee</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new GladGrade team member to PostgreSQL and optionally Firebase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emp-name" className="text-foreground">Full Name</Label>
                  <Input
                    id="emp-name"
                    placeholder="John Doe"
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-email" className="text-foreground">Email</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    placeholder="john@gladgrade.com"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-role" className="text-foreground">Role</Label>
                  <Select
                    value={newEmployee.role}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="employee" className="text-black hover:bg-gray-100">Employee</SelectItem>
                      <SelectItem value="moderator" className="text-black hover:bg-gray-100">Moderator</SelectItem>
                      <SelectItem value="admin" className="text-black hover:bg-gray-100">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-dept" className="text-foreground">Department</Label>
                  <Select
                    value={newEmployee.department_id}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, department_id: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()} className="text-black hover:bg-gray-100">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firebase Integration Options */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <Label htmlFor="create-firebase" className="text-foreground">Create Firebase Account</Label>
                    </div>
                    <Switch
                      id="create-firebase"
                      checked={newEmployee.create_firebase_account}
                      onCheckedChange={(checked) =>
                        setNewEmployee({ ...newEmployee, create_firebase_account: checked })
                      }
                    />
                  </div>

                  {newEmployee.create_firebase_account && (
                    <div className="space-y-2">
                      <Label htmlFor="temp-password" className="text-foreground">Temporary Password (optional)</Label>
                      <Input
                        id="temp-password"
                        type="password"
                        placeholder="Leave empty for auto-generated"
                        value={newEmployee.temporary_password}
                        onChange={(e) => setNewEmployee({ ...newEmployee, temporary_password: e.target.value })}
                        className="bg-background text-foreground border-border"
                      />
                      <p className="text-xs text-muted-foreground">If empty, a secure password will be auto-generated</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEmployee}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!newEmployee.email || !newEmployee.full_name}
                >
                  Create Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
            <DialogContent className="max-w-md bg-background border-border">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-foreground">Edit Employee</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Update employee information in PostgreSQL and Firebase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-name" className="text-foreground">Full Name</Label>
                  <Input
                    id="edit-emp-name"
                    value={editEmployee.full_name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, full_name: e.target.value })}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-email" className="text-foreground">Email</Label>
                  <Input
                    id="edit-emp-email"
                    type="email"
                    value={editEmployee.email}
                    onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-role" className="text-foreground">Role</Label>
                  <Select
                    value={editEmployee.role}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, role: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="employee" className="text-black hover:bg-gray-100">Employee</SelectItem>
                      <SelectItem value="moderator" className="text-black hover:bg-gray-100">Moderator</SelectItem>
                      <SelectItem value="admin" className="text-black hover:bg-gray-100">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-status" className="text-foreground">Status</Label>
                  <Select
                    value={editEmployee.status}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, status: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="active" className="text-black hover:bg-gray-100">Active</SelectItem>
                      <SelectItem value="inactive" className="text-black hover:bg-gray-100">Inactive</SelectItem>
                      <SelectItem value="suspended" className="text-black hover:bg-gray-100">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-dept" className="text-foreground">Department</Label>
                  <Select
                    value={editEmployee.department_id}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, department_id: value })}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="0" className="text-black hover:bg-gray-100">No Department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()} className="text-black hover:bg-gray-100">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firebase Account Info */}
                {selectedEmployee?.firebase_uid && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <Key className="h-4 w-4" />
                      <span>Firebase Account: {selectedEmployee.firebase_uid.substring(0, 20)}...</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Changes will be synced to Firebase Authentication</p>
                  </div>
                )}
              </div>
              <DialogFooter className="pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditEmployee}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!editEmployee.email || !editEmployee.full_name}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees ({employees.length})
          </TabsTrigger>
          
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5" />
                GladGrade Team Members
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL + Firebase
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background text-foreground border-border"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48 bg-background text-foreground border-border">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-black hover:bg-gray-100">All Roles</SelectItem>
                    <SelectItem value="admin" className="text-black hover:bg-gray-100">Admin</SelectItem>
                    <SelectItem value="moderator" className="text-black hover:bg-gray-100">Moderator</SelectItem>
                    <SelectItem value="employee" className="text-black hover:bg-gray-100">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="border border-border rounded-lg p-4 hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {employee.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{employee.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          <p className="text-sm text-muted-foreground">{employee.department_name || "No Department"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-primary">ID: {employee.id}</span>
                            {employee.firebase_uid && (
                              <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                                <Key className="h-3 w-3 mr-1" />
                                Firebase
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={employee.role === "admin" ? "destructive" : "secondary"}
                          className={
                            employee.role === "admin"
                              ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : employee.role === "moderator"
                                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                          }
                        >
                          {employee.role}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          {employee.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {employee.last_login
                            ? `Last: ${new Date(employee.last_login).toLocaleDateString()}`
                            : "Never logged in"}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {employee.permissions?.map((permission: string) => (
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
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building className="h-5 w-5" />
                Business Clients
                <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL Database
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search businesses..." className="pl-10 bg-background text-foreground border-border" />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-48 bg-background text-foreground border-border">
                    <SelectValue placeholder="Filter by security" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-black hover:bg-gray-100">All Security Levels</SelectItem>
                    <SelectItem value="verified" className="text-black hover:bg-gray-100">Verified</SelectItem>
                    <SelectItem value="pending" className="text-black hover:bg-gray-100">Pending</SelectItem>
                    <SelectItem value="flagged" className="text-black hover:bg-gray-100">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{employees.length}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">{employees.filter((e) => e.firebase_uid).length}</div>
                <div className="text-sm text-muted-foreground">Firebase Accounts</div>
              </div>
            </div>
          </CardContent>
        </Card>
       
       
      </div>
    </div>
  )
}