"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, User, MapPin, Calendar, Users, Edit, Save, X, Plus, Trash2, Key } from "lucide-react"

interface ClientDetailsModalProps {
  client: any
  isOpen: boolean
  onClose: () => void
  onClientUpdated: () => void
}

export function ClientDetailsModal({ client, isOpen, onClose, onClientUpdated }: ClientDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [clientUsers, setClientUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [editedClient, setEditedClient] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    website: "",
    business_address: "",
    city: "",
    state: "",
    zip_code: "",
    business_description: "",
    industry_category: "",
    claim_status: "unclaimed",
    notes: "",
  })

  const [newUser, setNewUser] = useState({
    user_email: "",
    user_name: "",
    user_role: "client_admin",
    temporary_password: "",
  })

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setEditedClient({
        business_name: client.business_name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        website: client.website || "",
        business_address: client.business_address || "",
        city: client.city || "",
        state: client.state || "",
        zip_code: client.zip_code || "",
        business_description: client.business_description || "",
        industry_category: client.industry_category || "",
        claim_status: client.claim_status || "unclaimed",
        notes: client.notes || "",
      })
    }
  }, [client])

  // Load client users when modal opens
  useEffect(() => {
    if (isOpen && client) {
      loadClientUsers()
    }
  }, [isOpen, client])

  const loadClientUsers = async () => {
    if (!client) return

    setLoadingUsers(true)
    try {
      const response = await fetch(`/api/clients/${client.id}/users`)
      if (response.ok) {
        const result = await response.json()
        setClientUsers(result.data || [])
      }
    } catch (error) {
      console.error("Error loading client users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSave = async () => {
    if (!client) return

    setSaving(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedClient),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditing(false)
        onClientUpdated()
        console.log("✅ Client updated successfully")
      } else {
        alert(`Error updating client: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Error updating client:", error)
      alert("Failed to update client. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.user_email || !newUser.user_name) {
      alert("Email and name are required")
      return
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          business_id: client.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setNewUser({
          user_email: "",
          user_name: "",
          user_role: "client_admin",
          temporary_password: "",
        })
        setIsUserModalOpen(false)
        loadClientUsers() // Reload users list

        if (result.firebase_account_created) {
          alert(
            `✅ Client user created successfully!\n\n🔥 Firebase account created\n🔑 Temporary password: ${result.temporary_password || "Auto-generated"}\n\n📧 The client can now log in with their email and password.`,
          )
        } else {
          alert("✅ Client user created successfully in database only (no Firebase account)")
        }
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Error creating client user:", error)
      alert("Failed to create client user. Please try again.")
    }
  }

  if (!client) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-6 w-6 text-primary" />
                  {client.business_name}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Client ID: {client.id} • Created: {new Date(client.created_at).toLocaleDateString()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Business Details</TabsTrigger>
              <TabsTrigger value="users">Portal Users</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      {isEditing ? (
                        <Input
                          id="business_name"
                          value={editedClient.business_name}
                          onChange={(e) => setEditedClient({ ...editedClient, business_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-medium">{client.business_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry_category">Industry</Label>
                      {isEditing ? (
                        <Input
                          id="industry_category"
                          value={editedClient.industry_category}
                          onChange={(e) => setEditedClient({ ...editedClient, industry_category: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{client.industry_category || "Not specified"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_description">Description</Label>
                      {isEditing ? (
                        <Textarea
                          id="business_description"
                          value={editedClient.business_description}
                          onChange={(e) => setEditedClient({ ...editedClient, business_description: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm">{client.business_description || "No description provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Claim Status</Label>
                      {isEditing ? (
                        <Select
                          value={editedClient.claim_status}
                          onValueChange={(value) => setEditedClient({ ...editedClient, claim_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unclaimed">Unclaimed</SelectItem>
                            <SelectItem value="claimed">Claimed</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={client.claim_status === "verified" ? "default" : "secondary"}>
                          {client.claim_status || "unclaimed"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      {isEditing ? (
                        <Input
                          id="contact_name"
                          value={editedClient.contact_name}
                          onChange={(e) => setEditedClient({ ...editedClient, contact_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-medium">{client.contact_name || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="contact_email"
                          type="email"
                          value={editedClient.contact_email}
                          onChange={(e) => setEditedClient({ ...editedClient, contact_email: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{client.contact_email || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedClient.phone}
                          onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{client.phone || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      {isEditing ? (
                        <Input
                          id="website"
                          value={editedClient.website}
                          onChange={(e) => setEditedClient({ ...editedClient, website: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">
                          {client.website ? (
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {client.website}
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_address">Street Address</Label>
                      {isEditing ? (
                        <Input
                          id="business_address"
                          value={editedClient.business_address}
                          onChange={(e) => setEditedClient({ ...editedClient, business_address: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{client.business_address || "Not provided"}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            value={editedClient.city}
                            onChange={(e) => setEditedClient({ ...editedClient, city: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{client.city || "Not provided"}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        {isEditing ? (
                          <Input
                            id="state"
                            value={editedClient.state}
                            onChange={(e) => setEditedClient({ ...editedClient, state: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm">{client.state || "Not provided"}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      {isEditing ? (
                        <Input
                          id="zip_code"
                          value={editedClient.zip_code}
                          onChange={(e) => setEditedClient({ ...editedClient, zip_code: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{client.zip_code || "Not provided"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Internal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      {isEditing ? (
                        <Textarea
                          id="notes"
                          value={editedClient.notes}
                          onChange={(e) => setEditedClient({ ...editedClient, notes: e.target.value })}
                          rows={4}
                          placeholder="Internal notes about this client..."
                        />
                      ) : (
                        <p className="text-sm">{client.notes || "No notes added"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Portal Users</h3>
                <Button onClick={() => setIsUserModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : clientUsers.length > 0 ? (
                <div className="space-y-3">
                  {clientUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.user_name}</p>
                              <p className="text-sm text-gray-600">{user.user_email}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {user.user_role}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Key className="h-3 w-3 mr-1" />
                              Reset Password
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No portal users found for this client</p>
                  <Button onClick={() => setIsUserModalOpen(true)} className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <h3 className="text-lg font-semibold">Activity Log</h3>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Activity log will be implemented here</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Client User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a portal user for {client?.business_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                placeholder="John Smith"
                value={newUser.user_name}
                onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="john@business.com"
                value={newUser.user_email}
                onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select value={newUser.user_role} onValueChange={(value) => setNewUser({ ...newUser, user_role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_admin">Business Admin</SelectItem>
                  <SelectItem value="client_manager">Business Manager</SelectItem>
                  <SelectItem value="client_user">Business User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password (optional)</Label>
              <Input
                id="temp-password"
                type="password"
                placeholder="Leave empty for auto-generated"
                value={newUser.temporary_password}
                onChange={(e) => setNewUser({ ...newUser, temporary_password: e.target.value })}
              />
              <p className="text-xs text-gray-500">If empty, a secure password will be auto-generated</p>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-primary hover:bg-primary-dark text-dark"
              disabled={!newUser.user_email || !newUser.user_name}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
