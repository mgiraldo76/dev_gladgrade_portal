// components/edit-client-modal.tsx - Enhanced with business_locations and FIXED to use business-sectors

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

// US States dropdown data
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
]

export function EditClientModal({ isOpen, onClose, client, onSuccess, userRole }: EditClientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [clientUsers, setClientUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  // FIXED: Changed from industryCategories to businessSectors
  const [businessSectors, setBusinessSectors] = useState([])
  const [salesReps, setSalesReps] = useState([])
  const [businessLocations, setBusinessLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  // Enhanced: Client form data (basic info only)
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    website: "",
    // FIXED: Changed from industry_category_id to business_type to match business sectors
    business_type: "",
    business_description: "",
    claim_status: "unclaimed",
    notes: "",
    sales_rep_id: "",
  })

  // NEW: Primary location form data (address components)
  const [locationData, setLocationData] = useState({
    id: null as number | null,
    location_name: "",
    address: "",
    city: "",
    state: "",
    country: "USA",
    postal_code: "",
    phone: "",
    manager_name: "",
    manager_email: "",
  })

  const [newUser, setNewUser] = useState({
    user_email: "",
    user_name: "",
    user_role: "client_admin",
    temporary_password: "",
  })

  // ENHANCED: Initialize form data and load business locations
  useEffect(() => {
    if (client) {
      console.log("🔍 Loading client data:", client)
      setFormData({
        business_name: client.business_name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        website: client.website || "",
        // FIXED: Map from industry_category_name (from API) to business_type (for form)
        business_type: client.industry_category_name || "",
        business_description: client.business_description || "",
        claim_status: client.claim_status || "unclaimed",
        notes: client.notes || "",
        sales_rep_id: client.sales_rep_id ? client.sales_rep_id.toString() : "unassigned",
      })
      // FIXED: Changed function name
      loadBusinessSectors()
      loadSalesReps()
      loadClientUsers()
      loadClientActivities()
      loadBusinessLocations()
    }
  }, [client])

  // FIXED: Changed from loadIndustryCategories to loadBusinessSectors and updated endpoint
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

  const loadSalesReps = async () => {
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }
      
      const response = await fetch("/api/employees", { headers })
      if (response.ok) {
        const data = await response.json()
        const salesTeam = data.data.filter((emp: any) => 
          emp.department_name === "Sales" || 
          ["CEO", "CCO", "Sales Manager"].includes(emp.role)
        )
        setSalesReps(salesTeam)
      }
    } catch (error) {
      console.error("Error loading sales reps:", error)
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

  // NEW: Load business locations
  const loadBusinessLocations = async () => {
    if (!client?.id) return

    setLoadingLocations(true)
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/locations`, { headers })
      if (response.ok) {
        const data = await response.json()
        const locations = data.data || []
        setBusinessLocations(locations)
        
        // Load primary location data
        const primaryLocation = locations.find((loc: any) => loc.is_primary) || locations[0]
        if (primaryLocation) {
          setLocationData({
            id: primaryLocation.id,
            location_name: primaryLocation.location_name || "",
            address: primaryLocation.address || "",
            city: primaryLocation.city || "",
            state: primaryLocation.state || "",
            country: primaryLocation.country || "USA",
            postal_code: primaryLocation.postal_code || "",
            phone: primaryLocation.phone || "",
            manager_name: primaryLocation.manager_name || "",
            manager_email: primaryLocation.manager_email || "",
          })
        }
      }
    } catch (error) {
      console.error("Error loading business locations:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (field: string, value: string) => {
    setLocationData((prev) => ({ ...prev, [field]: value }))
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

      // FIXED: Need to find the business sector ID based on the selected business_type name
      const selectedSector = businessSectors.find((sector: any) => 
        sector.businesssectorname === formData.business_type
      )

      const updateData = {
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        website: formData.website,
        // FIXED: Map business_type back to industry_category_id for database storage
        // Note: This assumes your backend can handle business sector name lookup
        business_type: formData.business_type,
        claim_status: formData.claim_status,
        sales_rep_id: formData.sales_rep_id && formData.sales_rep_id !== "unassigned" ? parseInt(formData.sales_rep_id) : null,
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Update business location if data changed
        if (locationData.id && (
          locationData.address || locationData.city || locationData.state || 
          locationData.postal_code || locationData.phone
        )) {
          const locationResponse = await fetch(`/api/clients/${client.id}/locations/${locationData.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              location_name: locationData.location_name,
              address: locationData.address,
              city: locationData.city,
              state: locationData.state,
              country: locationData.country,
              postal_code: locationData.postal_code,
              phone: locationData.phone,
              manager_name: locationData.manager_name,
              manager_email: locationData.manager_email,
            }),
          })
          
          if (!locationResponse.ok) {
            console.warn("⚠️ Failed to update business location, but client update succeeded")
          }
        }

        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        alert(`Failed to update client: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error updating client:", error)
      alert("Error updating client")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newUser,
          client_id: client.id,
        }),
      })

      if (response.ok) {
        loadClientUsers()
        setIsUserModalOpen(false)
        setNewUser({
          user_email: "",
          user_name: "",
          user_role: "client_admin",
          temporary_password: "",
        })
      } else {
        const errorData = await response.json()
        alert(`Failed to create user: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error creating user")
    }
  }

  if (!client) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            {client.business_name}
            <Badge variant={client.claim_status === "verified" ? "default" : "secondary"}>
              {client.claim_status === "verified" ? "Verified" : client.claim_status || "Unclaimed"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Manage client information, locations, users, and activities
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
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
                    required
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
                  {/* FIXED: Changed from industry_category_id to business_type and updated to use businessSectors */}
                  <Label htmlFor="business_type">Industry</Label>
                  <Select
                    value={formData.business_type || undefined}
                    onValueChange={(value) => handleInputChange("business_type", value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessSectors
                        .filter((sector: any) => sector.id && sector.businesssectorname)
                        .map((sector: any) => (
                          <SelectItem key={sector.id} value={sector.businesssectorname}>
                            {sector.businesssectorname}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="claimed">Claimed</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sales_rep_id">Sales Representative</Label>
                  <Select
                    value={formData.sales_rep_id || undefined}
                    onValueChange={(value) => handleInputChange("sales_rep_id", value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales rep" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesReps.map((rep: any) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>
                          {rep.full_name} - {rep.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Label htmlFor="notes">Notes</Label>
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

          <TabsContent value="locations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Business Locations</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {loadingLocations ? (
              <div className="text-center py-4">Loading locations...</div>
            ) : (
              <div className="space-y-4">
                {/* Primary Location Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Primary Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location_name">Location Name</Label>
                        <Input
                          id="location_name"
                          value={locationData.location_name}
                          onChange={(e) => handleLocationChange("location_name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location_phone">Phone</Label>
                        <Input
                          id="location_phone"
                          value={locationData.phone}
                          onChange={(e) => handleLocationChange("phone", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={locationData.address}
                        onChange={(e) => handleLocationChange("address", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={locationData.city}
                          onChange={(e) => handleLocationChange("city", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={locationData.state}
                          onValueChange={(value) => handleLocationChange("state", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={locationData.postal_code}
                          onChange={(e) => handleLocationChange("postal_code", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manager_name">Manager Name</Label>
                        <Input
                          id="manager_name"
                          value={locationData.manager_name}
                          onChange={(e) => handleLocationChange("manager_name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manager_email">Manager Email</Label>
                        <Input
                          id="manager_email"
                          type="email"
                          value={locationData.manager_email}
                          onChange={(e) => handleLocationChange("manager_email", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Locations List */}
                {businessLocations.filter((loc: any) => !loc.is_primary).map((location: any) => (                  <Card key={location.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{location.location_name}</h4>
                          <p className="text-sm text-gray-600">{location.address}</p>
                          <p className="text-sm text-gray-600">
                            {location.city}, {location.state} {location.postal_code}
                          </p>
                        </div>
                        <Badge variant="outline">{location.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Client Users</h3>
              <Button size="sm" onClick={() => setIsUserModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {clientUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found for this client
                  </div>
                ) : (
                  clientUsers.map((user: any) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{user.user_name}</div>
                              <div className="text-sm text-gray-600">{user.user_email}</div>
                            </div>
                          </div>
                          <Badge variant="outline">{user.user_role}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Add User Modal */}
            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for this client
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_name">Full Name</Label>
                    <Input
                      id="user_name"
                      value={newUser.user_name}
                      onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_email">Email</Label>
                    <Input
                      id="user_email"
                      type="email"
                      value={newUser.user_email}
                      onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_role">Role</Label>
                    <Select
                      value={newUser.user_role}
                      onValueChange={(value) => setNewUser({ ...newUser, user_role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_admin">Admin</SelectItem>
                        <SelectItem value="client_user">User</SelectItem>
                        <SelectItem value="client_viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temporary_password">Temporary Password</Label>
                    <Input
                      id="temporary_password"
                      type="password"
                      value={newUser.temporary_password}
                      onChange={(e) => setNewUser({ ...newUser, temporary_password: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Client Activities</h3>
            </div>

            {loadingActivities ? (
              <div className="text-center py-4">Loading activities...</div>
            ) : (
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No activities found for this client
                  </div>
                ) : (
                  activities.map((activity: any) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {activity.activity_type === "call" && <Phone className="h-4 w-4 text-green-500" />}
                            {activity.activity_type === "email" && <Mail className="h-4 w-4 text-blue-500" />}
                            {activity.activity_type === "meeting" && <Calendar className="h-4 w-4 text-purple-500" />}
                            {activity.activity_type === "note" && <User className="h-4 w-4 text-gray-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium">{activity.subject}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {activity.activity_type}
                              </Badge>
                              {activity.employee_name && (
                                <span>by {activity.employee_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}