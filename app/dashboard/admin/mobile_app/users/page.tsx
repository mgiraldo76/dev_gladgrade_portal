// File: app/dashboard/admin/mobile_app/users/page.tsx
// Path: app/dashboard/admin/mobile_app/users/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Activity,
  MessageSquare,
  Eye,
  Mail,
  Phone,
  Smartphone
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/app/providers"

interface FilteredUser {
  id: number
  email: string
  firstname: string
  lastname: string
  telephone: string
  firebaseuid: string
  datecreated: string
  lastloginat: string
  isguest: boolean
  last_activity: string
  latest_platform: string
  total_activities: number
  activity_status: 'Active' | 'Recent' | 'Inactive'
}

export default function FilteredUsersPage() {
  const { role, permissions } = useAuth()
  const searchParams = useSearchParams()
  
  // Check permissions
  const hasPermission = (requiredPermissions: string[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    return requiredPermissions.some(permission => permissions.includes(permission))
  }
  
  const hasAccess = role === 'super_admin' || role === 'admin' || hasPermission(['advanced_reports'])

  // Extract filter parameters from URL
  const filterDate = searchParams.get('date')
  const filterType = searchParams.get('type') // 'registrations' or 'active'
  const eventType = searchParams.get('event')
  const eventCategory = searchParams.get('category')

  const [users, setUsers] = useState<FilteredUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  // Determine page title and description based on filters
  const getPageInfo = () => {
    if (filterDate && filterType === 'registrations') {
      return {
        title: `Users Registered on ${new Date(filterDate).toLocaleDateString()}`,
        description: 'Users who created accounts on this specific date'
      }
    } else if (filterDate && filterType === 'active') {
      return {
        title: `Active Users on ${new Date(filterDate).toLocaleDateString()}`,
        description: 'Users who had activity on this specific date'
      }
    } else if (eventType) {
      return {
        title: `Users with ${eventType} Activity`,
        description: eventCategory ? `${eventType} events in ${eventCategory} category` : `All ${eventType} events`
      }
    }
    
    return {
      title: 'Filtered Users',
      description: 'Users matching selected criteria'
    }
  }

  const pageInfo = getPageInfo()

  // Load filtered users
  const loadFilteredUsers = async () => {
    setLoading(true)
    try {
      let apiParams: any = {
        limit: 100, // Show more results for drill-down
        search: searchTerm || undefined
      }

      // Apply date-based filtering
      if (filterDate) {
        if (filterType === 'registrations') {
          // Users registered on specific date - use just the date part, not full timestamp
          const dateOnly = filterDate.split('T')[0] // Extract YYYY-MM-DD from YYYY-MM-DDTHH:mm:ss.sssZ
          apiParams.dateFrom = dateOnly
          apiParams.dateTo = dateOnly
          
          console.log(`Filtering users registered on date: ${dateOnly}`)
        } else if (filterType === 'active') {
          // Users active on specific date - this requires a different endpoint
          // We'll need to create a backend endpoint for activity-based filtering
          apiParams.activityDate = filterDate.split('T')[0]
          
          console.log(`Filtering users active on date: ${filterDate.split('T')[0]}`)
        }
      }

      console.log('API Parameters:', apiParams)

      const result = await apiClient.mobileAdmin.getUserDetails(apiParams)

      if (result.success) {
        setUsers(result.data.users)
        setTotalCount(result.data.pagination.total)
        console.log(`Found ${result.data.users.length} users matching criteria`)
      }
    } catch (error) {
      console.error("Error loading filtered users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasAccess) {
      loadFilteredUsers()
    }
  }, [hasAccess, filterDate, filterType, eventType, searchTerm])

  // Navigate to individual user details
  const viewUserDetails = (userId: number) => {
    window.location.href = `/dashboard/admin/mobile_app/user-profile/${userId}`
  }

  // Navigate to user's reviews in moderation
  const viewUserReviews = (userEmail: string) => {
    window.location.href = `/dashboard/moderation?search=${encodeURIComponent(userEmail)}`
  }

  // Access denied screen
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ArrowLeft className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need Advanced Reports permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/mobile_app">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{pageInfo.title}</h1>
          <p className="text-muted-foreground">{pageInfo.description}</p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Filter Date:</strong> {filterDate || 'None'}</p>
              <p><strong>Filter Type:</strong> {filterType || 'None'}</p>
              <p><strong>Date Only:</strong> {filterDate ? filterDate.split('T')[0] : 'None'}</p>
              <p><strong>Total Users Found:</strong> {totalCount}</p>
              <p><strong>Users Displayed:</strong> {users.length}</p>
              <p><strong>Search Term:</strong> {searchTerm || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, phone, or Firebase ID..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {users.length} of {totalCount} shown
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">
                        {user.firstname} {user.lastname}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
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
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Joined {new Date(user.datecreated).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span>{user.total_activities || 0} activities</span>
                  </div>

                  {user.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{user.telephone}</span>
                    </div>
                  )}

                  {user.latest_platform && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3 w-3 text-muted-foreground" />
                      <span>{user.latest_platform}</span>
                    </div>
                  )}
                </div>

                {/* Firebase UID */}
                {user.firebaseuid && (
                  <div className="text-xs text-muted-foreground font-mono">
                    Firebase: {user.firebaseuid.substring(0, 12)}...
                  </div>
                )}

                {/* Guest Badge */}
                {user.isguest && (
                  <Badge variant="outline" className="text-xs">Guest User</Badge>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => viewUserDetails(user.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Profile
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => viewUserReviews(user.email)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found matching the criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}