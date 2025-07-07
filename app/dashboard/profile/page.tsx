// File: app/dashboard/profile/page.tsx
// Enhanced Profile Page with QR Code Generation for Business Clients

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { User, Shield, Mail, Calendar, Crown, Building, Settings, QrCode } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRCodeModal } from "@/components/qr-code-modal"

export default function ProfilePage() {
  const { user, role, businessId } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [businessData, setBusinessData] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(false)

  // Load business data for clients
  useEffect(() => {
    if (role === "client" && businessId) {
      loadBusinessData()
    }
  }, [role, businessId])

  const loadBusinessData = async () => {
    if (!businessId) return
    
    setLoadingBusiness(true)
    try {
      console.log(`📊 Loading business data for client ${businessId}`)
      
      const response = await fetch(`/api/clients/${businessId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBusinessData(result.data)
          console.log("✅ Business data loaded:", result.data.business_name)
        }
      }
    } catch (error) {
      console.error("❌ Error loading business data:", error)
    } finally {
      setLoadingBusiness(false)
    }
  }

  const handleShowQRCode = () => {
    if (businessId && businessData) {
      setQrModalOpen(true)
    }
  }

  const getRoleInfo = (userRole: string | null) => {
    switch (userRole) {
      case "super_admin":
        return {
          name: "Super Administrator",
          description: "Full system access and control",
          color: "bg-red-100 text-red-800",
          icon: Crown,
          permissions: ["Full System Access", "User Management", "System Administration", "Database Control"],
        }
      case "admin":
        return {
          name: "Administrator",
          description: "GladGrade employee with admin privileges",
          color: "bg-blue-100 text-blue-800",
          icon: Shield,
          permissions: ["User Management", "Content Moderation", "Reports", "Settings"],
        }
      case "moderator":
        return {
          name: "Moderator",
          description: "Content moderation and review management",
          color: "bg-green-100 text-green-800",
          icon: Shield,
          permissions: ["Content Moderation", "Review Management", "Image Approval"],
        }
      case "employee":
        return {
          name: "Employee",
          description: "GladGrade team member",
          color: "bg-gray-100 text-gray-800",
          icon: User,
          permissions: ["Customer Support", "Basic Reports", "Review Responses"],
        }
      case "client":
        return {
          name: "Business Client",
          description: "Business owner or manager",
          color: "bg-purple-100 text-purple-800",
          icon: Building,
          permissions: ["View Reports", "Manage Reviews", "Partner Access", "Business Settings"],
        }
      default:
        return {
          name: "Unknown",
          description: "Role not assigned",
          color: "bg-gray-100 text-gray-800",
          icon: User,
          permissions: [],
        }
    }
  }

  const roleInfo = getRoleInfo(role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark">Profile Settings</h1>
        <div className="flex items-center gap-2">
          {/* QR Code Button for Business Clients */}
          {role === "client" && businessId && (
            <Button 
              variant="outline" 
              onClick={handleShowQRCode}
              disabled={loadingBusiness || !businessData}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Generate QR Code
            </Button>
          )}
          
          <Button onClick={() => setIsEditing(!isEditing)} className="bg-primary hover:bg-primary-dark text-dark">
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {/* Business Information Card for Clients */}
      {role === "client" && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBusiness ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-purple-600">Loading business data...</span>
              </div>
            ) : businessData ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-purple-700">Business Name</Label>
                  <div className="text-lg font-semibold">{businessData.business_name || "Not specified"}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-purple-700">Industry</Label>
                  <div className="text-sm">{businessData.industry_category_name || "Not specified"}</div>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-purple-700">Business Address</Label>
                  <div className="text-sm">{businessData.business_address || "Not specified"}</div>
                </div>
                
                {businessData.place_id && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-purple-700">Google Place ID</Label>
                    <div className="text-xs font-mono bg-white p-2 rounded border">
                      {businessData.place_id}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-purple-700">Status:</Label>
                    <Badge variant={businessData.isactive ? "default" : "secondary"}>
                      {businessData.isactive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  {businessData.claim_status && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-purple-700">Claim Status:</Label>
                      <Badge variant="outline" className="capitalize">
                        {businessData.claim_status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* QR Code Quick Access */}
                <div className="md:col-span-2 bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-purple-700">QR Code</Label>
                      <div className="text-sm text-gray-600">Generate and print QR codes for your business</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleShowQRCode}
                      disabled={loadingBusiness || !businessData}
                      className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50"
                    >
                      <QrCode className="h-4 w-4" />
                      Generate QR Code
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No business data available</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={typeof user === 'string' ? user : user?.email || ""}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Role</Label>
              <div className="flex items-center gap-2">
                <RoleIcon className="h-4 w-4 text-gray-500" />
                <Badge className={`${roleInfo.color} flex-1 justify-center`}>
                  {roleInfo.name}
                </Badge>
              </div>
            </div>
          </div>

          {/* Role Description */}
          <div className="space-y-2">
            <Label>Role Description</Label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {roleInfo.description}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="flex flex-wrap gap-2">
              {roleInfo.permissions.map((permission, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          {/* Account Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Login</Label>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Theme</Label>
              <div className="text-sm text-gray-600">Choose your preferred theme</div>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {businessData && businessId && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          businessId={businessId}
          businessName={businessData.business_name}
          placeId={businessData.place_id}
          businessAddress={businessData.business_address}
        />
      )}
    </div>
  )
}