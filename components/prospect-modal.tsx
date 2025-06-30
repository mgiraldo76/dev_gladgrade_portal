"use client"

import type React from "react"
import { useState } from "react"
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
import { useAuth } from "@/app/providers" // ✅ ADD: Import the useAuth hook

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

// ✅ COMPREHENSIVE: Enhanced address component extraction
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
      // ✅ Suite/Apt/Unit numbers (Suite 450, Apt 5A, Unit 12)
      if (types.includes("subpremise")) {
        subpremise = component.long_name
      }
      // ✅ Building names (Trump Tower, Building A)
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

    // ✅ ENHANCED: Build complete street address
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
  const { user } = useAuth() // ✅ ADD: Get current user for authentication
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [showSearch, setShowSearch] = useState(true)

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    // ✅ ENHANCED: Separate address fields
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
    formatted_address: "", // Keep for fallback
    website: "",
    estimated_value: "",
    priority: "medium",
    notes: "",
    place_id: "",
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    try {
      const response = await fetch(
        `/api/clients/search-places?query=${encodeURIComponent(searchQuery)}&location=Miami, FL`,
      )
      const data = await response.json()

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
    
    // ✅ ENHANCED: Extract address components
    const addressComponents = extractAddressComponents(place)
    
    setFormData((prev) => ({
      ...prev,
      business_name: place.name,
      place_id: place.place_id,
      formatted_address: place.formatted_address,
      // ✅ NEW: Set individual address components
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
    setLoading(true)

    try {
      // ✅ ENHANCED: Format postal code before submission
      const formattedZip = formatPostalCode(formData.zip_code, formData.country)
      
      // ✅ FIX: Include authentication headers like other components
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add authentication headers - this was missing!
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      console.log("🔍 Creating prospect with authentication headers:", headers)
      
      const response = await fetch("/api/sales/prospects", {
        method: "POST",
        headers, // ✅ Now includes user authentication
        body: JSON.stringify({
          ...formData,
          zip_code: formattedZip,
          // Send both for API compatibility
          address: formData.formatted_address || `${formData.street_address}, ${formData.city}, ${formData.state} ${formattedZip}`,
        }),
      })

      if (response.ok) {
        setOpen(false)
        resetForm()
        onProspectCreated?.()
      } else {
        console.error("Failed to create prospect")
      }
    } catch (error) {
      console.error("Error creating prospect:", error)
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
          <DialogDescription>
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
              />
              <Button onClick={handleSearch} disabled={searchLoading}>
                <Search className="h-4 w-4" />
                {searchLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <Label>Search Results:</Label>
                {searchResults.map((place) => (
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
              <Button variant="outline" onClick={handleManualEntry}>
                Enter Business Details Manually
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedPlace && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-green-800">Selected Business:</h4>
                      <p className="text-green-700">{selectedPlace.name}</p>
                      <p className="text-sm text-green-600">{selectedPlace.formatted_address}</p>
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

            {/* ✅ ENHANCED: Address Components */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Address Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => handleInputChange("street_address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Miami"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
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
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleZipChange(e.target.value)}
                    placeholder="33101 or 33101-1234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                    <SelectItem value="ES">Spain</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => handleInputChange("estimated_value", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
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