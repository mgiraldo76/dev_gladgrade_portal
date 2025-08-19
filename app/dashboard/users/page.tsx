// app/dashboard/users/page.tsx 

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Shield, Users, Building, AlertTriangle, Database, Key, Edit, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Permission {
  name: string
  description: string
}

interface Employee {
  id: number
  email: string
  full_name: string
  role: string
  status: string
  department_name?: string
  department_id?: number  // ADD THIS LINE
  position_title?: string
  has_firebase_account: boolean
  created_at: string
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  
  // Permission states
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [employeePermissions, setEmployeePermissions] = useState<string[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    full_name: "",
    department_id: "",
    role: "employee",
    create_firebase_account: true,
    temporary_password: "",
    permissions: [] as string[]
  })

  const [editEmployee, setEditEmployee] = useState({
    id: 0,
    email: "",
    full_name: "",
    department_id: "",
    role: "employee",
    status: "active",
    permissions: [] as string[]
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("📊 Loading employees, departments, and permissions...")

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

      // Load available permissions
      const permissionsResponse = await apiClient.getAvailablePermissions()
      if (permissionsResponse.success) {
        setAvailablePermissions(permissionsResponse.data)
        console.log("✅ Permissions loaded:", permissionsResponse.data.length)
      }

    } catch (error) {
      console.error("❌ Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeePermissions = async (employeeId: number) => {
    setLoadingPermissions(true)
    try {
      const response = await apiClient.getEmployeePermissions(employeeId)
      if (response.success) {
        setEmployeePermissions(response.data)
        setEditEmployee(prev => ({ ...prev, permissions: response.data }))
      }
    } catch (error) {
      console.error("❌ Error loading employee permissions:", error)
      toast.error("Failed to load employee permissions")
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      console.log("👤 Creating employee:", newEmployee)
      
      const response = await apiClient.createEmployee({
        email: newEmployee.email,
        full_name: newEmployee.full_name,
        department_id: newEmployee.department_id && newEmployee.department_id !== "none" ? parseInt(newEmployee.department_id) : undefined, // FIX: Handle "none" value
        role: newEmployee.role,
        permissions: newEmployee.permissions,
        create_firebase_account: newEmployee.create_firebase_account,
        temporary_password: newEmployee.temporary_password
      })

      if (response.success) {
        toast.success("Employee created successfully")
        setIsCreateUserOpen(false)
        setNewEmployee({
          email: "",
          full_name: "",
          department_id: "",
          role: "employee",
          create_firebase_account: true,
          temporary_password: "",
          permissions: []
        })
        loadData()
      } else {
        toast.error(response.error || "Failed to create employee")
      }
    } catch (error) {
      console.error("❌ Error creating employee:", error)
      toast.error("Failed to create employee")
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditEmployee({
      id: employee.id,
      email: employee.email,
      full_name: employee.full_name,
      department_id: employee.department_id?.toString() || "none", // FIX: Use "none" instead of empty string
      role: employee.role,
      status: employee.status,
      permissions: []
    })
    loadEmployeePermissions(employee.id)
    setIsEditEmployeeOpen(true)
  }

  const handleUpdateEmployee = async () => {
    try {
      console.log("📝 Updating employee:", editEmployee)
      
      const response = await apiClient.updateEmployee({
        id: editEmployee.id,
        email: editEmployee.email,
        full_name: editEmployee.full_name,
        department_id: editEmployee.department_id && editEmployee.department_id !== "" && editEmployee.department_id !== "none" ? parseInt(editEmployee.department_id) : undefined, // FIX: Handle "none" value
        role: editEmployee.role,
        status: editEmployee.status,
        permissions: editEmployee.permissions
      })
  
      if (response.success) {
        // Update permissions separately
        await apiClient.updateEmployeePermissions(editEmployee.id, editEmployee.permissions)
        
        toast.success("Employee updated successfully")
        setIsEditEmployeeOpen(false)
        loadData()
      } else {
        toast.error(response.error || "Failed to update employee")
      }
    } catch (error) {
      console.error("❌ Error updating employee:", error)
      toast.error("Failed to update employee")
    }
  }

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) {
      return
    }

    try {
      const response = await apiClient.deleteEmployee(employee.id)
      if (response.success) {
        toast.success("Employee deleted successfully")
        loadData()
      } else {
        toast.error(response.error || "Failed to delete employee")
      }
    } catch (error) {
      console.error("❌ Error deleting employee:", error)
      toast.error("Failed to delete employee")
    }
  }

  const handlePermissionToggle = (permissionName: string, isCreate: boolean = false) => {
    if (isCreate) {
      setNewEmployee(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionName)
          ? prev.permissions.filter(p => p !== permissionName)
          : [...prev.permissions, permissionName]
      }))
    } else {
      setEditEmployee(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionName)
          ? prev.permissions.filter(p => p !== permissionName)
          : [...prev.permissions, permissionName]
      }))
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === "all" || employee.role === selectedRole
    
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage employee accounts and permissions</p>
        </div>
        <Button onClick={() => setIsCreateUserOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{employee.full_name}</h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.role}
                      </Badge>
                      {employee.department_name && (
                        <Badge variant="outline">{employee.department_name}</Badge>
                      )}
                      {employee.has_firebase_account && (
                        <Badge variant="outline" className="text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Firebase
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEmployee(employee)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Employee Modal */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>
              Add a new employee to the system with appropriate permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="john@gladgrade.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
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
            </div>

            {/* Permissions Section */}
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {availablePermissions.map((permission) => (
                  <div key={permission.name} className="flex items-start space-x-2">
                    <Checkbox
                      id={`new-${permission.name}`}
                      checked={newEmployee.permissions.includes(permission.name)}
                      onCheckedChange={() => handlePermissionToggle(permission.name, true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`new-${permission.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmployee}>
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee: {selectedEmployee?.full_name}</DialogTitle>
            <DialogDescription>
              Update employee information and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_full_name">Full Name</Label>
                <Input
                  id="edit_full_name"
                  value={editEmployee.full_name}
                  onChange={(e) => setEditEmployee({ ...editEmployee, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editEmployee.email}
                  onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_role">Role</Label>
                <Select
                  value={editEmployee.role}
                  onValueChange={(value) => setEditEmployee({ ...editEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={editEmployee.status}
                  onValueChange={(value) => setEditEmployee({ ...editEmployee, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            

            {/* ADD THIS NEW DEPARTMENT SECTION */}
            <div>
              <Label htmlFor="edit_department">Department</Label>
              <Select
                value={editEmployee.department_id}
                onValueChange={(value) => setEditEmployee({ ...editEmployee, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* END OF NEW DEPARTMENT SECTION */}


            {/* Permissions Section */}
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              {loadingPermissions ? (
                <div className="animate-pulse mt-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {availablePermissions.map((permission) => (
                    <div key={permission.name} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-${permission.name}`}
                        checked={editEmployee.permissions.includes(permission.name)}
                        onCheckedChange={() => handlePermissionToggle(permission.name, false)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`edit-${permission.name}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee}>
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}