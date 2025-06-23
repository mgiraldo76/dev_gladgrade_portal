"use client"

import { useAuth } from "@/app/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Shield, User } from "lucide-react"

export default function Dashboard() {
  const { user, role, loading, isFirebaseConfigured } = useAuth()

  console.log("📊 Dashboard rendering:", { user: user?.email, role, loading, isFirebaseConfigured })

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark flex items-center gap-3">
            Welcome to GladGrade Portal
            {role === "super_admin" && <Crown className="h-8 w-8 text-primary" />}
            {role === "admin" && <Shield className="h-6 w-6 text-blue-600" />}
            {(role === "employee" || role === "moderator") && <User className="h-6 w-6 text-gray-600" />}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-600">Logged in as:</span>
            <span className="font-medium">{user?.email || "Demo User"}</span>
            <span className="text-sm bg-primary/20 px-2 py-1 rounded capitalize">
              {role === "super_admin" ? "Super Admin" : role?.replace("_", " ") || "Client"}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <p className="text-gray-600">Monitor your business performance and customer satisfaction in real-time.</p>

      {/* Debug Info Card - Remove in production */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>User Email:</strong> {user?.email || "Not logged in"}
            </div>
            <div>
              <strong>Role:</strong> {role || "Not assigned"}
            </div>
            <div>
              <strong>Firebase Configured:</strong> {isFirebaseConfigured ? "Yes" : "No (Demo Mode)"}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              GCSG Score
            </CardTitle>
            <CardDescription>Your Global Customer Satisfaction Grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">785</div>
            <p className="text-sm text-green-600 mt-2">+15 points since last month</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-primary h-2 rounded-full" style={{ width: "78.5%" }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Recent Reviews
            </CardTitle>
            <CardDescription>Latest customer feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">12</div>
            <p className="text-sm text-gray-600 mt-2">New reviews this week</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-yellow-400">
                {"★".repeat(4)}
                {"☆".repeat(1)}
              </div>
              <span className="text-sm text-gray-500">4.2 avg rating</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              AI Insights
            </CardTitle>
            <CardDescription>AI-generated business insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">3</div>
            <p className="text-sm text-gray-600 mt-2">New insights available</p>
            <div className="mt-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Action Required
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New review received</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">GCSG score updated</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Partner recommendation available</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 text-left bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                <div className="font-medium text-dark">View Reports</div>
                <div className="text-xs text-gray-600 mt-1">Analytics & insights</div>
              </button>
              <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium text-dark">Manage Reviews</div>
                <div className="text-xs text-gray-600 mt-1">Respond to feedback</div>
              </button>
              <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium text-dark">Find Partners</div>
                <div className="text-xs text-gray-600 mt-1">Improve satisfaction</div>
              </button>
              <button className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium text-dark">Settings</div>
                <div className="text-xs text-gray-600 mt-1">Account preferences</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
