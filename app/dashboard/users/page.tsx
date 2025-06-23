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
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

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
    } catch (error) {
      console.error("❌ Error loading data:", error)
    } finally {
      setLoading(false)
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

  const clients = [
    {
      id: 1,
      businessName: "Miami Beach Restaurant",
      contactName: "Carlos Martinez",
      email: "carlos@miamibeach.com",
      securityLevel: "verified",
      gcsgScore: 785,
      status: "active",
      joinDate: "2024-01-15",
      locations: 3,
      monthlyReviews: 45,
    },
    {
      id: 2,
      businessName: "Downtown Coffee Shop",
      contactName: "Emma Wilson",
      email: "emma@downtowncoffee.com",
      securityLevel: "pending",
      gcsgScore: 692,
      status: "pending_verification",
      joinDate: "2024-06-10",
      locations: 1,
      monthlyReviews: 12,
    },
  ]

  const securityLevels = [
    { value: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
    { value: "pending", label: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
    { value: "flagged", label: "Security Review", color: "bg-red-100 text-red-800" },
    { value: "suspended", label: "Suspended", color: "bg-gray-100 text-gray-800" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">User Management</h1>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">PostgreSQL + Firebase Integration</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark text-dark">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900">Create New Employee</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Add a new GladGrade team member to PostgreSQL and optionally Firebase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emp-name">Full Name</Label>
                  <Input
                    id="emp-name"
                    placeholder="John Doe"
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-email">Email</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    placeholder="john@gladgrade.com"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-role">Role</Label>
                  <Select
                    value={newEmployee.role}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-dept">Department</Label>
                  <Select
                    value={newEmployee.department_id}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firebase Integration Options */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-orange-600" />
                      <Label htmlFor="create-firebase">Create Firebase Account</Label>
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
                      <Label htmlFor="temp-password">Temporary Password (optional)</Label>
                      <Input
                        id="temp-password"
                        type="password"
                        placeholder="Leave empty for auto-generated"
                        value={newEmployee.temporary_password}
                        onChange={(e) => setNewEmployee({ ...newEmployee, temporary_password: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">If empty, a secure password will be auto-generated</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEmployee}
                  className="bg-primary hover:bg-primary-dark text-dark"
                  disabled={!newEmployee.email || !newEmployee.full_name}
                >
                  Create Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900">Edit Employee</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Update employee information in PostgreSQL and Firebase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-name">Full Name</Label>
                  <Input
                    id="edit-emp-name"
                    value={editEmployee.full_name}
                    onChange={(e) => setEditEmployee({ ...editEmployee, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-email">Email</Label>
                  <Input
                    id="edit-emp-email"
                    type="email"
                    value={editEmployee.email}
                    onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-role">Role</Label>
                  <Select
                    value={editEmployee.role}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-status">Status</Label>
                  <Select
                    value={editEmployee.status}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emp-dept">Department</Label>
                  <Select
                    value={editEmployee.department_id}
                    onValueChange={(value) => setEditEmployee({ ...editEmployee, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firebase Account Info */}
                {selectedEmployee?.firebase_uid && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <Key className="h-4 w-4" />
                      <span>Firebase Account: {selectedEmployee.firebase_uid.substring(0, 20)}...</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Changes will be synced to Firebase Authentication</p>
                  </div>
                )}
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditEmployee}
                  className="bg-primary hover:bg-primary-dark text-dark"
                  disabled={!editEmployee.email || !editEmployee.full_name}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900">Register New Client</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Add a new business to the GladGrade platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="biz-name">Business Name</Label>
                  <Input id="biz-name" placeholder="Amazing Restaurant" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Contact Person</Label>
                  <Input id="contact-name" placeholder="Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-email">Business Email</Label>
                  <Input id="biz-email" type="email" placeholder="jane@amazing-restaurant.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-level">Security Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Set security level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Verification</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="flagged">Security Review Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locations">Number of Locations</Label>
                  <Input id="locations" type="number" placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant & Food</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateClientOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary-dark text-dark">Register Client</Button>
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
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                GladGrade Team Members
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  PostgreSQL + Firebase
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50">
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
                          <h3 className="font-semibold">{employee.full_name}</h3>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          <p className="text-sm text-gray-500">{employee.department_name || "No Department"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-600">ID: {employee.id}</span>
                            {employee.firebase_uid && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
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
                              ? "bg-red-100 text-red-800"
                              : employee.role === "moderator"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {employee.role}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {employee.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
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
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Search businesses..." className="pl-10" />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by security" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Security Levels</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{client.businessName}</h3>
                          <p className="text-sm text-gray-600">
                            {client.contactName} • {client.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.locations} location{client.locations > 1 ? "s" : ""} • Joined{" "}
                            {new Date(client.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{client.gcsgScore}</div>
                          <div className="text-xs text-gray-500">GCSG Score</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{client.monthlyReviews}</div>
                          <div className="text-xs text-gray-500">Reviews/month</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge
                            className={
                              securityLevels.find((s) => s.value === client.securityLevel)?.color ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {client.securityLevel === "flagged" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {client.securityLevel === "verified" && <Shield className="h-3 w-3 mr-1" />}
                            {securityLevels.find((s) => s.value === client.securityLevel)?.label}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{employees.length}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{employees.filter((e) => e.firebase_uid).length}</div>
                <div className="text-sm text-gray-600">Firebase Accounts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">247</div>
                <div className="text-sm text-gray-600">Active Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">189</div>
                <div className="text-sm text-gray-600">Verified Businesses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
