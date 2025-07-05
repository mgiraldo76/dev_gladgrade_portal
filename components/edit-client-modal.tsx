// components/edit-client-modal.tsx - Enhanced with security_level, Google Places integration, and USER EDIT/DELETE functionality

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
import { Calendar, Phone, Mail, MapPin, Globe, User, Building, Users, Plus, Search, Star, Trash2, Edit, Key } from "lucide-react"
import { useAuth } from "@/app/providers"

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: any
  onSuccess: () => void
  userRole: string
}

interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  business_status: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  geometry: {
    location: { lat: number; lng: number }
  }
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
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

// Enhanced address component extraction
function extractAddressComponents(place: GooglePlace) {
  const components = {
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US"
  }

  if (place.address_components) {
    let streetNumber = ""
    let route = ""
    let subpremise = ""
    let premise = ""
    
    place.address_components.forEach((component) => {
      const types = component.types

      if (types.includes("street_number")) {
        streetNumber = component.long_name
      }
      if (types.includes("route")) {
        route = component.long_name
      }
      if (types.includes("subpremise")) {
        subpremise = component.long_name
      }
      if (types.includes("premise")) {
        premise = component.long_name
      }
      if (types.includes("locality")) {
        components.city = component.long_name
      }
      if (types.includes("administrative_area_level_1")) {
        components.state = component.short_name
      }
      if (types.includes("postal_code")) {
        components.zip_code = component.long_name
      }
      if (types.includes("country")) {
        components.country = component.short_name
      }
    })

    // Build complete street address
    let addressParts = []
    
    if (streetNumber && route) {
      addressParts.push(`${streetNumber} ${route}`)
    } else if (route) {
      addressParts.push(route)
    }
    
    if (premise) {
      addressParts.push(premise)
    }
    
    if (subpremise) {
      if (!subpremise.toLowerCase().includes('suite') && 
          !subpremise.toLowerCase().includes('apt') && 
          !subpremise.toLowerCase().includes('unit') &&
          !subpremise.toLowerCase().includes('#')) {
        if (/^\d+$/.test(subpremise) && parseInt(subpremise) > 50) {
          subpremise = `Suite ${subpremise}`
        } else if (/^\d+[A-Za-z]$/.test(subpremise) || parseInt(subpremise) <= 50) {
          subpremise = `Apt ${subpremise}`
        } else {
          subpremise = `Unit ${subpremise}`
        }
      }
      addressParts.push(subpremise)
    }
    
    components.street_address = addressParts.join(', ')
  }

  return components
}

