// Path: /app/dashboard/clients/team/page.tsx
// Name: Team Management Page for Client Admins

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
    Plus, 
    Search, 
    Users, 
    User, 
    Edit, 
    UserX, 
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trash2, 
    UserPlus
    
  } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/app/providers"

interface TeamMember {
  id: number
  email: string
  full_name: string
  role: string
  status: string
  last_login?: string
  created_at: string
  has_firebase_account: boolean
}

export default function TeamManagementPage() {
  const { user, businessId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null)
  
  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "client_user",
    temporary_password: "",
  })
  
  const [editUser, setEditUser] = useState({
    email: "",
    full_name: "",
    role: "client_user",
    status: "active",
    new_password: "",
  })

  // dont allow a client admin edit another admin
  const [showAdminWarning, setShowAdminWarning] = useState(false)
  const [pendingAdminData, setPendingAdminData] = useState<any>(null)



  // Load team members on component mount
  useEffect(() => {
    if (businessId) {
      loadTeamMembers()
    }
  }, [businessId])

  const loadTeamMembers = async () => {
    if (!businessId) {
      console.error("No business ID available")
      return
    }

    setLoading(true)
    try {
      console.log(`👥 Loading team members for business ${businessId}`)
      
      const response = await apiClient.getClientUsers(businessId)
      if (response.success) {
        setTeamMembers(response.data || [])
        console.log(`✅ Loaded ${response.data?.length || 0} team members`)
      } else {
        console.error("Failed to load team members:", response.error)
        setTeamMembers([])
      }
    } catch (error) {
      console.error("❌ Error loading team members:", error)
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Check if current user can edit target user
  const canEditUser = (targetUser: TeamMember): boolean => {
    // Prevent editing self
    if (targetUser.email === user?.email) {
      return false
    }
    
    // NEW: Prevent admin from editing other admins
    if (targetUser.role === 'client_admin') {
      return false
    }
    
    return true
  }


  // Get tooltip message for disabled edit buttons
  const getEditDisabledReason = (targetUser: TeamMember): string => {
    if (targetUser.email === user?.email) {
      return "Use the Profile page to edit your own account"
    }
    
    if (targetUser.role === 'client_admin') {
      return "Admin users can only be edited through GladGrade support tickets"
    }
    
    return ""
  }

  const handleAddUser = () => {
    if (!newUser.email.trim() || !newUser.full_name.trim()) {
      alert("Email and full name are required")
      return
    }
  
    if (!businessId) {
      alert("Business ID not available")
      return
    }
  
    // Check user limit (20 users max)
    if (teamMembers.length >= 20) {
      alert("You have reached the maximum limit of 20 team members")
      return
    }
  
    // NEW: Check if creating admin user
    if (newUser.role === 'client_admin') {
      setPendingAdminData({ ...newUser })
      setShowAdminWarning(true)
      return
    }
  
    // Proceed with normal user creation
    createUser(newUser)
  }

  // Confirm admin creation after warning
  const handleConfirmAdminCreation = () => {
    setShowAdminWarning(false)
    createUser(pendingAdminData)
    setPendingAdminData(null)
  }

  // Cancel admin creation
  const handleCancelAdminCreation = () => {
    setShowAdminWarning(false)
    setPendingAdminData(null)
  }

  // Actual user creation logic
  const createUser = async (userData: typeof newUser) => {
    try {
      console.log("👤 Creating new team member:", userData)

      const apiData = {
        email: userData.email.trim(),
        full_name: userData.full_name.trim(),
        role: userData.role,
        temporary_password: userData.temporary_password.trim() || undefined,
        create_firebase_account: true,
      }

      const response = await apiClient.createClientUser(businessId!, apiData)
      
      if (response.success) {
        console.log("✅ Team member created successfully:", response.data)
        
        // Reset form and close modal
        setNewUser({
          email: "",
          full_name: "",
          role: "client_user",
          temporary_password: "",
        })
        setIsAddUserOpen(false)
        
        // Reload team members
        loadTeamMembers()
        
        // Show success message
        if (response.firebase_account_created) {
          const roleText = userData.role === 'client_admin' ? 'Admin' : 'Team Member'
          alert(
            `✅ ${roleText} created successfully!\n\n🔥 Firebase account created\n🔑 Temporary password: ${response.temporary_password || "Auto-generated"}\n\n📧 They can now log in with their email and password.`
          )
        } else {
          alert("✅ Team member created successfully!")
        }
      } else {
        console.error("❌ Failed to create team member:", response.error)
        alert(`Failed to create team member: ${response.error}`)
      }
    } catch (error) {
      console.error("❌ Error creating team member:", error)
      alert("Error creating team member. Please try again.")
    }
  }


  const handleEditUser = (teamMember: TeamMember) => {
    // Check if user can be edited
    if (!canEditUser(teamMember)) {
      const reason = getEditDisabledReason(teamMember)
      alert(reason)
      return
    }
  
    setSelectedUser(teamMember)
    setEditUser({
      email: teamMember.email,
      full_name: teamMember.full_name,
      role: teamMember.role,
      status: teamMember.status,
      new_password: "",
    })
    setIsEditUserOpen(true)
  }

  const handleSaveEditUser = async () => {
    if (!selectedUser || !businessId) return

    if (!editUser.email.trim() || !editUser.full_name.trim()) {
      alert("Email and full name are required")
      return
    }

    try {
      console.log("📝 Updating team member:", selectedUser.id)

      const updateData: any = {
        email: editUser.email.trim(),
        full_name: editUser.full_name.trim(),
        role: editUser.role,
        status: editUser.status,
      }

      if (editUser.new_password.trim()) {
        updateData.new_password = editUser.new_password.trim()
      }

      const response = await apiClient.updateClientUser(businessId, selectedUser.id, updateData)
      
      if (response.success) {
        console.log("✅ Team member updated successfully")
        setIsEditUserOpen(false)
        setSelectedUser(null)
        loadTeamMembers()
        alert("Team member updated successfully!")
      } else {
        console.error("❌ Failed to update team member:", response.error)
        alert(`Failed to update team member: ${response.error}`)
      }
    } catch (error) {
      console.error("❌ Error updating team member:", error)
      alert("Error updating team member. Please try again.")
    }
  }

  const handleDeleteUser = async (teamMember: TeamMember) => {
    // Prevent deleting self
    if (teamMember.email === user?.email) {
      alert("You cannot delete your own account.")
      return
    }
  
    // NEW: Prevent deleting other admins
    if (teamMember.role === 'client_admin') {
      alert("Admin users can only be deactivated through GladGrade support tickets.")
      return
    }
  
    if (!confirm(`Are you sure you want to deactivate ${teamMember.full_name}?`)) {
      return
    }
  
    if (!businessId) return
  
    try {
      console.log("🗑️ Deactivating team member:", teamMember.id)
      
      const response = await apiClient.deleteClientUser(businessId, teamMember.id)
      
      if (response.success) {
        console.log("✅ Team member deactivated successfully")
        loadTeamMembers()
        alert("Team member deactivated successfully!")
      } else {
        console.error("❌ Failed to deactivate team member:", response.error)
        alert(`Failed to deactivate team member: ${response.error}`)
      }
    } catch (error) {
      console.error("❌ Error deactivating team member:", error)
      alert("Error deactivating team member. Please try again.")
    }
  }

  // Filter team members based on search and status
  const filteredTeamMembers = teamMembers.filter((member) => {
    const searchMatch = 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const statusMatch = statusFilter === "all" || member.status === statusFilter
    
    return searchMatch && statusMatch
  })

  // Role display mapping
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "client_admin": return "Admin"
      case "client_moderator": return "Moderator"
      case "client_user": return "User"
      case "client_viewer": return "Viewer"
      default: return role
    }
  }

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive": return <XCircle className="h-4 w-4 text-red-500" />
      case "suspended": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Manage your team members and permissions</span>
          </div>
        </div>
        <Button 
          onClick={() => setIsAddUserOpen(true)}
          disabled={teamMembers.length >= 20}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="space-y-4">
        {filteredTeamMembers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {teamMembers.length === 0 
                  ? "Start building your team by adding your first member."
                  : "No team members match your current filters."
                }
              </p>
              {teamMembers.length === 0 && (
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTeamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{member.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Added {new Date(member.created_at).toLocaleDateString()}</span>
                        {member.last_login && (
                          <span>• Last login {new Date(member.last_login).toLocaleDateString()}</span>
                        )}
                        {member.has_firebase_account && (
                          <span className="text-green-600">• Firebase Account</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Role Badge */}
                    <Badge variant="outline">
                      {getRoleDisplay(member.role)}
                    </Badge>

                    {/* Status */}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(member.status)}
                      <span className="text-sm capitalize">{member.status}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* MODIFIED: Conditional Edit Button */}
                      {canEditUser(member) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(member)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title={getEditDisabledReason(member)}
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {/* MODIFIED: Conditional Delete Button */}
                      {member.email !== user?.email && member.role !== 'client_admin' && member.status !== 'inactive' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(member)}
                          className="text-red-600 hover:text-red-700"
                          title="Deactivate user"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title={
                            member.email === user?.email 
                              ? "You cannot delete your own account"
                              : member.role === 'client_admin'
                              ? "Admin users can only be deactivated through GladGrade support"
                              : member.status === 'inactive'
                              ? "User is already inactive"
                              : "Cannot deactivate user"
                          }
                          className="opacity-50 cursor-not-allowed text-red-600"
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Team Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{teamMembers.length}/20</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.role === 'client_admin').length}
                </div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {teamMembers.filter(m => m.has_firebase_account).length}
                </div>
                <div className="text-sm text-muted-foreground">With Accounts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Create a new account for a team member. They will receive login credentials to access the portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      Admin (Full Access)
                    </div>
                  </SelectItem>
                  <SelectItem value="client_moderator">Moderator</SelectItem>
                  <SelectItem value="client_user">User</SelectItem>
                  <SelectItem value="client_viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporary_password">Temporary Password (Optional)</Label>
              <Input
                id="temporary_password"
                type="password"
                value={newUser.temporary_password}
                onChange={(e) => setNewUser({ ...newUser, temporary_password: e.target.value })}
                placeholder="Leave empty to auto-generate"
              />
            </div>
            {teamMembers.length >= 18 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Approaching limit: {teamMembers.length}/20 team members
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add Team Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      


      {/* NEW: Admin Creation Warning Dialog */}
      <Dialog open={showAdminWarning} onOpenChange={setShowAdminWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Admin Creation Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Creating an Admin cannot be undone by you.</strong> You must create a support ticket with GladGrade customer support to modify or remove Admin users.
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 leading-relaxed">
                <strong>It is highly recommended you DO NOT create users with Admin rights.</strong> Admin users have full access to all business settings, team management, and billing information.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Do you still want to create this Admin user?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancelAdminCreation}
              >
                No, Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmAdminCreation}
              >
                Yes, Create Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Edit User Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editUser.full_name}
                onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Admin (Full Access)
                      </div>
                    </SelectItem>
                    <SelectItem value="client_moderator">Moderator</SelectItem>
                    <SelectItem value="client_user">User</SelectItem>
                    <SelectItem value="client_viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={editUser.status}
                  onValueChange={(value) => setEditUser({ ...editUser, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Set New Password (Optional)</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={editUser.new_password}
                  onChange={(e) => setEditUser({ ...editUser, new_password: e.target.value })}
                  placeholder="Leave empty to keep current password"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}