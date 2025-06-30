"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Phone, Mail, MapPin, Globe, User, Building, Users, Plus } from "lucide-react"
import { useAuth } from "@/app/providers"

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: any
  onSuccess: () => void
  userRole: string
}

export function EditClientModal({ isOpen, onClose, client, onSuccess, userRole }: EditClientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [clientUsers, setClientUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [businessSectors, setBusinessSectors] = useState([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    business_address: "",
    city: "",
    state: "",
    zip_code: "",
    website: "",
    industry_category: "",
    business_description: "",
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
      console.log("🔍 Loading client data:", client)
      setFormData({
        business_name: client.business_name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        business_address: client.business_address || "",
        city: client.city || "",
        state: client.state || "",
        zip_code: client.zip_code || "",
        website: client.website || "",
        industry_category: client.industry_category || "",
        business_description: client.business_description || "",
        claim_status: client.claim_status || "unclaimed",
        notes: client.notes || "",
      })
      loadBusinessSectors()
      loadClientUsers()
      loadClientActivities()
    }
  }, [client])

  const loadBusinessSectors = async () => {
    try {
      const response = await fetch("/api/business-sectors")
      if (response.ok) {
        const data = await response.json()
        setBusinessSectors(data.data || [])
      }
    } catch (error) {
      console.error("Error loading business sectors:", error)
    }
  }

  const loadClientUsers = async () => {
    if (!client?.id) return

    setLoadingUsers(true)
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/users`, { headers })
      if (response.ok) {
        const data = await response.json()
        setClientUsers(data.data || [])
      }
    } catch (error) {
      console.error("Error loading client users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadClientActivities = async () => {
    if (!client?.id) return

    setLoadingActivities(true)
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/activities`, { headers })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.data || [])
      }
    } catch (error) {
      console.error("Error loading client activities:", error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
  
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
  
      if (user?.email) {
        headers["x-user-email"] = user.email
      }
  
      console.log("🔍 Submitting client update with headers:", headers)
      console.log("🔍 Form data:", formData)
  
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      })
  
      console.log("🔍 Response status:", response.status) // Add this
      const result = await response.json()
      console.log("🔍 API Response:", result) // Add this
  
      if (response.ok && result.success) {
        console.log("✅ Client updated successfully:", result)
        onSuccess()
        onClose()
      } else {
        console.error("Failed to update client:", result)
        alert(`Failed to update client: ${result.error || result.details || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error updating client:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Error updating client: ${errorMessage}`)

    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.user_email || !newUser.user_name) {
      alert("Email and name are required")
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers,
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

  const getStatusColor = (status: string) => {
    const colors = {
      unclaimed: "bg-gray-100 text-gray-800",
      claimed: "bg-blue-100 text-blue-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (!client) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building className="h-5 w-5" />
              {client.business_name || "Unnamed Business"}
              <Badge className={getStatusColor(client.claim_status)}>{client.claim_status || "unclaimed"}</Badge>
            </DialogTitle>
            <DialogDescription>Edit client information and manage portal users</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="users">Portal Users ({clientUsers.length})</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{client.business_name || "Unnamed Business"}</span>
                    </div>
                    {client.industry_category && (
                      <div className="text-sm text-gray-600">Industry: {client.industry_category}</div>
                    )}
                    {client.business_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">
                          {client.business_address}
                          {client.city && `, ${client.city}`}
                          {client.state && `, ${client.state}`}
                          {client.zip_code && ` ${client.zip_code}`}
                        </span>
                      </div>
                    )}
                    {client.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {client.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {client.contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{client.contact_name}</span>
                      </div>
                    )}
                    {client.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a href={`mailto:${client.contact_email}`} className="text-sm text-blue-600 hover:underline">
                          {client.contact_email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Created: {new Date(client.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600">Sales Rep: {client.sales_rep_name || "Unassigned"}</div>
                    <div className="text-sm text-gray-600">Client ID: {client.id}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{client.notes || "No notes available"}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange("business_name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange("contact_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange("business_address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry_category">Industry</Label>
                    <Select
                      value={formData.industry_category}
                      onValueChange={(value) => handleInputChange("industry_category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessSectors.map((sector: any) => (
                          <SelectItem key={sector.id} value={sector.businesssectorname}>
                            {sector.businesssectorname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claim_status">Claim Status</Label>
                  <Select
                    value={formData.claim_status}
                    onValueChange={(value) => handleInputChange("claim_status", value)}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_description">Business Description</Label>
                  <Textarea
                    id="business_description"
                    value={formData.business_description}
                    onChange={(e) => handleInputChange("business_description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
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
                  {clientUsers.map((user: any) => (
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
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              Reset Password
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
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Client User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a portal user for {client?.business_name || "this business"}
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
