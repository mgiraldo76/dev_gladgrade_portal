// File: app/dashboard/admin/mobile_app/page.tsx  
// Path: app/dashboard/admin/mobile_app/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  BarChart3,
  Users,
  Smartphone,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Activity,
  Calendar,
  Eye,
  Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { apiClient } from "@/lib/api-client"

// Color palette for charts
const CHART_COLORS = {
  primary: '#dc2626',
  secondary: '#2563eb', 
  success: '#16a34a',
  warning: '#ea580c',
  info: '#0891b2',
  purple: '#9333ea',
  pink: '#db2777',
  gray: '#6b7280'
}

const PLATFORM_COLORS: Record<string, string> = {
  'iOS': CHART_COLORS.primary,
  'Android': CHART_COLORS.success,
  'Web': CHART_COLORS.secondary,
  'Unknown': CHART_COLORS.gray
}

interface DashboardOverview {
  totalUsers: number
  recentUsers: number
  activeUsers: number
  totalLogs: number
  errorCount: number
  growthRate: number
  lastUpdated: string
}

interface UserAnalytics {
  registrationTrends: Array<{date: string, registrations: number}>
  dailyActiveUsers: Array<{date: string, active_users: number}>
  hourlyActivity: Array<{hour: number, activity_count: number}>
  topActivities: Array<{event_type: string, event_category: string, count: number}>
  period: string
}

interface DeviceAnalytics {
  deviceBreakdown: Array<{device: string, usage_count: number, unique_users: number}>
  platformBreakdown: Array<{platform: string, usage_count: number, unique_users: number}>
  appVersions: Array<{app_version: string, usage_count: number, unique_users: number}>
  period: string
}

interface ErrorAnalytics {
  errorBreakdown: Array<{category: string, count: number, unique_users: number, latest_error: string}>
  platformErrors: Array<{platform: string, count: number}>
  errorTrends: Array<{date: string, count: number}>
  criticalErrors: Array<{error_message: string, event_type: string, platform: string, occurred_at: string, frequency: number}>
  totalErrors: number
  period: string
}

