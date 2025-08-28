// File: app/dashboard/page.tsx
// Path: /dashboard
// Updated Dashboard with QR Options for Client Users

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Shield, User, QrCode, TrendingUp, Building, HandshakeIcon } from "lucide-react"
import { QRCodeModal } from "@/components/qr-code-modal"
import { QRActions } from "@/components/qr-actions"
import { apiClient } from "@/lib/api-client"
import { Settings } from "lucide-react"
import { getGCSGScore } from "@/lib/gcsg-utils"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { TrendingDown } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { BarChart3, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { user, role, businessId, loading, isFirebaseConfigured } = useAuth()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  //gcsg 
  const [gcsgScore, setGcsgScore] = useState<number | null>(null)
  const [loadingGcsg, setLoadingGcsg] = useState(false)
  //reviews
  const [recentReviews, setRecentReviews] = useState<any>(null)
  const [loadingRecentReviews, setLoadingRecentReviews] = useState(false)
  //trends
  const [performanceTrend, setPerformanceTrend] = useState<any>(null)
  const [loadingPerformanceTrend, setLoadingPerformanceTrend] = useState(false)

  
  //activities
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  const [partnersModalOpen, setPartnersModalOpen] = useState(false)




  console.log("📊 Dashboard rendering:", { user: user?.email, role, loading, isFirebaseConfigured })


  // Helper function to get recent reviews GCSG color
  const getRecentReviewsGcsgColor = (gcsgScore: number | null) => {
    if (!gcsgScore) return "text-muted-foreground"
    if (gcsgScore >= 750) return "text-green-600 dark:text-green-400"
    if (gcsgScore >= 700) return "text-orange-500 dark:text-orange-400"
    return "text-red-500 dark:text-red-400"
  }


  useEffect(() => {
    if (role === "client" && user && businessId) {
      loadBusinessProfile()
    }
    
    // Load activities for all authenticated users
    if (user && (businessId || role !== "client")) {
      loadActivities()
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

          // Load GCSG score if place_id is available
          if (clientData.place_id) {
            loadGCSGScore(clientData.place_id)
            // Load recent reviews
            loadRecentReviews(businessId)
            // Load trending
            loadPerformanceTrend(businessId)
          }

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


  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    if (!user || (role === 'client' && !businessId)) return

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing activities...")
      loadActivities()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, businessId, role])


  //reviews
  const loadRecentReviews = async (clientId: number) => {
    setLoadingRecentReviews(true)
    try {
      console.log("Loading recent reviews for business ID:", clientId)
      const response = await apiClient.getClientRecentReviews(clientId, { days: 7 })
      
      if (response.success) {
        setRecentReviews(response.data)
        console.log("Recent reviews loaded:", response.data)
      } else {
        console.error("Failed to load recent reviews:", response.error)
        setRecentReviews(null)
      }
    } catch (error) {
      console.error("Error loading recent reviews:", error)
      setRecentReviews(null)
    } finally {
      setLoadingRecentReviews(false)
    }
  }

  //trends
  const loadPerformanceTrend = async (clientId: number) => {
    setLoadingPerformanceTrend(true)
    try {
      console.log("Loading performance trend for business ID:", clientId)
      
      // Get last 30 days and 60-30 days data in parallel
      const [recent30Days, previous30Days] = await Promise.all([
        apiClient.getClientRecentReviews(clientId, { days: 30 }),
        apiClient.getClientRecentReviews(clientId, { days: 60 })
      ])
  
      if (recent30Days.success && previous30Days.success) {
        const recentCount = recent30Days.data.count || 0
        const totalCount = previous30Days.data.count || 0
        const previousCount = Math.max(0, totalCount - recentCount) // 60-30 days period
  
        let percentageChange = 0
        let trend = 'unchanged'
        
        if (previousCount > 0) {
          percentageChange = ((recentCount - previousCount) / previousCount) * 100
        } else if (recentCount > 0) {
          percentageChange = 100 // 100% increase from 0
        }
  
        // Determine trend direction
        if (percentageChange > 5) {
          trend = 'up'
        } else if (percentageChange < -5) {
          trend = 'down'
        } else {
          trend = 'unchanged'
        }
  
        const trendData = {
          percentageChange: Math.abs(percentageChange),
          trend,
          recentCount,
          previousCount,
          isPositive: percentageChange >= 0
        }
  
        setPerformanceTrend(trendData)
        console.log("Performance trend loaded:", trendData)
      } else {
        console.error("Failed to load performance trend data")
        setPerformanceTrend(null)
      }
    } catch (error) {
      console.error("Error loading performance trend:", error)
      setPerformanceTrend(null)
    } finally {
      setLoadingPerformanceTrend(false)
    }
  }

  // Helper function to get GCSG score text color
  const getGcsgScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground"
    if (score >= 750) return "text-green-600 dark:text-green-400"
    if (score >= 700) return "text-orange-500 dark:text-orange-400"
    return "text-red-500 dark:text-red-400"
  }

  // Helper function to get GCSG progress bar color
  const getGcsgBarColor = (score: number | null) => {
    if (!score) return "bg-muted-foreground"
    if (score >= 750) return "bg-green-600"
    if (score >= 700) return "bg-orange-500"
    return "bg-red-500"
  }

  // Helper function to calculate GCSG percentage (300-850 range)
  const getGcsgPercentage = (score: number | null) => {
    if (!score) return 0
    const percentage = ((score - 300) / (850 - 300)) * 100
    return Math.max(0, Math.min(100, percentage))
  }
  const loadGCSGScore = async (placeId: string) => {
    setLoadingGcsg(true)
    try {
      console.log("Loading GCSG score for place ID:", placeId)
      const result = await getGCSGScore(placeId)
      
      if (result.error) {
        console.error("GCSG score error:", result.error)
        setGcsgScore(null)
      } else {
        setGcsgScore(result.score)
        console.log("GCSG score loaded:", result.score, result.cached ? "(cached)" : "(fresh)")
      }
    } catch (error) {
      console.error("Failed to load GCSG score:", error)
      setGcsgScore(null)
    } finally {
      setLoadingGcsg(false)
    }
  }


  // Helper function to get trend color
  const getTrendColor = (trend: string, isPositive: boolean) => {
    if (trend === 'up') return "text-green-600"
    if (trend === 'down') return "text-red-500"
    return "text-orange-500"
  }

  // Helper function to get trend text and icon
  const getTrendDisplay = (trend: string, isPositive: boolean) => {
    if (trend === 'up') {
      return {
        icon: TrendingUp,
        text: 'Trending upward',
        color: 'text-green-600'
      }
    } else if (trend === 'down') {
      return {
        icon: TrendingDown,
        text: 'Trending downward', 
        color: 'text-red-500'
      }
    } else {
      return {
        icon: TrendingUp,
        text: 'Relatively unchanged',
        color: 'text-orange-500'
      }
    }
  }



  
  // Helper function to get activity color based on type
  const getActivityColor = (activityType: string) => {
    const colors = {
      'qr_generated': 'bg-orange-500',
      'service_purchased': 'bg-blue-500', 
      'team_added': 'bg-green-500',
      'client_activity': 'bg-purple-500',
      'client_claim': 'bg-indigo-500',
      'prospect_converted': 'bg-emerald-500',
      'support_request': 'bg-red-500',  // NEW: Support requests
      'client_activity_logged': 'bg-gray-500'
    }
    return colors[activityType as keyof typeof colors] || 'bg-gray-400'
  }

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return activityTime.toLocaleDateString()
  }

  // Function to load activities
  const loadActivities = async () => {
    if (!businessId && role === 'client') return
    
    setLoadingActivities(true)
    try {
      console.log("📊 Loading recent activities...")
      const targetId = role === 'client' ? businessId : 1 // For employees, use client ID 1 as system activities
      const result = await apiClient.getClientActivities(targetId!, 10)
      
      if (result.success) {
        setActivities(result.data || [])
        console.log("✅ Activities loaded:", result.data?.length || 0)
      } else {
        console.error("❌ Failed to load activities:", result.error)
        setActivities([])
      }
    } catch (error) {
      console.error("❌ Error loading activities:", error)
      setActivities([])
    } finally {
      setLoadingActivities(false)
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
          {(role === "employee" || role === "super_admin") &&
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">Logged in as:</span>
            <span className="font-medium text-foreground">{user?.email || "Demo User"}</span>
            <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded capitalize">
              {role === "super_admin" ? "Super Admin" : role?.replace("_", " ") || "User"}
            </span>
          </div>
          }
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
              {businessProfile.business_address || "Address not set"}
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
            <div className={`text-3xl font-bold mb-2 ${getGcsgScoreColor(gcsgScore)}`}>
              {loadingGcsg ? "..." : (gcsgScore || "N/A")}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className={`h-2 rounded-full ${getGcsgBarColor(gcsgScore)}`} style={{ width: `${getGcsgPercentage(gcsgScore)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              Recent Reviews
            </CardTitle>
            <CardDescription>Latest customer feedback (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReviews?.count > 0 ? (
              <Link 
                href={`/dashboard/reviews?days=7`}
                className="text-3xl font-bold text-blue-600 hover:text-blue-700 mb-2 block cursor-pointer"
              >
                {loadingRecentReviews ? "..." : recentReviews.count}
              </Link>
            ) : (
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {loadingRecentReviews ? "..." : (recentReviews?.count || "0")}
              </div>
            )}
            <div className="text-sm text-muted-foreground mb-3">New reviews this week</div>
            {recentReviews?.averageGCSG && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className={`text-sm font-medium ${getRecentReviewsGcsgColor(recentReviews.averageGCSG)}`}>
                  Average GCSG: {recentReviews.averageGCSG}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              Performance Trend
            </CardTitle>
            <CardDescription>Last 30 days engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-2 ${loadingPerformanceTrend ? 'text-muted-foreground' : getTrendColor(performanceTrend?.trend, performanceTrend?.isPositive)}`}>
              {loadingPerformanceTrend 
                ? "..." 
                : performanceTrend 
                  ? `${performanceTrend.isPositive ? '+' : '-'}${performanceTrend.percentageChange.toFixed(1)}%`
                  : "N/A"
              }
            </div>
            <div className="text-sm text-muted-foreground mb-3">Compared to previous month</div>
            {performanceTrend && !loadingPerformanceTrend && (
              <div className="flex items-center gap-1">
                {(() => {
                  const { icon: Icon, text, color } = getTrendDisplay(performanceTrend.trend, performanceTrend.isPositive)
                  return (
                    <>
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className={`text-sm ${color}`}>{text}</span>
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Feed - Real Data with Scrollable Container */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              <div className="p-6 pt-0 space-y-4">
                {loadingActivities ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                        <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`h-2 w-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
                    
            {/* Analytics & Insights - Link to Reports */}
            <Link 
              href="/dashboard/reports" 
              className="block w-full p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-foreground">Analytics & Insights</h3>
                  <p className="text-sm text-muted-foreground">View detailed performance reports</p>
                </div>
              </div>
            </Link>

            {/* Find Partners - Conditional behavior based on user role */}
            {role === "client" ? (
            <button 
              onClick={() => setPartnersModalOpen(true)}
              className="w-full p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HandshakeIcon className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-foreground">Find Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with business partners</p>
                </div>
              </div>
            </button>
            ) : (
            <Link 
              href="/dashboard/partners" 
              className="block w-full p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HandshakeIcon className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-foreground">Find Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with business partners</p>
                </div>
              </div>
            </Link>
            )}
            {/*
            <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage account and preferences</p>
                </div>
              </div>
            </button>
            */}
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




                {/* Partners Modal */}
                <Dialog open={partnersModalOpen} onOpenChange={setPartnersModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandshakeIcon className="h-5 w-5 text-green-600" />
              Find Partners
            </DialogTitle>
            <DialogDescription>
              Partner matching functionality
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">Feature Under Development</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Our partner matching system is being improved to provide you with better recommendations. Please try again later.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => setPartnersModalOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      
    </div>

    
  )
}