// File: app/dashboard/reviews/page.tsx
// Path: app/dashboard/reviews/page.tsx
// FIXED: Reviews Dashboard filtering logic and client-side filtering

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Star, User, MessageSquare, Image, Filter, ChevronLeft, ChevronRight, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useAuth } from "@/app/providers"
import { useSearchParams, useRouter } from "next/navigation"
import { getAuth } from 'firebase/auth'
import { ReviewDetailsModal } from "@/components/review-details-modal"


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
  isPrivate?: boolean
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

interface BusinessLocation {
  id: number
  place_id: string
  location_name: string
  is_primary: boolean
}

export default function ReviewsPage() {
  const { user, role, businessId } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [allReviews, setAllReviews] = useState<Review[]>([]) // NEW: Store all reviews
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]) // NEW: Store filtered reviews
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]) // NEW: Store paginated reviews
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  
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
    searchText: searchParams?.get('search') || '',
    privacyFilter: searchParams?.get('privacyFilter') || 'all'
  })
  
  // NEW: Review Details Modal state
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  
  // Determine access level based on role
  const isClientUser = role === 'client'
  const canViewAllReviews = ['super_admin', 'admin', 'employee', 'moderator'].includes(role || '')

  // Load client's business locations if they're a client user
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

  // Load reviews when dependencies change
  useEffect(() => {
    loadReviews()
  }, [clientPlaceIds, isClientUser, canViewAllReviews])

  // NEW: Apply filters whenever filters or allReviews change
  useEffect(() => {
    applyFilters()
  }, [filters, allReviews])

  // NEW: Update pagination when filtered reviews change
  useEffect(() => {
    updatePagination()
  }, [filteredReviews, currentPage])

  // Load stats when client/place changes
  useEffect(() => {
    if (filters.placeId) {
      loadReviewStats()
    } else if (isClientUser && clientPlaceIds.length > 0) {
      const primaryLocation = clientBusinessLocations.find(loc => loc.is_primary)
      const defaultPlaceId = primaryLocation?.place_id || clientPlaceIds[0]
      if (defaultPlaceId) {
        loadReviewStatsForPlace(defaultPlaceId)
      }
    }
  }, [filters.placeId, isClientUser, clientPlaceIds, clientBusinessLocations])

  // NEW: Client-side filtering logic
  const applyFilters = () => {
    let filtered = [...allReviews]

    // Privacy filter
    if (filters.privacyFilter === 'private') {
      filtered = filtered.filter(review => review.isPrivate === true)
    } else if (filters.privacyFilter === 'public') {
      filtered = filtered.filter(review => review.isPrivate === false)
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(review => new Date(review.reviewCreatedDate) >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + ' 23:59:59')
      filtered = filtered.filter(review => new Date(review.reviewCreatedDate) <= toDate)
    }

    // Images filter
    if (filters.hasImages === 'true') {
      filtered = filtered.filter(review => review.hasImages === true)
    } else if (filters.hasImages === 'false') {
      filtered = filtered.filter(review => review.hasImages === false)
    }

    // Rating range filter
    if (filters.ratingRange) {
      const [minRating, maxRating] = filters.ratingRange.split('-').map(r => parseInt(r, 10))
      if (!isNaN(minRating) && !isNaN(maxRating)) {
        filtered = filtered.filter(review => 
          review.ratingValue >= minRating && review.ratingValue <= maxRating
        )
      }
    }

    // Search text filter
    if (filters.searchText && filters.searchText.trim()) {
      const searchTerm = filters.searchText.trim().toLowerCase()
      filtered = filtered.filter(review =>
        review.review.toLowerCase().includes(searchTerm) ||
        review.placeName.toLowerCase().includes(searchTerm) ||
        review.author.toLowerCase().includes(searchTerm) ||
        review.placeAddress.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredReviews(filtered)
    setTotalCount(filtered.length)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // NEW: Update pagination and displayed reviews
  const updatePagination = () => {
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)
    setTotalPages(totalPages)
    
    const startIndex = (currentPage - 1) * reviewsPerPage
    const endIndex = startIndex + reviewsPerPage
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex)
    
    setDisplayedReviews(paginatedReviews)
  }

  const loadClientBusinessLocations = async () => {
    if (!businessId) return
    
    try {
      console.log('🏢 Loading business locations for client:', businessId)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/clients/${businessId}/locations`, { headers })
      if (response.ok) {
        const data = await response.json()
        const locations = data.data || []
        
        setClientBusinessLocations(locations)
        
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

      const includePrivateParam = (isClientUser || canViewAllReviews) ? '&includePrivate=true' : ''
      const response = await fetch(`/api/gcloud-proxy/review-count?placeId=${placeId}${includePrivateParam}`, { headers })
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

      // FIXED: Build request body - load ALL reviews, then filter client-side
      const requestBody: any = {
        includePrivate: isClientUser || canViewAllReviews,  // Include private reviews for authorized users
      }

      // Client user filtering - restrict to their place IDs only
      if (isClientUser && clientPlaceIds.length > 0) {
        console.log('🔒 Applying client filtering for place IDs:', clientPlaceIds)
        
        if (!filters.placeId) {
          const primaryLocation = clientBusinessLocations.find(loc => loc.is_primary)
          const defaultPlaceId = primaryLocation?.place_id || clientPlaceIds[0]
          requestBody.placeId = defaultPlaceId
          console.log('🎯 Setting client place ID filter:', defaultPlaceId)
        } else {
          if (!clientPlaceIds.includes(filters.placeId)) {
            console.warn('⚠️ Client trying to access place they don\'t own:', filters.placeId)
            setAllReviews([])
            setLoading(false)
            return
          }
          requestBody.placeId = filters.placeId
          console.log('🎯 Using client-selected place ID filter:', filters.placeId)
        }
      }

      // For admin users, apply place/client filters if set
      if (canViewAllReviews) {
        if (filters.placeId) {
          requestBody.placeId = filters.placeId
        }
        if (filters.clientId) {
          requestBody.clientId = filters.clientId
        }
      }

      console.log('📤 Review request body:', requestBody)

      const response = await fetch(`/api/gcloud-proxy/consumerReviews/query`, { 
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()

        console.log('✅ Reviews API Response:', data)
        
        const reviewsData = data.data || []
        const formattedReviews = reviewsData.map((review: any) => {
          // Debug logging to see what we're getting
          console.log('Raw review data:', {
            id: review.id,
            ratingvalue: review.ratingvalue,
            ratingValue: review.ratingValue,
            placename: review.placename,
            placeName: review.placeName,
            allFields: Object.keys(review)
          })

          return {
            id: review.id?.toString() || '',
            ratingId: review.consumerratingid?.toString() || '',
            // FIXED: Use the proper field from the joined consumerRatings table
            ratingValue: parseInt(review.ratingvalue, 10) || parseInt(review.ratingValue, 10) || 0,
            review: review.review || '',
            // FIXED: Use the proper fields from consumerRatings
            placeName: review.placename || review.placeName || 'Unknown Location',
            placeId: review.placeid || review.placeId || '',
            placeAddress: review.placeaddress || review.placeAddress || '',
            author: review.displayname || review.firstname || 'Anonymous',
            reviewCreatedDate: review.datecreated || '',
            subcategory: review.subcategory || '',
            hasImages: Boolean(review.hasimages),
            imageCount: review.imagecount || 0,
            isPrivate: Boolean(review.isprivate)
          }
        })
        
        setAllReviews(formattedReviews)
        console.log(`✅ Loaded ${formattedReviews.length} total reviews`)
        
      } else {
        console.error('Failed to load reviews:', response.status)
        setAllReviews([])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setAllReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" && key !== 'privacyFilter' ? "" : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams?.toString())
    if (filterValue && filterValue !== 'all') {
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
      searchText: '',
      privacyFilter: 'all'
    })
    setCurrentPage(1)
    router.push('/dashboard/reviews')
  }

  // NEW: Handle opening review details modal
  const handleViewDetails = (reviewId: string) => {
    setSelectedReviewId(reviewId)
    setIsReviewModalOpen(true)
  }

  // NEW: Handle closing review details modal
  const handleCloseModal = () => {
    setIsReviewModalOpen(false)
    setSelectedReviewId(null)
  }

  // NEW: Handle review updated (refresh data)
  const handleReviewUpdated = () => {
    loadReviews() // Reload all reviews to reflect changes
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

  // Show loading state if client user and locations not loaded yet
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

  if (loading) {
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
            {/* Client Filter - Only for admin users */}
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

            {/* Location Filter - For client users with multiple locations */}
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

            {/* Privacy Filter */}
            {(isClientUser || canViewAllReviews) && (
              <div>
                <label className="text-sm font-medium text-foreground">Privacy</label>
                <Select value={filters.privacyFilter} onValueChange={(value) => handleFilterChange('privacyFilter', value)}>
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue placeholder="All Reviews" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-black hover:bg-gray-100">All Reviews</SelectItem>
                    <SelectItem value="public" className="text-black hover:bg-gray-100">Public Only</SelectItem>
                    <SelectItem value="private" className="text-black hover:bg-gray-100">Private Only</SelectItem>
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
              Showing {displayedReviews.length} of {totalCount} reviews
              {isClientUser && (
                <span className="text-primary">
                  {" "}• Filtered for your business
                </span>
              )}
              {(isClientUser || canViewAllReviews) && filters.privacyFilter !== 'all' && (
                <span className="text-blue-600 dark:text-blue-400">
                  {" "}• {filters.privacyFilter === 'private' ? 'Private' : 'Public'} reviews only
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
          {displayedReviews.length === 0 ? (
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
              {displayedReviews.map((review) => (
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
                      {/* Privacy status badge */}
                      {review.isPrivate && (isClientUser || canViewAllReviews) && (
                        <Badge variant="outline" className="text-xs border-border bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {!review.isPrivate && (isClientUser || canViewAllReviews) && filters.privacyFilter === 'all' && (
                        <Badge variant="outline" className="text-xs border-border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(review.id)}
                      >
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
            Page {currentPage} of {totalPages} • {totalCount} total reviews
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

      {/* Review Details Modal */}
      <ReviewDetailsModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseModal}
        reviewId={selectedReviewId}
        onReviewUpdated={handleReviewUpdated}
      />
    </div>
  )
}