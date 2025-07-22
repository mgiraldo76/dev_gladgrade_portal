// File: app/dashboard/page.tsx
// Path: /dashboard
// Updated Dashboard with QR Options for Client Users

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Shield, User, QrCode, TrendingUp, Building } from "lucide-react"
import { QRCodeModal } from "@/components/qr-code-modal"
import { QRActions } from "@/components/qr-actions"
import { apiClient } from "@/lib/api-client"
import { Settings } from "lucide-react"

export default function Dashboard() {
  const { user, role, businessId, loading, isFirebaseConfigured } = useAuth()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(false)

  console.log("📊 Dashboard rendering:", { user: user?.email, role, loading, isFirebaseConfigured })

  useEffect(() => {
    if (role === "client" && user && businessId) {
      loadBusinessProfile()
    }
  }, [role, user, businessId])

  const loadBusinessProfile = async () => {
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
          setBusinessProfile({
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Welcome to GladGrade Portal
            {role === "super_admin" && <Crown className="h-8 w-8 text-primary" />}
            {role === "admin" && <Shield className="h-6 w-6 text-blue-600" />}
            {(role === "employee" || role === "moderator") && <User className="h-6 w-6 text-muted-foreground" />}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">Logged in as:</span>
            <span className="font-medium text-foreground">{user?.email || "Demo User"}</span>
            <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded capitalize">
              {role === "super_admin" ? "Super Admin" : role?.replace("_", " ") || "User"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Monitor your business performance and customer satisfaction in real-time.
          </p>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {!isFirebaseConfigured && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-orange-800">Demo Mode Active</span>
              </div>
              <span className="text-orange-700 text-sm">
                Firebase Authentication: {isFirebaseConfigured ? "Yes" : "No"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Profile Info for Clients */}
      {role === "client" && businessProfile && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Building className="h-5 w-5" />
              {businessProfile.business_name}
            </CardTitle>
            <CardDescription className="text-purple-600 dark:text-purple-400">
              Business ID: {businessId} | {businessProfile.business_address || "Address not set"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              GCSG Score
            </CardTitle>
            <CardDescription>Your Global Customer Satisfaction Grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">785</div>
            <div className="text-sm text-green-600 mb-3">+15 points since last month</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              Recent Reviews
            </CardTitle>
            <CardDescription>Latest customer feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-muted-foreground mb-3">New reviews this week</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`h-4 w-4 ${
                    star <= 4 ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ⭐
                </div>
              ))}
              <span className="text-sm text-muted-foreground ml-2">4.2 average</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              Growth Trend
            </CardTitle>
            <CardDescription>Monthly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">+8.5%</div>
            <div className="text-sm text-muted-foreground mb-3">Compared to last month</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Trending upward</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New review received</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">GCSG score updated</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New client onboarded</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-foreground">Analytics & Insights</h3>
                  <p className="text-sm text-muted-foreground">View detailed performance reports</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-foreground">Find Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with business partners</p>
                </div>
              </div>
            </button>

            <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage account and preferences</p>
                </div>
              </div>
            </button>

            {/* NEW: QR Options Section - Only for Clients */}
            {role === "client" && businessProfile && !loadingBusiness && (
              <div className="w-full p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-foreground">QR Options</h3>
                </div>
                
                <QRActions
                  businessId={businessId!}
                  businessName={businessProfile.business_name}
                  businessAddress={businessProfile.business_address}
                  variant="compact"
                />
              </div>
            )}

            {/* Loading state for QR Options */}
            {role === "client" && loadingBusiness && (
              <div className="w-full p-4 bg-orange-50 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-foreground">QR Options</h3>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal - Keep existing functionality intact */}
      {businessProfile && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          businessId={businessId!}
          businessName={businessProfile.business_name}
          placeId={businessProfile.place_id}
          businessAddress={businessProfile.business_address}
        />
      )}
    </div>
  )
}