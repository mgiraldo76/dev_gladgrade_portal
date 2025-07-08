// File: app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Shield, User, QrCode } from "lucide-react"
import { QRCodeModal } from "@/components/qr-code-modal"

export default function Dashboard() {
  const { user, role, loading, isFirebaseConfigured } = useAuth()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<any>(null)

  console.log("📊 Dashboard rendering:", { user: user?.email, role, loading, isFirebaseConfigured })

  useEffect(() => {
    if (role === "client" && user) {
      loadBusinessProfile()
    }
  }, [role, user])

  const loadBusinessProfile = async () => {
    try {
      // For client users, we need to get their businessId from Firebase claims
      const token = await user?.getIdTokenResult()
      const businessId = token?.claims?.businessId
      
      if (businessId) {
        const response = await fetch(`/api/clients/${businessId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setBusinessProfile(result.data)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load business profile:", error)
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
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Remove Debug Information card or make it theme-aware */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-muted/50 border-muted">
          <CardHeader>
            <CardTitle className="text-foreground">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Email:</span>
                <span className="text-foreground">{user?.email || "Not logged in"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="text-foreground">{role || "No role assigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firebase Configured:</span>
                <span className="text-foreground">{isFirebaseConfigured ? "Yes" : "No"}</span>
              </div>
            </div>
          </CardContent>
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
                    star <= 4 ? "text-yellow-400" : "text-muted"
                  }`}
                >
                  ⭐
                </div>
              ))}
              <span className="text-sm text-muted-foreground ml-2">4.2 avg rating</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              AI Insights
            </CardTitle>
            <CardDescription>AI-generated business insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">3</div>
            <div className="text-sm text-muted-foreground mb-3">New insights available</div>
            <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              Action Required
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
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
            {role === "client" && businessProfile && (
              <button
                onClick={() => setQrModalOpen(true)}
                className="w-full p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground">Generate QR Code</h3>
                    <p className="text-sm text-muted-foreground">Create QR code for customer reviews</p>
                  </div>
                </div>
              </button>
            )}
            <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-blue-600">📊</div>
                <div>
                  <h3 className="font-medium text-foreground">Analytics & Insights</h3>
                  <p className="text-sm text-muted-foreground">View detailed performance reports</p>
                </div>
              </div>
            </button>
            <button className="w-full p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-green-600">🤝</div>
                <div>
                  <h3 className="font-medium text-foreground">Find Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with business partners</p>
                </div>
              </div>
            </button>
            <button className="w-full p-4 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 text-foreground">⚙️</div>
                <div>
                  <h3 className="font-medium text-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage account and preferences</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal for Clients */}
      {businessProfile && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          businessId={businessProfile.id}
          businessName={businessProfile.business_name}
          placeId={businessProfile.place_id}
          businessAddress={businessProfile.business_address}
        />
      )}
    </div>
  )
}