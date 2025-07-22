// File: app/dashboard/profile/page.tsx
// Path: /dashboard/profile
// Enhanced Profile Page with QR Options for Business Clients

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
import { QRActions } from "@/components/qr-actions"
import { apiClient } from "@/lib/api-client"

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
      
      // Use the same endpoint that works in other parts of the app
      const result = await apiClient.getClients()
      if (result.success) {
        // Find the specific client from the list
        const clientData = result.data.find((client: any) => client.id === businessId)
        if (clientData) {
          setBusinessData({
            business_name: clientData.business_name,
            business_address: clientData.business_address || clientData.contact_address,
            id: businessId
          })
          console.log("✅ Business data loaded:", clientData.business_name)
        } else {
          console.error("❌ Client not found in results")
        }
      }
    } catch (error) {
      console.error("Failed to load business profile:", error)
    } finally {
      setLoadingBusiness(false)
    }
  }

  const handleShowQRCode = () => {
    setQrModalOpen(true)
  }

  const getRoleInfo = (role: string | null) => {
    switch (role) {
      case "super_admin":
        return {
          name: "Super Administrator",
          description: "Full system access and control",
          color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
          icon: Crown,
          permissions: ["Complete System Control", "User Management", "Security Management", "Data Access"],
        }
      case "admin":
        return {
          name: "Administrator",
          description: "Administrative privileges",
          color: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          icon: Shield,
          permissions: ["User Management", "Content Moderation", "Advanced Reports", "Settings Management"],
        }
      case "moderator":
        return {
          name: "Content Moderator",
          description: "Content review and moderation",
          color: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
          icon: Shield,
          permissions: ["Review Management", "Content Moderation", "Image Approval"],
        }
      case "employee":
        return {
          name: "Employee",
          description: "Standard employee access",
          color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
          icon: User,
          permissions: ["Customer Support", "Basic Reports", "Review Responses"],
        }
      case "client":
        return {
          name: "Business Client",
          description: "Business owner or manager",
          color: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          icon: Building,
          permissions: ["View Reports", "Manage Reviews", "Partner Access", "Business Settings"],
        }
      default:
        return {
          name: "Unknown",
          description: "Role not assigned",
          color: "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
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
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsEditing(!isEditing)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {/* Business Information Card for Clients */}
      {role === "client" && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBusiness ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400"></div>
                <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">Loading business data...</span>
              </div>
            ) : businessData ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Business Name:</Label>
                    <span className="text-sm text-foreground font-medium">{businessData.business_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Contact:</Label>
                    <span className="text-sm text-foreground">{businessData.contact_name || "Not specified"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Email:</Label>
                    <span className="text-sm text-foreground">{businessData.contact_email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Status:</Label>
                    <Badge variant={businessData.isactive ? "default" : "secondary"}>
                      {businessData.isactive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  {businessData.claim_status && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Claim Status:</Label>
                      <Badge variant="outline" className="capitalize border-border">
                        {businessData.claim_status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* QR Options Section */}
                <div className="bg-background p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">QR Options</Label>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Generate and manage QR codes for your business
                  </div>
                  
                  <QRActions
                    businessId={businessId!}
                    businessName={businessData.business_name}
                    businessAddress={businessData.business_address}
                    variant="compact"
                    className="justify-start"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No business data available</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Profile Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={typeof user === 'string' ? user : user?.email || "demo@gladgrade.com"}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate" className="text-foreground">Member Since</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="joinDate"
                  value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Demo Account"}
                  disabled
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Role and Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RoleIcon className="h-6 w-6" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{roleInfo.name}</h3>
                  <Badge className={roleInfo.color}>
                    {role === "super_admin" ? "Super Admin" : role?.replace("_", " ") || "Unknown"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
              </div>
            </div>

            {roleInfo.permissions.length > 0 && (
              <div className="ml-9">
                <h4 className="text-sm font-medium text-foreground mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {roleInfo.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Theme</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred appearance</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Additional preference settings will be available in future updates.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keep existing QR Code Modal for full functionality */}
      {businessData && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          businessId={businessId!}
          businessName={businessData.business_name}
          placeId={businessData.place_id}
          businessAddress={businessData.business_address}
        />
      )}
    </div>
  )
}