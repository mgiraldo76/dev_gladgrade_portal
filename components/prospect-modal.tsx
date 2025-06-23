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

export function ProspectModal({ trigger, onProspectCreated }: ProspectModalProps) {
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
    address: "",
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
    setFormData((prev) => ({
      ...prev,
      business_name: place.name,
      address: place.formatted_address,
      place_id: place.place_id,
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
      address: "",
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
      const response = await fetch("/api/sales/prospects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          formatted_address: formData.address,
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
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
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