export function EditClientModal({ isOpen, onClose, client, onSuccess, userRole }: EditClientModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [clientUsers, setClientUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [businessSectors, setBusinessSectors] = useState([])
  const [salesReps, setSalesReps] = useState([])
  const [businessLocations, setBusinessLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  // NEW: Edit user state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedEditUser, setSelectedEditUser] = useState<any>(null)
  
  // NEW: User filter state
  const [showInactiveUsers, setShowInactiveUsers] = useState(false)

  // Google Places integration for new locations
  const [locationSearchQuery, setLocationSearchQuery] = useState("")
  const [locationSearchResults, setLocationSearchResults] = useState<GooglePlace[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [showLocationSearch, setShowLocationSearch] = useState(true)

  // Activity form state - identical to prospect modal
  const [newActivity, setNewActivity] = useState({
    activity_type: "call",
    subject: "",
    description: "",
  })

  // Enhanced: Client form data with security_level
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    website: "",
    business_type: "",
    business_description: "",
    claim_status: "unclaimed",
    security_level: "pending", // NEW: Security level field
    notes: "",
    sales_rep_id: "",
  })

  // Location form data
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
    is_primary: false,
    place_id: "", // NEW: Place ID field
  })

  const [newUser, setNewUser] = useState({
    user_email: "",
    user_name: "",
    user_role: "client_admin",
    temporary_password: "",
  })

  // NEW: Edit user state
  const [editUser, setEditUser] = useState({
    email: "",
    full_name: "",
    role: "client_admin",
    status: "active",
    reset_password: false,
    new_password: "",
  })

  // Initialize form data and load business locations
  useEffect(() => {
    if (client) {
      console.log("🔍 Loading client data:", client)
      setFormData({
        business_name: client.business_name || "",
        contact_name: client.contact_name || "",
        contact_email: client.contact_email || "",
        phone: client.phone || "",
        website: client.website || "",
        business_type: client.industry_category_name || "",
        business_description: client.business_description || "",
        claim_status: client.claim_status || "unclaimed",
        security_level: client.security_level || "pending", // NEW: Load security level
        notes: client.notes || "",
        sales_rep_id: client.sales_rep_id ? client.sales_rep_id.toString() : "unassigned",
      })
      loadBusinessSectors()
      loadSalesReps()
      loadClientUsers()
      loadClientActivities()
      loadBusinessLocations()
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

      console.log(`🔍 Loading users for client ${client.id}`)
      const response = await fetch(`/api/clients/${client.id}/users`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Loaded ${data.data?.length || 0} users:`, data.data)
        setClientUsers(data.data || [])
      } else {
        console.error("❌ Failed to load users:", response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error("Error details:", errorData)
      }
    } catch (error) {
      console.error("❌ Error loading client users:", error)
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

  // Add activity function - identical to prospect modal
  const handleAddActivity = async () => {
    if (!newActivity.subject.trim()) {
      alert("Please enter a subject for the activity")
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      console.log("🔍 Adding activity with headers:", headers)

      const response = await fetch(`/api/clients/${client.id}/activities`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          client_id: client.id,
          ...newActivity,
        }),
      })

      if (response.ok) {
        setNewActivity({ activity_type: "call", subject: "", description: "" })
        loadClientActivities() // Reload activities
        alert("Activity added successfully!")
      } else {
        const errorData = await response.json()
        console.error("Failed to add activity:", errorData)
        alert(`Failed to add activity: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error adding activity:", error)
      alert("Error adding activity")
    }
  }

  // Helper function to get activity type icon - identical to prospect modal
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "call":
        return <Phone className="h-4 w-4 text-green-500" />
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />
      case "meeting":
        return <Calendar className="h-4 w-4 text-purple-500" />
      case "follow_up":
        return <Calendar className="h-4 w-4 text-yellow-500" />
      case "support":
        return <User className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

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
        setBusinessLocations(data.data || [])
      }
    } catch (error) {
      console.error("Error loading business locations:", error)
    } finally {
      setLoadingLocations(false)
    }
  }

  // Google Places search for locations
  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim()) return

    setSearchLoading(true)
    try {
      const response = await fetch(
        `/api/clients/search-places?query=${encodeURIComponent(locationSearchQuery)}&location=Miami, FL`,
      )
      const data = await response.json()

      if (data.success) {
        setLocationSearchResults(data.data || [])
      } else {
        console.error("Search failed:", data.error)
        setLocationSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setLocationSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePlaceSelect = (place: GooglePlace) => {
    setSelectedPlace(place)
    
    const addressComponents = extractAddressComponents(place)
    
    setLocationData((prev) => ({
      ...prev,
      location_name: place.name,
      place_id: place.place_id,
      address: addressComponents.street_address,
      city: addressComponents.city,
      state: addressComponents.state,
      postal_code: addressComponents.zip_code,
      country: addressComponents.country,
    }))
    setShowLocationSearch(false)
  }

  const handleLocationEdit = (location: any) => {
    setSelectedLocation(location)
    setLocationData({
      id: location.id,
      location_name: location.location_name || "",
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      country: location.country || "USA",
      postal_code: location.postal_code || "",
      phone: location.phone || "",
      manager_name: location.manager_name || "",
      manager_email: location.manager_email || "",
      is_primary: location.is_primary || false,
      place_id: location.place_id || "",
    })
    setIsLocationModalOpen(true)
  }

  const handleLocationSave = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const endpoint = selectedLocation 
        ? `/api/clients/${client.id}/locations/${selectedLocation.id}`
        : `/api/clients/${client.id}/locations`

      const method = selectedLocation ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(locationData),
      })

      if (response.ok) {
        loadBusinessLocations()
        setIsLocationModalOpen(false)
        resetLocationForm()
      } else {
        const errorData = await response.json()
        alert(`Failed to save location: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error saving location:", error)
      alert("Error saving location")
    }
  }

  const handleLocationDelete = async (locationId: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/locations/${locationId}`, {
        method: "DELETE",
        headers,
      })

      if (response.ok) {
        loadBusinessLocations()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete location: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      alert("Error deleting location")
    }
  }

  const resetLocationForm = () => {
    setSelectedLocation(null)
    setLocationData({
      id: null,
      location_name: "",
      address: "",
      city: "",
      state: "",
      country: "USA",
      postal_code: "",
      phone: "",
      manager_name: "",
      manager_email: "",
      is_primary: false,
      place_id: "",
    })
    setSelectedPlace(null)
    setLocationSearchQuery("")
    setLocationSearchResults([])
    setShowLocationSearch(true)
  }

  // NEW: User management functions
  const handleUserEdit = (clientUser: any) => {
    setSelectedEditUser(clientUser)
    setEditUser({
      email: clientUser.email || clientUser.user_email || "",
      full_name: clientUser.full_name || clientUser.user_name || "",
      role: clientUser.role || clientUser.user_role || "client_admin",
      status: clientUser.status || "active",
      reset_password: false,
      new_password: "",
    })
    setIsEditUserModalOpen(true)
  }

  const handleSaveEditUser = async () => {
    if (!editUser.email.trim() || !editUser.full_name.trim()) {
      alert("Email and full name are required")
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const updateData: any = {
        email: editUser.email.trim(),
        full_name: editUser.full_name.trim(),
        role: editUser.role,
        status: editUser.status,
      }

      if (editUser.reset_password) {
        updateData.reset_password = true
      }

      if (editUser.new_password && editUser.new_password.trim()) {
        updateData.new_password = editUser.new_password.trim()
      }

      console.log("🔍 Updating user with data:", {
        ...updateData,
        new_password: updateData.new_password ? '[REDACTED]' : undefined
      })

      const response = await fetch(`/api/clients/${client.id}/users/${selectedEditUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log("✅ User updated successfully:", responseData)
        
        loadClientUsers() // Reload users list
        setIsEditUserModalOpen(false)
        resetEditUserForm()
        
        alert("User updated successfully!")
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to update user:", errorData)
        
        // Show enhanced error message for email conflicts
        if (errorData.errorCode === 'EMAIL_EXISTS') {
          alert(errorData.error)
        } else {
          alert(`Failed to update user: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error("❌ Error updating user:", error)
      alert("Error updating user")
    }
  }

  const handleDeleteUser = async (clientUser: any) => {
    if (!confirm(`Are you sure you want to deactivate ${clientUser.full_name || clientUser.user_name}? This will disable their access to the client portal.`)) {
      return
    }

    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/users/${clientUser.id}`, {
        method: "DELETE",
        headers,
      })

      if (response.ok) {
        loadClientUsers() // Reload users list
        alert("User deactivated successfully!")
      } else {
        const errorData = await response.json()
        alert(`Failed to deactivate user: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error deactivating user:", error)
      alert("Error deactivating user")
    }
  }

  // NEW: Reactivate user function
  const handleReactivateUser = async (clientUser: any) => {
    if (!confirm(`Are you sure you want to reactivate ${clientUser.full_name || clientUser.user_name}? This will restore their access to the client portal.`)) {
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/clients/${client.id}/users/${clientUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          email: clientUser.email,
          full_name: clientUser.full_name,
          role: clientUser.role,
          status: "active",
        }),
      })

      if (response.ok) {
        loadClientUsers() // Reload users list
        alert("User reactivated successfully!")
      } else {
        const errorData = await response.json()
        alert(`Failed to reactivate user: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error reactivating user:", error)
      alert("Error reactivating user")
    }
  }

  const resetEditUserForm = () => {
    setSelectedEditUser(null)
    setEditUser({
      email: "",
      full_name: "",
      role: "client_admin",
      status: "active",
      reset_password: false,
      new_password: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (field: string, value: string | boolean) => {
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

      const selectedSector = businessSectors.find((sector: any) => 
        sector.businesssectorname === formData.business_type
      )

      const updateData = {
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        website: formData.website,
        business_type: formData.business_type,
        claim_status: formData.claim_status,
        security_level: formData.security_level, // NEW: Include security level
        sales_rep_id: formData.sales_rep_id && formData.sales_rep_id !== "unassigned" ? parseInt(formData.sales_rep_id) : null,
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
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
    // Validation on frontend first
    if (!newUser.user_name.trim() || !newUser.user_email.trim()) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      console.log("🔍 Creating user with data:", {
        email: newUser.user_email,
        full_name: newUser.user_name,
        role: newUser.user_role,
        client_id: client.id,
        // Don't log password for security
      })

      const response = await fetch(`/api/clients/${client.id}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: newUser.user_email.trim(),
          full_name: newUser.user_name.trim(),
          role: newUser.user_role,
          temporary_password: newUser.temporary_password.trim(),
          client_id: client.id,
          send_welcome_email: true,
          create_firebase_account: true,
        }),
      })

      const responseData = await response.json()
      console.log("🔍 API Response:", responseData)

      if (response.ok) {
        // Add a small delay to ensure database transaction is complete
        setTimeout(() => {
          loadClientUsers()
        }, 500)
        
        setIsUserModalOpen(false)
        setNewUser({
          user_email: "",
          user_name: "",
          user_role: "client_admin",
          temporary_password: "",
        })
        alert(`User created successfully! Temporary password: ${responseData.data.temporary_password}`)
      } else {
        console.error("❌ API Error:", responseData)
        
        // Show enhanced error message for email conflicts
        if (responseData.errorCode === 'EMAIL_EXISTS') {
          alert(responseData.error)
        } else {
          alert(`Failed to create user: ${responseData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error("❌ Network Error:", error)
      alert("Network error creating user. Please check your connection and try again.")
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
            {/* NEW: Security Level Badge */}
            <Badge variant={client.security_level === "verified" ? "default" : 
                           client.security_level === "flagged" ? "destructive" : "secondary"}>
              {client.security_level || "Pending"}
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

              <div className="grid grid-cols-3 gap-4">
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
                {/* NEW: Security Level Field */}
                <div className="space-y-2">
                  <Label htmlFor="security_level">Security Level</Label>
                  <Select
                    value={formData.security_level}
                    onValueChange={(value) => handleInputChange("security_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
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
              <Button size="sm" onClick={() => {
                resetLocationForm()
                setIsLocationModalOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {loadingLocations ? (
              <div className="text-center py-4">Loading locations...</div>
            ) : (
              <div className="space-y-4">
                {businessLocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                    <p className="text-gray-600 mb-4">Add your first business location to get started.</p>
                    <Button onClick={() => {
                      resetLocationForm()
                      setIsLocationModalOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Location
                    </Button>
                  </div>
                ) : (
                  businessLocations.map((location: any) => (
                    <Card key={location.id} className={location.is_primary ? "border-blue-500" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{location.location_name}</h4>
                              {location.is_primary && (
                                <Badge variant="default" className="text-xs">Primary</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">{location.status}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {location.address}
                              </div>
                              <div>{location.city}, {location.state} {location.postal_code}</div>
                              {location.phone && <div>📞 {location.phone}</div>}
                              {location.manager_name && <div>👤 Manager: {location.manager_name}</div>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLocationEdit(location)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {!location.is_primary && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLocationDelete(location.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Location Modal */}
            <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedLocation ? "Edit Location" : "Add New Location"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedLocation 
                      ? "Update location information" 
                      : "Search for a business or enter details manually to add a new location."
                    }
                  </DialogDescription>
                </DialogHeader>

                {!selectedLocation && showLocationSearch ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search for business location (e.g., 'Miami Beach Restaurant')"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                      />
                      <Button onClick={handleLocationSearch} disabled={searchLoading}>
                        <Search className="h-4 w-4" />
                        {searchLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>

                    {locationSearchResults.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <Label>Search Results:</Label>
                        {locationSearchResults.map((place) => (
                          <Card
                            key={place.place_id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handlePlaceSelect(place)}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">{place.name}</h4>
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {place.formatted_address}
                                  </div>
                                  {place.rating && (
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                      {place.rating} ({place.user_ratings_total} reviews)
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">{place.types.slice(0, 3).join(", ")}</div>
                                </div>
                                <div className="text-xs text-gray-500">{place.business_status}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button variant="outline" onClick={() => setShowLocationSearch(false)}>
                        Enter Location Details Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlace && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-green-800">Selected Location:</h4>
                              <p className="text-green-700">{selectedPlace.name}</p>
                              <p className="text-sm text-green-600">{selectedPlace.formatted_address}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowLocationSearch(true)}>
                              Change
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location_name">Location Name *</Label>
                        <Input
                          id="location_name"
                          value={locationData.location_name}
                          onChange={(e) => handleLocationChange("location_name", e.target.value)}
                          required
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
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={locationData.address}
                        onChange={(e) => handleLocationChange("address", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={locationData.city}
                          onChange={(e) => handleLocationChange("city", e.target.value)}
                          required
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

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_primary"
                        checked={locationData.is_primary}
                        onChange={(e) => handleLocationChange("is_primary", e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="is_primary">Set as primary location</Label>
                    </div>

                    <DialogFooter>
                      {!selectedLocation && (
                        <Button variant="outline" onClick={() => setShowLocationSearch(true)}>
                          Back to Search
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => {
                        setIsLocationModalOpen(false)
                        resetLocationForm()
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleLocationSave}>
                        {selectedLocation ? "Update Location" : "Add Location"}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Client Users</h3>
              <div className="flex items-center gap-3">
                {/* NEW: Filter toggle for inactive users */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_inactive"
                    checked={showInactiveUsers}
                    onChange={(e) => setShowInactiveUsers(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="show_inactive" className="text-sm text-gray-600">
                    Show inactive users
                  </Label>
                </div>
                <Button size="sm" onClick={() => setIsUserModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {/* Debug info */}
                <div className="text-xs text-gray-500 mb-2">
                  Found {clientUsers.length} total user(s)
                  {!showInactiveUsers && clientUsers.filter((u: any) => u.status === 'inactive').length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({clientUsers.filter((u: any) => u.status === 'inactive').length} inactive hidden)
                    </span>
                  )}
                  {showInactiveUsers && (
                    <span className="ml-2 text-green-600">
                      (showing all users including inactive)
                    </span>
                  )}
                </div>
                
                {clientUsers.filter((clientUser: any) => showInactiveUsers || clientUser.status !== 'inactive').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {clientUsers.length === 0 ? "No users found" : "No active users found"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {clientUsers.length === 0 
                        ? "Add your first client user to get started."
                        : "All users are inactive. Toggle 'Show inactive users' to see them."
                      }
                    </p>
                    <Button onClick={() => setIsUserModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First User
                    </Button>
                  </div>
                ) : (
                  clientUsers
                    .filter((clientUser: any) => {
                      // Show active users always, show inactive only if toggle is on
                      if (clientUser.status === 'inactive') {
                        return showInactiveUsers
                      }
                      return true
                    })
                    .map((clientUser: any) => (
                    <Card key={clientUser.id || clientUser.firebase_uid}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{clientUser.full_name || clientUser.user_name}</div>
                              <div className="text-sm text-gray-600">{clientUser.email || clientUser.user_email}</div>
                              {clientUser.firebase_uid && (
                                <div className="text-xs text-green-600">✓ Firebase Account</div>
                              )}
                              {clientUser.created_by_name && (
                                <div className="text-xs text-gray-500">Created by: {clientUser.created_by_name}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{clientUser.role || clientUser.user_role}</Badge>
                              <Badge variant={clientUser.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {clientUser.status || 'active'}
                              </Badge>
                            </div>
                            {/* NEW: Edit and Delete buttons */}
                            <div className="flex gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserEdit(clientUser)}
                                className="h-8 px-2"
                                disabled={clientUser.status === 'inactive'}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {clientUser.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(clientUser)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReactivateUser(clientUser)}
                                  className="h-8 px-2 text-green-600 hover:text-green-700"
                                  title="Reactivate user"
                                >
                                  <User className="h-3 w-3" />
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
                        <SelectItem value="client_moderator">Moderator</SelectItem>
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
                      placeholder="Leave empty to auto-generate"
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

            {/* NEW: Edit User Modal */}
            <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information and permissions
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
                          <SelectItem value="client_admin">Admin</SelectItem>
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="reset_password"
                        checked={editUser.reset_password}
                        onChange={(e) => setEditUser({ ...editUser, reset_password: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="reset_password" className="flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Force password reset on next login
                      </Label>
                    </div>
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
                  <Button variant="outline" onClick={() => {
                    setIsEditUserModalOpen(false)
                    resetEditUserForm()
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEditUser}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {/* Add New Activity Section - Identical to prospect modal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Add New Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_type">Activity Type</Label>
                    <Select
                      value={newActivity.activity_type}
                      onValueChange={(value) => setNewActivity((prev) => ({ ...prev, activity_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            Phone Call
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            Meeting
                          </div>
                        </SelectItem>
                        <SelectItem value="note">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            Note
                          </div>
                        </SelectItem>
                        <SelectItem value="follow_up">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-yellow-500" />
                            Follow Up
                          </div>
                        </SelectItem>
                        <SelectItem value="support">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Support
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of activity"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Detailed notes about the activity, outcome, next steps..."
                  />
                </div>
                <Button 
                  onClick={handleAddActivity} 
                  disabled={!newActivity.subject.trim()}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardContent>
            </Card>

            {/* Activities List - Identical to prospect modal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Activity History ({activities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No activities recorded yet</p>
                    <p className="text-sm">Start by adding an activity above to track your client interactions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.activity_type)}
                            <div>
                              <div className="font-medium text-sm">{activity.subject}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {activity.employee_name} 
                                <span>•</span>
                                <Calendar className="h-3 w-3" />
                                {new Date(activity.completed_at || activity.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        {activity.description && (
                          <div className="text-sm text-gray-700 mt-2 pl-6">
                            {activity.description}
                          </div>
                        )}
                        {activity.outcome && (
                          <div className="text-xs text-gray-500 mt-1 pl-6">
                            <strong>Outcome:</strong> {activity.outcome}
                          </div>
                        )}
                        {activity.next_action && (
                          <div className="text-xs text-blue-600 mt-1 pl-6">
                            <strong>Next Action:</strong> {activity.next_action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}