// File: app/dashboard/reviews/page.tsx
// Enhanced Reviews Dashboard with filtering, pagination, and role-based access
// FIXED: Added client user filtering by businessId + Applied Golden Theme

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Star, User, MessageSquare, Image, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuth } from "@/app/providers"
import { useSearchParams, useRouter } from "next/navigation"
import { getAuth } from 'firebase/auth'


interface Review {
  id: string
  ratingId: string
  ratingValue: number
  review: string
  placeName: string
  placeId: string
  placeAddress: string
  author: string
  reviewCreatedDate: string
  subcategory: string
  hasImages: boolean
  imageCount: number
}

interface ReviewStats {
  total_reviews: number
  total_ratings: number
  average_rating: string | null
  rating_breakdown: {
    poor: number
    mediocre: number
    good: number
  }
  recent_reviews: number
  reviews_with_images: number
}

interface Client {
  id: number
  business_name: string
  place_id: string
}

// NEW: Interface for business locations
interface BusinessLocation {
  id: number
  place_id: string
  location_name: string
  is_primary: boolean
}

export default function ReviewsPage() {
  const { user, role, businessId } = useAuth() // NEW: Get businessId from context
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [reviews, setReviews] = useState<Review[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // NEW: State for client's business locations and place IDs
  const [clientBusinessLocations, setClientBusinessLocations] = useState<BusinessLocation[]>([])
  const [clientPlaceIds, setClientPlaceIds] = useState<string[]>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const reviewsPerPage = 10
  
  // Filter state
  const [filters, setFilters] = useState({
    clientId: searchParams?.get('clientId') || '',
    placeId: searchParams?.get('placeId') || '',
    dateFrom: searchParams?.get('dateFrom') || '',
    dateTo: searchParams?.get('dateTo') || '',
    hasImages: searchParams?.get('hasImages') || '',
    ratingRange: searchParams?.get('ratingRange') || '',
    searchText: searchParams?.get('search') || ''
  })
  
  // Determine access level based on role
  const isClientUser = role === 'client'
  const canViewAllReviews = ['super_admin', 'admin', 'employee', 'moderator'].includes(role || '')

  // NEW: Load client's business locations if they're a client user
  useEffect(() => {
    if (isClientUser && businessId) {
      loadClientBusinessLocations()
    }
  }, [isClientUser, businessId])

  // Load clients for filter dropdown (admin users only)
  useEffect(() => {
    if (canViewAllReviews) {
      loadClients()
    }
  }, [canViewAllReviews])

  // Load reviews when filters change
  useEffect(() => {
    loadReviews()
  }, [currentPage, filters, clientPlaceIds]) // NEW: Add clientPlaceIds dependency

  // Load stats when client/place changes
  useEffect(() => {
    if (filters.placeId) {
      loadReviewStats()
    } else if (isClientUser && clientPlaceIds.length > 0) {
      // NEW: Load stats for client's primary location if no specific place selected
      const primaryLocation = clientBusinessLocations.find(loc => loc.is_primary)
      const defaultPlaceId = primaryLocation?.place_id || clientPlaceIds[0]
      if (defaultPlaceId) {
        loadReviewStatsForPlace(defaultPlaceId)
      }
    }
  }, [filters.placeId, isClientUser, clientPlaceIds, clientBusinessLocations])

  // NEW: Load client's business locations using client-accessible endpoint
  const loadClientBusinessLocations = async () => {
    if (!businessId) return
    
    try {
      console.log('🏢 Loading business locations for client:', businessId)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add Firebase auth token for client authentication
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      // Use the corrected client-accessible endpoint  
      const response = await fetch(`/api/clients/${businessId}/locations`, { headers })
      if (response.ok) {
        const data = await response.json()
        const locations = data.data || []
        
        setClientBusinessLocations(locations)
        
        // Extract place IDs for filtering
        const placeIds = locations
          .filter((loc: BusinessLocation) => loc.place_id)
          .map((loc: BusinessLocation) => loc.place_id)
        
        setClientPlaceIds(placeIds)
        
        console.log('✅ Client business locations loaded:', locations)
        console.log('✅ Client place IDs:', placeIds)
      } else {
        console.error('❌ Failed to load client business locations:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error loading client business locations:', error)
    }
  }

  const loadClients = async () => {
    try {
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const response = await fetch('/api/clients', { headers })
      if (response.ok) {
        const data = await response.json()
        setClients(data.data || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadReviewStats = async () => {
    if (!filters.placeId) return
    loadReviewStatsForPlace(filters.placeId)
  }

  // NEW: Load stats for a specific place ID
  const loadReviewStatsForPlace = async (placeId: string) => {
    setLoadingStats(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/gcloud-proxy/review-count?placeId=${placeId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error loading review stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadReviews = async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      // NEW: Build request body with client filtering
      const requestBody: any = {
        page: currentPage,
        limit: reviewsPerPage,
        placeId: filters.placeId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        hasImages: filters.hasImages,
        ratingRange: filters.ratingRange,
        search: filters.searchText,
        clientId: filters.clientId
      }

      // NEW: Client user filtering - restrict to their place IDs only
      if (isClientUser && clientPlaceIds.length > 0) {
        console.log('🔒 Applying client filtering for place IDs:', clientPlaceIds)
        
        // If no specific place filter is set, use the client's place ID
        if (!filters.placeId) {
          // For client users, default to their primary location's place ID
          const primaryLocation = clientBusinessLocations.find(loc => loc.is_primary)
          const defaultPlaceId = primaryLocation?.place_id || clientPlaceIds[0]
          requestBody.placeId = defaultPlaceId
          console.log('🎯 Setting client place ID filter:', defaultPlaceId)
        } else {
          // Verify the selected place belongs to the client
          if (!clientPlaceIds.includes(filters.placeId)) {
            console.warn('⚠️ Client trying to access place they don\'t own:', filters.placeId)
            setReviews([])
            setLoading(false)
            return
          }
          console.log('🎯 Using client-selected place ID filter:', filters.placeId)
        }
        // Remove clientId filter for client users (they can only see their own)
        delete requestBody.clientId
      }

      console.log('📤 Review request body:', requestBody)

      const response = await fetch(`/api/gcloud-proxy/reviews/query`, { 
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()

        console.log('✅ Reviews API Response:', data)
        console.log('✅ Setting reviews:', data.data?.reviews)
        console.log('✅ Setting totalCount:', data.data?.pagination?.totalCount)
        
        setReviews(data.data?.reviews || [])
        setTotalCount(data.data?.pagination?.totalCount || 0)
        setTotalPages(Math.ceil((data.data?.pagination?.totalCount || 0) / reviewsPerPage))
      } else {
        console.error('Failed to load reviews:', response.status)
        setReviews([])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for the API
    const filterValue = value === "all" ? "" : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setCurrentPage(1) // Reset to first page when filters change
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams?.toString())
    if (filterValue) {
      newParams.set(key, filterValue)
    } else {
      newParams.delete(key)
    }
    router.push(`/dashboard/reviews?${newParams.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      clientId: '',
      placeId: '',
      dateFrom: '',
      dateTo: '',
      hasImages: '',
      ratingRange: '',
      searchText: ''
    })
    setCurrentPage(1)
    router.push('/dashboard/reviews')
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'text-green-600 dark:text-green-400'
    if (rating >= 7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRatingBadgeVariant = (rating: number) => {
    if (rating >= 9) return 'default'
    if (rating >= 7) return 'secondary'
    return 'destructive'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // NEW: Show loading state if client user and locations not loaded yet
  if (isClientUser && businessId && clientPlaceIds.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your business locations...</p>
        </div>
      </div>
    )
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Reviews</h1>
          <div className="flex items-center gap-2 mt-1">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              {isClientUser ? 'Your Business Reviews' : 'Platform Review Management'}
            </span>
            {/* NEW: Show client business info */}
            {isClientUser && clientBusinessLocations.length > 0 && (
              <span className="text-xs text-muted-foreground">
                • {clientBusinessLocations.length} location{clientBusinessLocations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Export Reviews
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.total_reviews}</div>
                  <div className="text-sm text-muted-foreground">Total Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.average_rating || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.rating_breakdown.good}</div>
                <div className="text-xs text-muted-foreground">Good (9-10)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.rating_breakdown.mediocre}</div>
                <div className="text-xs text-muted-foreground">Mediocre (7-8)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.rating_breakdown.poor}</div>
                <div className="text-xs text-muted-foreground">Poor (0-6)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Client Filter - Only for admin users, HIDDEN for client users */}
            {canViewAllReviews && (
              <div>
                <label className="text-sm font-medium text-foreground">Client</label>
                <Select value={filters.clientId || "all"} onValueChange={(value) => handleFilterChange('clientId', value)}>
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-black hover:bg-gray-100">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()} className="text-black hover:bg-gray-100">
                        {client.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* NEW: Location Filter - Only for client users with multiple locations */}
            {isClientUser && clientBusinessLocations.length > 1 && (
              <div>
                <label className="text-sm font-medium text-foreground">Location</label>
                <Select value={filters.placeId || "all"} onValueChange={(value) => handleFilterChange('placeId', value)}>
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-black hover:bg-gray-100">All Locations</SelectItem>
                    {clientBusinessLocations.map(location => (
                      <SelectItem key={location.id} value={location.place_id} className="text-black hover:bg-gray-100">
                        {location.location_name}
                        {location.is_primary && " (Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-foreground">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            
            {/* Has Images Filter */}
            <div>
              <label className="text-sm font-medium text-foreground">Images</label>
              <Select value={filters.hasImages || "all"} onValueChange={(value) => handleFilterChange('hasImages', value)}>
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue placeholder="All Reviews" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">All Reviews</SelectItem>
                  <SelectItem value="true" className="text-black hover:bg-gray-100">With Images</SelectItem>
                  <SelectItem value="false" className="text-black hover:bg-gray-100">Without Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Rating Range Filter */}
            <div>
              <label className="text-sm font-medium text-foreground">Rating Range</label>
              <Select value={filters.ratingRange || "all"} onValueChange={(value) => handleFilterChange('ratingRange', value)}>
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">All Ratings</SelectItem>
                  <SelectItem value="0-6" className="text-black hover:bg-gray-100">Poor (0-6)</SelectItem>
                  <SelectItem value="7-8" className="text-black hover:bg-gray-100">Mediocre (7-8)</SelectItem>
                  <SelectItem value="9-10" className="text-black hover:bg-gray-100">Good (9-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Text */}
            <div>
              <label className="text-sm font-medium text-foreground">Search</label>
              <Input
                placeholder="Search reviews..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {reviews.length} of {totalCount} reviews
              {/* NEW: Show filtering info for client users */}
              {isClientUser && (
                <span className="text-primary">
                  {" "}• Filtered for your business
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Reviews ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium text-foreground">No reviews found</p>
              <p className="text-sm">
                {isClientUser 
                  ? "No reviews found for your business locations" 
                  : "Try adjusting your filters or check back later"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRatingBadgeVariant(review.ratingValue)}>
                        <Star className="h-3 w-3 mr-1" />
                        {review.ratingValue}/10
                      </Badge>
                      <div>
                        <div className="font-medium text-foreground">{review.placeName}</div>
                        <div className="text-sm text-muted-foreground">{review.placeAddress}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {review.author}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(review.reviewCreatedDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-foreground">{review.review}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {review.subcategory && (
                        <Badge variant="outline" className="text-xs border-border">
                          {review.subcategory}
                        </Badge>
                      )}
                      {review.hasImages && (
                        <Badge variant="outline" className="text-xs border-border">
                          <Image className="h-3 w-3 mr-1" />
                          {review.imageCount || 1} image{(review.imageCount || 1) > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {canViewAllReviews && (
                        <Button variant="outline" size="sm">
                          Moderate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}