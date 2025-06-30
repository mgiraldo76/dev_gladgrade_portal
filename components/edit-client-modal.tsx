// components/edit-client-modal.tsx - Enhanced with business_locations

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
  { value: "DC", label: "District of Columbia" }
]

// Postal code validation function
function formatPostalCode(code: string, country: string): string {
  const cleaned = code.replace(/[^A-Za-z0-9]/g, "")
  
  switch (country) {
    case "US":
    case "USA":
      if (cleaned.length === 5) return cleaned
      if (cleaned.length === 9) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
      return code
    case "CA":
      if (cleaned.length === 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`.toUpperCase()
      }
      return code.toUpperCase()
    case "MX":
      if (cleaned.length === 5) return cleaned
      return code
    case "ES":
    case "IT":
      if (cleaned.length === 5) return cleaned
      return code
    default:
      return code
  }
}

export function EditClientModal({ isOpen, onClose, client, onSuccess, userRole }: EditClientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [clientUsers, setClientUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [industryCategories, setIndustryCategories] = useState([])
  const [salesReps, setSalesReps] = useState([])
  const [businessLocations, setBusinessLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  // ✅ ENHANCED: Client form data (basic info only)
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    website: "",
    industry_category_id: "",
    business_description: "",
    claim_status: "unclaimed",
    notes: "",
    sales_rep_id: "",
  })

  // ✅ NEW: Primary location form data (address components)
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

  // ✅ ENHANCED: Initialize form data and load business locations
  useEffect(() => {
    if (client) {
      console.log("🔍 Loading client data:", client)
      setFormData({
        business_name: client.business_name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        website: client.website || "",
        industry_category_id: client.industry_category_id ? client.industry_category_id.toString() : "", // ✅ This is fine
        business_description: client.business_description || "",
        claim_status: client.claim_status || "unclaimed",
        notes: client.notes || "",
        sales_rep_id: client.sales_rep_id ? client.sales_rep_id.toString() : "", // ✅ This is fine
      })
      loadIndustryCategories()
      loadSalesReps()
      loadClientUsers()
      loadClientActivities()
      loadBusinessLocations() // ✅ NEW: Load business locations
    }
  }, [client])

  const loadIndustryCategories = async () => {
    try {
      const response = await fetch("/api/industry-categories")
      if (response.ok) {
        const data = await response.json()
        setIndustryCategories(data.data || [])
      }
    } catch (error) {
      console.error("Error loading industry categories:", error)
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

  // ✅ NEW: Load business locations
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
        
        // ✅ Load primary location data
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

  const handleZipChange = (value: string) => {
    const formatted = formatPostalCode(value, locationData.country)
    setLocationData((prev) => ({ ...prev, postal_code: formatted }))
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
      console.log("🔍 Client form data:", formData)
      console.log("🔍 Location form data:", locationData)

      // ✅ 1. Update client basic info
      // ✅ Handle the "unassigned" sales rep case
      const submitData = {
        ...formData,
        sales_rep_id: formData.sales_rep_id === "unassigned" ? "" : formData.sales_rep_id
      }
      const clientResponse = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(submitData), // ✅ Use modified data
      })

      if (!clientResponse.ok) {
        const errorData = await clientResponse.json()
        throw new Error(errorData.error || "Failed to update client")
      }

      // ✅ 2. Update business location
      if (locationData.id) {
        const formattedZip = formatPostalCode(locationData.postal_code, locationData.country)
        
        const locationResponse = await fetch(`/api/clients/${client.id}/locations/${locationData.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ...locationData,
            postal_code: formattedZip,
          }),
        })

        if (!locationResponse.ok) {
          const errorData = await locationResponse.json()
          console.error("❌ Failed to update location:", errorData)
          // Don't fail the entire operation if location update fails
        } else {
          console.log("✅ Business location updated successfully")
        }
      }

      console.log("✅ Client updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("❌ Error updating client:", error)
      // Add user-friendly error handling here
    } finally {
      setLoading(false)
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="users">Portal Users ({clientUsers.length})</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

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
                    <Label htmlFor="industry_category_id">Industry</Label>
                    <Select
                      value={formData.industry_category_id || undefined} // ✅ Convert empty string to undefined
                      onValueChange={(value) => handleInputChange("industry_category_id", value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryCategories
                          .filter((category: any) => category.id && category.name) // ✅ Filter out invalid records
                          .map((category: any) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sales_rep_id">Account Owner</Label>
                    <Select
                      value={formData.sales_rep_id || undefined} // ✅ Convert empty string to undefined
                      onValueChange={(value) => handleInputChange("sales_rep_id", value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign sales rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem> {/* ✅ Use non-empty value */}
                        {salesReps
                          .filter((rep: any) => rep.id && rep.full_name) // ✅ Filter out invalid records
                          .map((rep: any) => (
                            <SelectItem 
                              key={rep.id} 
                              value={rep.id.toString()}
                            >
                              {rep.full_name} ({rep.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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

            {/* ✅ NEW: Location Tab with Address Components */}
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Primary Business Location</CardTitle>
                  <p className="text-sm text-gray-600">Manage the main business address and location details</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingLocations ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading location...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="location_name">Location Name</Label>
                        <Input
                          id="location_name"
                          value={locationData.location_name}
                          onChange={(e) => handleLocationChange("location_name", e.target.value)}
                          placeholder="Main Office, Headquarters, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={locationData.address}
                          onChange={(e) => handleLocationChange("address", e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location_city">City</Label>
                          <Input
                            id="location_city"
                            value={locationData.city}
                            onChange={(e) => handleLocationChange("city", e.target.value)}
                            placeholder="Miami"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location_state">State</Label>
                          <Select
                            value={locationData.state || undefined} // ✅ Convert empty string to undefined
                            onValueChange={(value) => handleLocationChange("state", value || "")}
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
                          <Label htmlFor="location_postal_code">ZIP Code</Label>
                          <Input
                            id="location_postal_code"
                            value={locationData.postal_code}
                            onChange={(e) => handleZipChange(e.target.value)}
                            placeholder="33101 or 33101-1234"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location_country">Country</Label>
                          <Select
                            value={locationData.country}
                            onValueChange={(value) => handleLocationChange("country", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USA">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="MX">Mexico</SelectItem>
                              <SelectItem value="ES">Spain</SelectItem>
                              <SelectItem value="IT">Italy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location_phone">Location Phone</Label>
                          <Input
                            id="location_phone"
                            value={locationData.phone}
                            onChange={(e) => handleLocationChange("phone", e.target.value)}
                            placeholder="Location-specific phone number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="manager_name">Location Manager</Label>
                          <Input
                            id="manager_name"
                            value={locationData.manager_name}
                            onChange={(e) => handleLocationChange("manager_name", e.target.value)}
                            placeholder="Manager name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manager_email">Manager Email</Label>
                          <Input
                            id="manager_email"
                            type="email"
                            value={locationData.manager_email}
                            onChange={(e) => handleLocationChange("manager_email", e.target.value)}
                            placeholder="manager@business.com"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit} disabled={loading}>
                          {loading ? "Saving..." : "Save Location"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                <div className="space-y-2">
                  {clientUsers.map((clientUser: any) => (
                    <Card key={clientUser.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{clientUser.user_name}</h4>
                            <p className="text-sm text-gray-600">{clientUser.user_email}</p>
                            <Badge variant="outline" className="mt-1">
                              {clientUser.user_role}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No portal users yet</h3>
                  <p className="text-gray-600 mb-4">Add the first user to give this client access to the portal.</p>
                </div>
              )}
            </TabsContent>

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
                    {client.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-3 w-3 text-gray-500" />
                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                        <span>{client.contact_name}</span>
                      </div>
                    )}
                    {client.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <a href={`mailto:${client.contact_email}`} className="text-blue-600 hover:underline">
                          {client.contact_email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-gray-500" />
                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Business Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {locationData.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                        <div>
                          <div>{locationData.address}</div>
                          <div>{locationData.city}, {locationData.state} {locationData.postal_code}</div>
                          <div>{locationData.country}</div>
                        </div>
                      </div>
                    )}
                    {!locationData.address && (
                      <div className="text-sm text-gray-500">No address information available</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span>Created: {new Date(client.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {client.sales_rep_name && (
                      <div className="text-sm">
                        <span className="text-gray-600">Account Owner: </span>
                        <span className="font-medium">{client.sales_rep_name}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-600">Status: </span>
                      <Badge className={getStatusColor(client.claim_status)}>{client.claim_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}