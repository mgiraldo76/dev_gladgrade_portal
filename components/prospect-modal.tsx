// File: /components/prospect-modal.tsx
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/app/providers"
import { apiClient } from "@/lib/api-client"


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
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

interface ProspectModalProps {
  trigger?: React.ReactNode
  onProspectCreated?: () => void
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
    let subpremise = ""       // Suite, Apt, Unit numbers
    let premise = ""          // Building names
    
    place.address_components.forEach((component) => {
      const types = component.types

      if (types.includes("street_number")) {
        streetNumber = component.long_name
      }
      if (types.includes("route")) {
        route = component.long_name
      }
      // Suite/Apt/Unit numbers (Suite 450, Apt 5A, Unit 12)
      if (types.includes("subpremise")) {
        subpremise = component.long_name
      }
      // Building names (Trump Tower, Building A)
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
    
    // Add street number and route
    if (streetNumber && route) {
      addressParts.push(`${streetNumber} ${route}`)
    } else if (route) {
      addressParts.push(route)
    }
    
    // Add building info if present
    if (premise) {
      addressParts.push(premise)
    }
    
    // Add suite/apartment/unit info
    if (subpremise) {
      // Smart formatting - add prefix if missing
      if (!subpremise.toLowerCase().includes('suite') && 
          !subpremise.toLowerCase().includes('apt') && 
          !subpremise.toLowerCase().includes('unit') &&
          !subpremise.toLowerCase().includes('#')) {
        // Determine likely type
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

// Postal code validation function
function formatPostalCode(code: string, country: string): string {
  const cleaned = code.replace(/[^A-Za-z0-9]/g, "")
  
  switch (country) {
    case "US":
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

export function ProspectModal({ trigger, onProspectCreated }: ProspectModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [showSearch, setShowSearch] = useState(true)


  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationError, setLocationError] = useState<string>("")

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    // Separate address fields
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
    formatted_address: "", 
    website: "",
    business_type: "", 
    estimated_value: "",
    priority: "medium",
    notes: "",
    place_id: "",
  })

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      console.log("🌍 Getting user location...")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          console.log(`📍 User location: ${latitude}, ${longitude}`)
        },
        (error) => {
          console.warn("⚠️ Geolocation failed:", error.message)
          setLocationError("Could not get your location. Using default search area.")
          // Fallback to Miami coordinates
          setUserLocation({ lat: 25.7617, lng: -80.1918 })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    } else {
      console.warn("⚠️ Geolocation not supported")
      setLocationError("Location services not available. Using default search area.")
      setUserLocation({ lat: 25.7617, lng: -80.1918 })
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    if (!userLocation) {
      alert("Please wait while we detect your location...")
      return
    }

    setSearchLoading(true)
    try {
      console.log("🔍 Searching places via apiClient with user location...")
      
      // Pass user's coordinates as location parameter
      const locationString = `${userLocation.lat},${userLocation.lng}`
      const data = await apiClient.searchPlaces(searchQuery, locationString)
      console.log("✅ Places search results:", data)

      if (data.success) {
        setSearchResults(data.data || [])
      } else {
        console.error("Search failed:", data.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePlaceSelect = (place: GooglePlace) => {
    setSelectedPlace(place)
    
    // Extract address components
    const addressComponents = extractAddressComponents(place)
    
    setFormData((prev) => ({
      ...prev,
      business_name: place.name,
      place_id: place.place_id,
      formatted_address: place.formatted_address,
      // Set individual address components
      street_address: addressComponents.street_address,
      city: addressComponents.city,
      state: addressComponents.state,
      zip_code: addressComponents.zip_code,
      country: addressComponents.country,
    }))
    setShowSearch(false)
  }

  const handleManualEntry = () => {
    setShowSearch(false)
    setSelectedPlace(null)
    setFormData((prev) => ({
      ...prev,
      place_id: "",
    }))
  }

  const resetForm = () => {
    setFormData({
      business_name: "",
      contact_name: "",
      contact_email: "",
      phone: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "US",
      formatted_address: "",
      website: "",
      business_type: "", 
      estimated_value: "",
      priority: "medium",
      notes: "",
      place_id: "",
    })
    setSelectedPlace(null)
    setSearchQuery("")
    setSearchResults([])
    setShowSearch(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ UPDATED: Only business_name is required
    console.log("🔍 Form data before validation:", formData)
    
    if (!formData.business_name?.trim()) {
      alert("Business name is required")
      return
    }
    
    setLoading(true)

    try {
      // Format postal code before submission
      const formattedZip = formatPostalCode(formData.zip_code, formData.country)
      
      console.log("🔍 Creating prospect via apiClient...")
      
      // ✅ SIMPLIFIED: Only require business_name, everything else optional
      const prospectData = {
        business_name: formData.business_name.trim(),
        contact_name: formData.contact_name?.trim() || "",
        contact_email: formData.contact_email?.trim() || "",
        phone: formData.phone?.trim() || "",
        website: formData.website?.trim() || "",
        // Individual address components
        street_address: formData.street_address?.trim() || "",
        city: formData.city?.trim() || "",
        state: formData.state || "",
        zip_code: formattedZip || "",
        country: formData.country || "US",
        formatted_address: formData.formatted_address || `${formData.street_address}, ${formData.city}, ${formData.state} ${formattedZip}`,
        business_type: formData.business_type?.trim() || "",
        estimated_value: Number.parseFloat(formData.estimated_value) || 0,
        priority: formData.priority || "medium",
        notes: formData.notes?.trim() || "",
        place_id: formData.place_id || "",
        lead_source: 'manual'
      }
      
      console.log("🎯 Prospect data being sent:", prospectData)
      
      const result = await apiClient.createProspect(prospectData)
      console.log("✅ Prospect created successfully:", result)

      setOpen(false)
      resetForm()
      onProspectCreated?.()
      
    } catch (error) {
      console.error("❌ Error creating prospect:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert("Error creating prospect: " + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleZipChange = (value: string) => {
    const formatted = formatPostalCode(value, formData.country)
    setFormData((prev) => ({ ...prev, zip_code: formatted }))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Prospect
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Prospect</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search for a business or enter details manually to create a new sales prospect.
          </DialogDescription>
        </DialogHeader>

        {showSearch ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for business (e.g., 'Miami Beach Restaurant')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="bg-background text-foreground border-border"
              />
              <Button onClick={handleSearch} disabled={searchLoading}>
                <Search className="h-4 w-4" />
                {searchLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <Label className="text-foreground">Search Results:</Label>
                {searchResults.map((place) => (
                  <Card
                    key={place.place_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{place.name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {place.formatted_address}
                          </div>
                          {place.rating && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {place.rating} ({place.user_ratings_total} reviews)
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">{place.types.slice(0, 3).join(", ")}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{place.business_status}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleManualEntry}>
                Enter Business Details Manually
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedPlace && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">Selected Business:</h4>
                      <p className="text-green-700 dark:text-green-400">{selectedPlace.name}</p>
                      <p className="text-sm text-green-600 dark:text-green-500">{selectedPlace.formatted_address}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowSearch(true)}>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

<div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-foreground">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange("business_name", e.target.value)}
                  required
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name" className="text-foreground">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange("contact_name", e.target.value)}
                  placeholder="Optional - can be added later"
                  className="bg-background text-foreground border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-foreground">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  placeholder="Optional - can be added later"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Phone</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Optional"
                  className="bg-background text-foreground border-border"
                />
              </div>
            </div>

            {/* Address Components */}
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-medium text-foreground">Address Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="street_address" className="text-foreground">Street Address</Label>
                <Input
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => handleInputChange("street_address", e.target.value)}
                  placeholder="123 Main Street"
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Miami"
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-foreground">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value} className="text-black hover:bg-gray-100">
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-foreground">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleZipChange(e.target.value)}
                    placeholder="33101 or 33101-1234"
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-foreground">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="US" className="text-black hover:bg-gray-100">United States</SelectItem>
                    <SelectItem value="CA" className="text-black hover:bg-gray-100">Canada</SelectItem>
                    <SelectItem value="MX" className="text-black hover:bg-gray-100">Mexico</SelectItem>
                    <SelectItem value="ES" className="text-black hover:bg-gray-100">Spain</SelectItem>
                    <SelectItem value="IT" className="text-black hover:bg-gray-100">Italy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="text-foreground">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_value" className="text-foreground">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => handleInputChange("estimated_value", e.target.value)}
                  className="bg-background text-foreground border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="low" className="text-black hover:bg-gray-100">Low</SelectItem>
                  <SelectItem value="medium" className="text-black hover:bg-gray-100">Medium</SelectItem>
                  <SelectItem value="high" className="text-black hover:bg-gray-100">High</SelectItem>
                  <SelectItem value="urgent" className="text-black hover:bg-gray-100">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="bg-background text-foreground border-border"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSearch(true)}>
                Back to Search
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Prospect"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}