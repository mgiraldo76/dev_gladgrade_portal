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
import { Calendar, Phone, Mail, MapPin, Globe, DollarSign, User, Building } from "lucide-react"
import { useAuth } from "@/app/providers"

interface EditProspectModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: any
  onSuccess: () => void
  userRole: string
}

export function EditProspectModal({ isOpen, onClose, prospect, onSuccess, userRole }: EditProspectModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [businessSectors, setBusinessSectors] = useState([])

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    formatted_address: "",
    website: "",
    business_type: "",
    estimated_value: "",
    priority: "medium",
    status: "new",
    notes: "",
    assigned_salesperson_id: "",
  })

  const [newActivity, setNewActivity] = useState({
    activity_type: "call",
    subject: "",
    description: "",
  })

  // Initialize form data when prospect changes
  useEffect(() => {
    if (prospect) {
      console.log("🔍 Loading prospect data:", prospect)
      setFormData({
        business_name: prospect.business_name || "",
        contact_name: prospect.contact_name || "",
        contact_email: prospect.contact_email || "",
        phone: prospect.phone || "",
        formatted_address: prospect.formatted_address || "",
        website: prospect.website || "",
        business_type: prospect.business_type || "",
        estimated_value: prospect.estimated_value ? prospect.estimated_value.toString() : "",
        priority: prospect.priority || "medium",
        status: prospect.status || "new",
        notes: prospect.notes || "",
        assigned_salesperson_id: prospect.assigned_salesperson_id?.toString() || "",
      })
      loadActivities()
      loadBusinessSectors()
    }
  }, [prospect])

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

  const loadActivities = async () => {
    if (!prospect?.id) return

    setLoadingActivities(true)
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch(`/api/sales/activities?prospect_id=${prospect.id}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.data || [])
      }
    } catch (error) {
      console.error("Error loading activities:", error)
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

      // Add authentication headers
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      console.log("🔍 Submitting with headers:", headers)
      console.log("🔍 Form data:", formData)

      const response = await fetch("/api/sales/prospects", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id: prospect.id,
          ...formData,
          estimated_value: Number.parseFloat(formData.estimated_value) || 0,
          assigned_salesperson_id:
            Number.parseInt(formData.assigned_salesperson_id) || prospect.assigned_salesperson_id,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        console.error("Failed to update prospect:", errorData)
        alert(`Failed to update prospect: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error updating prospect:", error)
      alert("Error updating prospect")
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.subject.trim()) {
      alert("Please enter a subject for the activity")
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add authentication headers
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      console.log("🔍 Adding activity with headers:", headers)

      const response = await fetch("/api/sales/activities", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prospect_id: prospect.id,
          ...newActivity,
        }),
      })

      if (response.ok) {
        setNewActivity({ activity_type: "call", subject: "", description: "" })
        loadActivities() // Reload activities
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

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      converted: "bg-green-100 text-green-800",
      client: "bg-green-100 text-green-800",
      sold: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (!prospect) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            {prospect.business_name}
            <Badge className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
            <Badge className={getPriorityColor(prospect.priority)}>{prospect.priority}</Badge>
          </DialogTitle>
          <DialogDescription>Edit prospect information and track communications</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
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
                    <span className="font-medium">{prospect.business_name}</span>
                  </div>
                  {prospect.business_type && (
                    <div className="text-sm text-gray-600">Industry: {prospect.business_type}</div>
                  )}
                  {prospect.formatted_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{prospect.formatted_address}</span>
                    </div>
                  )}
                  {prospect.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {prospect.website}
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
                  {prospect.contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{prospect.contact_name}</span>
                    </div>
                  )}
                  {prospect.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${prospect.contact_email}`} className="text-sm text-blue-600 hover:underline">
                        {prospect.contact_email}
                      </a>
                    </div>
                  )}
                  {prospect.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${prospect.phone}`} className="text-sm text-blue-600 hover:underline">
                        {prospect.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sales Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {prospect.estimated_value > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-green-600">
                        ${Number(prospect.estimated_value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">Assigned to: {prospect.assigned_salesperson_name}</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Created: {new Date(prospect.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{prospect.notes || "No notes available"}</p>
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
                <Label htmlFor="formatted_address">Address</Label>
                <Input
                  id="formatted_address"
                  value={formData.formatted_address}
                  onChange={(e) => handleInputChange("formatted_address", e.target.value)}
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
                  <Label htmlFor="business_type">Industry</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => handleInputChange("business_type", value)}
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => handleInputChange("estimated_value", e.target.value)}
                  />
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

          <TabsContent value="activities" className="space-y-4">
            {/* Add New Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add New Activity</CardTitle>
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
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of activity"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Detailed notes about the activity"
                  />
                </div>
                <Button onClick={handleAddActivity} disabled={!newActivity.subject.trim()}>
                  Add Activity
                </Button>
              </CardContent>
            </Card>

            {/* Activities List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-center py-4">Loading activities...</div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No activities recorded yet</div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{activity.subject}</div>
                            <div className="text-xs text-gray-500">
                              {activity.activity_type} • {activity.employee_name} •{" "}
                              {new Date(activity.completed_at || activity.created_at).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.activity_type}
                          </Badge>
                        </div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
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
