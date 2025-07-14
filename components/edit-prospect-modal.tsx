// File: /components/edit-prospect-modal.tsx - Enhanced with assignment dropdown AND activity log

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
import { Calendar, Phone, Mail, MapPin, Globe, DollarSign, User, Building, Users, Shield, AlertTriangle, Crown, Star } from "lucide-react"
import { useAuth } from "@/app/providers"
import { apiClient } from "@/lib/api-client"

interface EditProspectModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: any
  onSuccess: () => void
  userRole: string
}

interface SalesEmployee {
  id: number
  full_name: string
  email: string
  role: string  
  position_title?: string
  position_level?: number
  department_name?: string  
  department_id?: number
  status: string
  has_firebase_account?: boolean
  isactive?: boolean
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

// Helper function to get employee priority for sorting
function getEmployeePriority(employee: SalesEmployee, currentUserId?: number): number {
  // Current user (record owner) = highest priority
  if (employee.id === currentUserId) return 1
  
  // CEO = 2nd priority
  if (employee.position_title === "CEO") return 2
  
  // CCO = 3rd priority  
  if (employee.position_title === "CCO") return 3
  
  // Sales Manager = 4th priority
  if (employee.position_title === "Sales Manager" || employee.role === "sales_manager") return 4

  // Other sales roles = 5th priority
  //if (employee.has_sales_access || employee.primary_is_sales) return 5
  
  // Everyone else = lowest priority
  return 6
}

// Helper function to get display icon for employee
function getEmployeeIcon(employee: SalesEmployee, currentUserId?: number) {
  if (employee.id === currentUserId) return <Star className="h-3 w-3 text-yellow-500" />
  if (employee.position_title === "CEO") return <Crown className="h-3 w-3 text-purple-500" />
  if (employee.position_title === "CCO") return <Shield className="h-3 w-3 text-blue-500" />
  if (employee.position_title === "Sales Manager" || employee.role === "sales_manager") return <Users className="h-3 w-3 text-green-500" />
  return <User className="h-3 w-3 text-gray-500" />
}

// Helper function to get activity type icon
function getActivityIcon(activityType: string) {
  switch (activityType) {
    case "call":
      return <Phone className="h-4 w-4 text-green-500" />
    case "email":
      return <Mail className="h-4 w-4 text-blue-500" />
    case "meeting":
      return <Calendar className="h-4 w-4 text-purple-500" />
    case "proposal":
      return <DollarSign className="h-4 w-4 text-orange-500" />
    case "follow_up":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    default:
      return <User className="h-4 w-4 text-gray-500" />
  }
}

export function EditProspectModal({ isOpen, onClose, prospect, onSuccess, userRole }: EditProspectModalProps) {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [businessSectors, setBusinessSectors] = useState([])
  const [salesEmployees, setSalesEmployees] = useState<SalesEmployee[]>([])
  const [loadingSalesEmployees, setLoadingSalesEmployees] = useState(false)
  const [changeReason, setChangeReason] = useState("")
  const [showChangeReason, setShowChangeReason] = useState(false)

  // Enhanced form data with address components
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    // Individual address fields
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
    formatted_address: "", // Keep for compatibility
    website: "",
    business_type: "",
    estimated_value: "",
    priority: "medium",
    status: "new",
    notes: "",
    assigned_salesperson_id: "",
  })

  // Activity form state
  const [newActivity, setNewActivity] = useState({
    activity_type: "call",
    subject: "",
    description: "",
  })

  // Check if current user can reassign prospects
  const canReassignProspects = [
    "super_admin", 
    "sales_manager", 
    "admin", 
    "cco"
  ].includes(userRole) || [
    "super_admin", 
    "sales_manager", 
    "admin", 
    "cco"
  ].includes(role || "") // ✅ FIXED: Now role is properly imported
  
  console.log("🔍 Permission check result:", {
    userRole,
    authContextRole: role,
    canReassignProspects,
    allowedRoles: ["super_admin", "sales_manager", "admin", "cco"]
  })

  console.log("🔍 Edit modal debug:", {
    userRole: userRole,
    authRole: role, // ✅ FIXED: Now role is properly available
    prospectOwner: prospect?.assigned_salesperson_id,
    prospectOwnerName: prospect?.assigned_salesperson_name
  })



  console.log("🔍 Permission check result:", {
    userRole,
    authContextRole: role,
    canReassignProspects,
    allowedRoles: ["super_admin", "sales_manager", "admin", "cco"]
  })
  console.log("🔍 Edit modal permissions check:", { userRole, canReassignProspects })

  console.log("🔍 Edit modal debug:", {
    userRole: userRole,
    authRole: role, // from useAuth
    prospectOwner: prospect?.assigned_salesperson_id,
    prospectOwnerName: prospect?.assigned_salesperson_name
  })


  // Initialize form data with address components
  useEffect(() => {
    if (prospect) {
      console.log("🔍 Loading prospect data:", prospect)
      setFormData({
        business_name: prospect.business_name || "",
        contact_name: prospect.contact_name || "",
        contact_email: prospect.contact_email || "",
        phone: prospect.phone || "",
        // Load address components
        street_address: prospect.street_address || "",
        city: prospect.city || "",
        state: prospect.state || "",
        zip_code: prospect.zip_code || "",
        country: prospect.country || "US",
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
      loadSalesEmployees()
    }
  }, [prospect])

  const loadBusinessSectors = async () => {
    try {
      console.log("🔍 Loading business sectors via apiClient...")
      const data = await apiClient.getBusinessSectors()
      console.log("✅ Business sectors loaded:", data.data)
      setBusinessSectors(data.data || [])
    } catch (error) {
      console.error("❌ Error loading business sectors:", error)
      setBusinessSectors([])
    }
  }

  const loadSalesEmployees = async () => {
    setLoadingSalesEmployees(true)
    try {
      // ✅ FIXED: Use apiClient instead of fetch
      const data = await apiClient.getEmployees()
      console.log("🔍 Raw employee data:", data.data)
      
      // Filter for employees with sales access using multiple criteria
      const salesAccessEmployees = (data.data || []).filter((emp: SalesEmployee) => {
        // Only show active employees
        const isActive = emp.status === "active"
        
        if (!isActive) {
          console.log(`❌ Skipping inactive employee: ${emp.full_name} (status: ${emp.status})`)
          return false
        }
        
        // Check enhanced role system
        const hasSalesAccess = 
          emp.department_name === "Sales" || 
          ["CEO", "CCO", "Sales Manager", "sales_manager"].includes(emp.role) ||
          emp.position_title === "CEO"
        //const hasEnhancedSalesAccess = emp.has_sales_access || emp.primary_is_sales || emp.position_title === "CEO"
        
        // Check legacy role system
        //const hasLegacySalesAccess = ["super_admin", "admin", "sales_manager", "sales", "employee"].includes(emp.legacy_role)
        
        // Check department
        const isInSalesDept = emp.department_name?.toLowerCase().includes("sales")
        
        // Check position title
        const hasSalesPosition = emp.position_title && ["CEO", "CCO", "Sales Manager", "Sales Director", "Sales Representative", "Account Manager"].includes(emp.position_title)
        
        console.log(`🔍 Employee ${emp.full_name}:`, {
          isActive,
          //hasEnhancedSalesAccess,
          //hasLegacySalesAccess, 
          isInSalesDept,
          hasSalesPosition,
          role: emp.role,
          position_title: emp.position_title,
          department_name: emp.department_name,
          status: emp.status
        })
        
        // Include if active AND any sales criteria matches
        return isActive && (isInSalesDept || hasSalesPosition)
      }) // This closes the filter function correctly
      
      
      console.log("🔍 Filtered sales employees:", salesAccessEmployees.length)
      
      // Sort by priority: Current user, CEO, CCO, Sales Manager, then others
      const sortedEmployees = salesAccessEmployees.sort((a: SalesEmployee, b: SalesEmployee) => {
        const priorityA = getEmployeePriority(a, prospect?.assigned_salesperson_id)
        const priorityB = getEmployeePriority(b, prospect?.assigned_salesperson_id)
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
        
        // Secondary sort by name
        return a.full_name.localeCompare(b.full_name)
      })
      
      setSalesEmployees(sortedEmployees)
      console.log("✅ Loaded and sorted sales employees:", sortedEmployees.length, sortedEmployees)
      
    } catch (error) {
      console.error("Error loading sales employees:", error)
    } finally {
      setLoadingSalesEmployees(false)
    }
  }

  // Load activities function
  const loadActivities = async () => {
    if (!prospect?.id) return
  
    setLoadingActivities(true)
    try {
      console.log(`🔍 Loading activities for prospect ${prospect.id} via apiClient...`)
      const data = await apiClient.getProspectActivities(prospect.id)
      console.log("✅ Activities loaded:", data.data)
      setActivities(data.data || [])
    } catch (error) {
      console.error("❌ Error loading activities:", error)
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  // Add activity function
  const handleAddActivity = async () => {
    if (!newActivity.subject.trim()) {
      alert("Please enter a subject for the activity")
      return
    }
  
    try {
      console.log("🔍 Adding activity via apiClient...")
      const activityData = {
        prospect_id: prospect.id,
        activity_type: newActivity.activity_type,
        subject: newActivity.subject,
        description: newActivity.description,
      }
      
      const result = await apiClient.createProspectActivity(activityData)
      console.log("✅ Activity added successfully:", result)
      
      setNewActivity({ activity_type: "call", subject: "", description: "" })
      loadActivities() // Reload activities
      alert("Activity added successfully!")
    } catch (error) {
      console.error("❌ Error adding activity:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert("Error adding activity: " + errorMessage)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleZipChange = (value: string) => {
    const formatted = formatPostalCode(value, formData.country)
    setFormData((prev) => ({ ...prev, zip_code: formatted }))
  }

  const handleAssignmentChange = (newAssignmentId: string) => {
    const isOwnershipChange = newAssignmentId !== prospect.assigned_salesperson_id?.toString()
    
    if (isOwnershipChange && canReassignProspects) {
      setShowChangeReason(true)
    }
    
    setFormData((prev) => ({ ...prev, assigned_salesperson_id: newAssignmentId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
  
    try {
      console.log("🔍 Submitting prospect update")
      console.log("🔍 Form data:", formData)
  
      // Format postal code and build complete address
      const formattedZip = formatPostalCode(formData.zip_code, formData.country)
      const fullAddress = `${formData.street_address}, ${formData.city}, ${formData.state} ${formattedZip}`.trim()
  
      const isOwnershipChange = formData.assigned_salesperson_id !== prospect.assigned_salesperson_id?.toString()
  
      const requestBody: any = {
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        zip_code: formattedZip,
        country: formData.country,
        formatted_address: formData.formatted_address || fullAddress,
        website: formData.website,
        business_type: formData.business_type,
        estimated_value: Number.parseFloat(formData.estimated_value) || 0,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes,
        assigned_salesperson_id: Number.parseInt(formData.assigned_salesperson_id) || prospect.assigned_salesperson_id,
      }
  
      // Add change reason if ownership is changing
      if (isOwnershipChange && canReassignProspects) {
        requestBody.change_reason = changeReason || "Prospect reassignment via edit modal"
      }
  
      // ✅ NEW: Use apiClient instead of fetch
      const result = await apiClient.updateProspect(prospect.id, requestBody)
  
      console.log("✅ Prospect updated successfully:", result)
  
      onSuccess()
      onClose()
      setChangeReason("")
      setShowChangeReason(false)
  
    } catch (error) {
      console.error("❌ Error updating prospect:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert("Error updating prospect: " + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!prospect) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Building className="h-5 w-5" />
            {prospect.business_name}
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300">{prospect.status}</Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">Edit prospect information and manage sales activities</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </div>

              {/* Assignment Dropdown */}
              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-medium flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4" />
                  Assignment & Ownership
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="assigned_salesperson_id" className="text-foreground">
                    Assigned Sales Representative *
                    {!canReassignProspects && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Read Only
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.assigned_salesperson_id}
                    onValueChange={handleAssignmentChange}
                    disabled={!canReassignProspects || loadingSalesEmployees}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder={loadingSalesEmployees ? "Loading employees..." : "Select sales representative"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {salesEmployees.map((employee) => {
                        const isCurrentOwner = employee.id === prospect.assigned_salesperson_id
                        
                        return (
                          <SelectItem key={employee.id} value={employee.id.toString()} className="text-black hover:bg-gray-100">
                            <div className="flex items-center gap-2 w-full">
                              {getEmployeeIcon(employee, prospect.assigned_salesperson_id)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{employee.full_name}</span>
                                  {isCurrentOwner && (
                                    <Badge variant="outline" className="text-xs">Current Owner</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {employee.position_title || employee.role} 
                                  {employee.department_name && ` • ${employee.department_name}`}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  
                  {!canReassignProspects && (
                    <p className="text-sm text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Only Sales Managers and Super Admins can reassign prospects to other team members.
                    </p>
                  )}
                </div>

                {/* Change Reason Input (shown when ownership is changing) */}
                {showChangeReason && (
                  <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <Label htmlFor="change_reason" className="text-foreground">Reason for Assignment Change</Label>
                    <Textarea
                      id="change_reason"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="Please provide a reason for changing the prospect assignment..."
                      rows={2}
                      className="bg-background text-foreground border-border"
                    />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      This change will be logged in the audit system for compliance tracking.
                    </p>
                  </div>
                )}
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
                  <Label htmlFor="business_type" className="text-foreground">Industry</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => handleInputChange("business_type", value)}
                  >
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {businessSectors.map((sector: any) => (
                        <SelectItem key={sector.id} value={sector.businesssectorname} className="text-black hover:bg-gray-100">
                          {sector.businesssectorname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_value" className="text-foreground">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => handleInputChange("estimated_value", e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
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
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="new" className="text-black hover:bg-gray-100">New</SelectItem>
                      <SelectItem value="contacted" className="text-black hover:bg-gray-100">Contacted</SelectItem>
                      <SelectItem value="qualified" className="text-black hover:bg-gray-100">Qualified</SelectItem>
                      <SelectItem value="proposal" className="text-black hover:bg-gray-100">Proposal</SelectItem>
                      <SelectItem value="negotiation" className="text-black hover:bg-gray-100">Negotiation</SelectItem>
                      <SelectItem value="converted" className="text-black hover:bg-gray-100">Converted</SelectItem>
                      <SelectItem value="lost" className="text-black hover:bg-gray-100">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Activities Tab with Full Functionality */}
          <TabsContent value="activities" className="space-y-4">
            {/* Add New Activity */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4" />
                  Add New Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_type" className="text-foreground">Activity Type</Label>
                    <Select
                      value={newActivity.activity_type}
                      onValueChange={(value) => setNewActivity((prev) => ({ ...prev, activity_type: value }))}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        <SelectItem value="call" className="text-black hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            Phone Call
                          </div>
                        </SelectItem>
                        <SelectItem value="email" className="text-black hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting" className="text-black hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            Meeting
                          </div>
                        </SelectItem>
                        <SelectItem value="note" className="text-black hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            Note
                          </div>
                        </SelectItem>
                        <SelectItem value="follow_up" className="text-black hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Follow Up
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground">Subject *</Label>
                    <Input
                      id="subject"
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of activity"
                      required
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Detailed notes about the activity, outcome, next steps..."
                    className="bg-background text-foreground border-border"
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

            {/* Activities List */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Building className="h-4 w-4" />
                  Activity History ({activities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-foreground">No activities recorded yet</p>
                    <p className="text-sm">Start by adding an activity above to track your sales interactions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-muted/30 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.activity_type)}
                            <div>
                              <div className="font-medium text-sm text-foreground">{activity.subject}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
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
                          <div className="text-sm text-muted-foreground mt-2 pl-6">
                            {activity.description}
                          </div>
                        )}
                        {activity.outcome && (
                          <div className="text-xs text-muted-foreground mt-1 pl-6">
                            <strong>Outcome:</strong> {activity.outcome}
                          </div>
                        )}
                        {activity.next_action && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-6">
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