export default function MobileAppAdminPage() {
  const { role, permissions } = useAuth()
  
  // Helper function to check permissions
  const hasPermission = (requiredPermissions: string[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    return requiredPermissions.some(permission => permissions.includes(permission))
  }
  
  // State management
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics | null>(null)
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("30")
  const [errorTimeRange, setErrorTimeRange] = useState("7")
  const [refreshing, setRefreshing] = useState(false)

  // Check permissions
  const hasAccess = role === 'super_admin' || role === 'admin' || hasPermission(['advanced_reports'])

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      console.log("📊 Loading mobile app dashboard data...")
      
      const [overviewRes, userRes, deviceRes, errorRes] = await Promise.all([
        apiClient.mobileAdmin.getOverview(),
        apiClient.mobileAdmin.getUserAnalytics(parseInt(timeRange)),
        apiClient.mobileAdmin.getDeviceAnalytics(parseInt(timeRange)),
        apiClient.mobileAdmin.getErrorAnalytics(parseInt(errorTimeRange))
      ])

      if (overviewRes.success) setOverview(overviewRes.data)
      if (userRes.success) setUserAnalytics(userRes.data)
      if (deviceRes.success) setDeviceAnalytics(deviceRes.data)
      if (errorRes.success) setErrorAnalytics(errorRes.data)

      console.log("✅ Dashboard data loaded successfully")
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  // Handle time range changes
  const handleTimeRangeChange = async (newRange: string) => {
    setTimeRange(newRange)
    setLoading(true)
    
    try {
      const [userRes, deviceRes] = await Promise.all([
        apiClient.mobileAdmin.getUserAnalytics(parseInt(newRange)),
        apiClient.mobileAdmin.getDeviceAnalytics(parseInt(newRange))
      ])

      if (userRes.success) setUserAnalytics(userRes.data)
      if (deviceRes.success) setDeviceAnalytics(deviceRes.data)
    } catch (error) {
      console.error("Error updating time range:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle error time range changes
  const handleErrorTimeRangeChange = async (newRange: string) => {
    setErrorTimeRange(newRange)
    setLoading(true)
    
    try {
      const errorRes = await apiClient.mobileAdmin.getErrorAnalytics(parseInt(newRange))
      if (errorRes.success) setErrorAnalytics(errorRes.data)
    } catch (error) {
      console.error("Error updating error time range:", error)
    } finally {
      setLoading(false)
    }
  }

  // Export data
  const handleExport = async (type: string, format: string) => {
    try {
      console.log(`📤 Exporting ${type} data as ${format}...`)
      
      const result = await apiClient.mobileAdmin.exportData({
        type: type as any,
        format: format as any,
        days: parseInt(timeRange)
      })

      if (format === 'csv' && result.downloadUrl) {
        // Create download link for CSV
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `gladgrade_mobile_${type}_${new Date().toISOString().split('T')[0]}.csv`
        
        // Add auth header for download
        fetch(result.downloadUrl, {
          headers: result.headers
        }).then(response => response.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob)
            link.href = url
            link.click()
            window.URL.revokeObjectURL(url)
          })
      } else if (result.success) {
        // JSON download
        const dataStr = JSON.stringify(result, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `gladgrade_mobile_${type}_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      }
      
      console.log("✅ Export completed")
    } catch (error) {
      console.error("❌ Export failed:", error)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (hasAccess) {
      loadDashboardData()
    }
  }, [hasAccess])

  // Access denied screen
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need Advanced Reports permission to access Mobile App Analytics.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your administrator to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading screen
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mobile app analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            Mobile App Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into GladGrade mobile application usage and performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 Hours</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Select value="export" onValueChange={(value) => {
            if (value !== "export") {
              const [type, format] = value.split('-')
              handleExport(type, format)
            }
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="export" disabled>Export</SelectItem>
              <SelectItem value="users-json">Users (JSON)</SelectItem>
              <SelectItem value="users-csv">Users (CSV)</SelectItem>
              <SelectItem value="errors-json">Errors (JSON)</SelectItem>
              <SelectItem value="errors-csv">Errors (CSV)</SelectItem>
              <SelectItem value="all-json">All Data (JSON)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.recentUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className={overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {overview.growthRate >= 0 ? '+' : ''}{overview.growthRate}%
                </span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overview.errorCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">User Analytics</TabsTrigger>
          <TabsTrigger value="devices">Device Analytics</TabsTrigger>
          <TabsTrigger value="errors">Error Analytics</TabsTrigger>
          <TabsTrigger value="details">User Details</TabsTrigger>
        </TabsList>

        {/* User Analytics Tab */}
        <TabsContent value="overview" className="space-y-4">
          {userAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Registration Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registration Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Daily user registrations over {userAnalytics.period} (click bars to drill down)
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart 
                      data={userAnalytics.registrationTrends}
                      onClick={(data: any) => {
                        console.log('Clicked chart:', data);
                        if (data && data.activePayload && data.activePayload[0]) {
                          const chartData = data.activePayload[0].payload;
                          if (chartData && chartData.date) {
                            window.location.href = `/dashboard/admin/mobile_app/users?date=${chartData.date}&type=registrations`;
                          }
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [value, 'Registrations']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke={CHART_COLORS.primary} 
                        strokeWidth={2}
                        dot={{ 
                          fill: CHART_COLORS.primary, 
                          strokeWidth: 2, 
                          r: 4,
                          cursor: 'pointer'
                        }}
                        activeDot={{ 
                          r: 6, 
                          cursor: 'pointer'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Active Users</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Users with activity each day (click bars to drill down)
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={userAnalytics.dailyActiveUsers}
                      onClick={(data: any) => {
                        console.log('Clicked active users chart:', data);
                        if (data && data.activePayload && data.activePayload[0]) {
                          const chartData = data.activePayload[0].payload;
                          if (chartData && chartData.date) {
                            window.location.href = `/dashboard/admin/mobile_app/users?date=${chartData.date}&type=active`;
                          }
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [value, 'Active Users']}
                      />
                      <Bar 
                        dataKey="active_users" 
                        fill={CHART_COLORS.secondary}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hourly Activity Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Hour</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Usage patterns throughout the day (click bars for activity details)
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={userAnalytics.hourlyActivity}
                      onClick={(data: any) => {
                        console.log('Clicked hourly activity:', data);
                        if (data && data.activePayload && data.activePayload[0]) {
                          const chartData = data.activePayload[0].payload;
                          if (chartData && typeof chartData.hour !== 'undefined') {
                            window.location.href = `/dashboard/admin/mobile_app/activity-logs?hour=${chartData.hour}`;
                          }
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => `${value}:00`}
                        formatter={(value) => [value, 'Activities']}
                      />
                      <Bar 
                        dataKey="activity_count" 
                        fill={CHART_COLORS.success}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Activities</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Top user actions over {userAnalytics.period} (click for details)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userAnalytics.topActivities.slice(0, 8).map((activity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                        onClick={() => {
                          console.log('Clicked activity:', activity);
                          if (activity.event_type === 'ad_impression' || activity.event_type === 'ad_displayed') {
                            // Navigate to Ad Analytics
                            window.location.href = `/dashboard/admin/mobile_app/ad-analytics?event=${activity.event_type}`;
                          } else if (activity.event_type === 'search_places') {
                            // Navigate to Search Analytics
                            window.location.href = `/dashboard/admin/mobile_app/search-analytics?type=places`;
                          } else {
                            // Navigate to general activity details
                            window.location.href = `/dashboard/admin/mobile_app/activity-logs?event=${activity.event_type}&category=${activity.event_category}`;
                          }
                        }}
                      >
                        <div>
                          <p className="font-medium">{activity.event_type}</p>
                          {activity.event_category && (
                            <p className="text-sm text-muted-foreground">{activity.event_category}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="cursor-pointer">
                          {activity.count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Device Analytics Tab */}
        <TabsContent value="devices" className="space-y-4">
          {deviceAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Platform Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Usage by platform over {deviceAnalytics.period}
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceAnalytics.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="usage_count"
                        label={({platform, usage_count}) => `${platform}: ${usage_count.toLocaleString()}`}
                      >
                        {deviceAnalytics.platformBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.platform] || CHART_COLORS.gray} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Usage Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Device Versions */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Versions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Detailed breakdown with OS versions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {deviceAnalytics.deviceBreakdown.slice(0, 10).map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{device.device}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.unique_users.toLocaleString()} users
                          </p>
                        </div>
                        <Badge variant="outline">
                          {device.usage_count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* App Versions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>App Version Distribution</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Users by app version
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={deviceAnalytics.appVersions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="app_version" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Users']} />
                      <Bar dataKey="unique_users" fill={CHART_COLORS.purple} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Error Analytics Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Error Monitoring</h3>
            <Select value={errorTimeRange} onValueChange={handleErrorTimeRangeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 Hours</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errorAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Error Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Categories</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {errorAnalytics.totalErrors.toLocaleString()} total errors in {errorAnalytics.period}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errorAnalytics.errorBreakdown.slice(0, 8).map((error, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{error.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {error.unique_users} users affected
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {error.count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Error Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Daily error frequency
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={errorAnalytics.errorTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [value, 'Errors']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={CHART_COLORS.warning} 
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS.warning }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Platform Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>Errors by Platform</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Error distribution across platforms
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={errorAnalytics.platformErrors}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Errors']} />
                      <Bar dataKey="count" fill={CHART_COLORS.warning} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Critical Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Critical Errors</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Last 24 hours
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {errorAnalytics.criticalErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-destructive truncate">
                              {error.error_message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {error.event_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {error.platform}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(error.occurred_at).toLocaleString()}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {error.frequency}x
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* User Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <UserDetailsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// User Details Table Component
function UserDetailsTable() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    sortBy: 'dateCreated',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    platform: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await apiClient.mobileAdmin.getUserDetails({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        platform: filters.platform === 'all' ? '' : filters.platform,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        search: searchTerm || undefined
      })

      if (result.success) {
        setUsers(result.data.users)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [pagination.page, filters, searchTerm])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed user information with activity status
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search email, phone, or Firebase ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Eye className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Select 
              value={filters.platform} 
              onValueChange={(value) => setFilters(prev => ({...prev, platform: value}))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="iOS">iOS</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
                <SelectItem value="Web">Web</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilters({
                  sortBy: 'dateCreated',
                  sortOrder: 'DESC',
                  platform: 'all',
                  dateFrom: '',
                  dateTo: ''
                })
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">User</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Telephone</th>
                    <th className="text-left p-2 font-medium">Firebase UID</th>
                    <th className="text-left p-2 font-medium">Registered</th>
                    <th className="text-left p-2 font-medium">Last Activity</th>
                    <th className="text-left p-2 font-medium">Platform</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any, index) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">
                            {user.firstname} {user.lastname}
                          </p>
                          {user.isguest && (
                            <Badge variant="outline" className="text-xs">Guest</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">
                          {user.telephone || 'Not provided'}
                        </p>
                      </td>
                      <td className="p-2">
                        <p className="text-xs font-mono text-muted-foreground">
                          {user.firebaseuid ? 
                            `${user.firebaseuid.substring(0, 8)}...` : 
                            'No UID'
                          }
                        </p>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">
                          {new Date(user.datecreated).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">
                          {user.last_activity ? 
                            new Date(user.last_activity).toLocaleDateString() : 
                            'Never'
                          }
                        </p>
                      </td>
                      <td className="p-2">
                        {user.latest_platform && (
                          <Badge variant="secondary" className="text-xs">
                            {user.latest_platform}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge 
                          variant={
                            user.activity_status === 'Active' ? 'default' :
                            user.activity_status === 'Recent' ? 'secondary' : 
                            'outline'
                          }
                          className="text-xs"
                        >
                          {user.activity_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <p className="text-sm">{user.total_activities || 0}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}