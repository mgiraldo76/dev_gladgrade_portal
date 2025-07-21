// File: app/dashboard/reviews/page.tsx
// MINIMAL FIX: Only fix the rating display issue, keep everything else exactly the same

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
import { apiClient } from "@/lib/api-client"
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
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([])
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
  
  // Review Details Modal state
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

  // Apply filters whenever filters or allReviews change
  useEffect(() => {
    applyFilters()
  }, [filters, allReviews])

  // Update pagination when filtered reviews change
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

  const loadClientBusinessLocations = async () => {
    if (!businessId) return
    
    try {
      console.log('🏢 Loading business locations for client:', businessId)
      
      const response = await apiClient.getClientBusinessLocations(businessId)
      if (response.success) {
        const locations = response.data || []
        
        setClientBusinessLocations(locations)
        
        const placeIds = locations
          .filter((loc: BusinessLocation) => loc.place_id)
          .map((loc: BusinessLocation) => loc.place_id)
        
        setClientPlaceIds(placeIds)
        
        console.log('✅ Client business locations loaded:', locations)
        console.log('✅ Client place IDs:', placeIds)
      } else {
        console.error('❌ Failed to load client business locations:', response.error)
      }
    } catch (error) {
      console.error('❌ Error loading client business locations:', error)
    }
  }

  const loadClients = async () => {
    try {
      console.log('📊 Loading business clients...')
      
      const response = await apiClient.getClients()
      if (response.success) {
        setClients(response.data || [])
        console.log('✅ Clients loaded:', response.data?.length || 0)
      } else {
        console.error('❌ Failed to load clients:', response.error)
      }
    } catch (error) {
      console.error('❌ Error loading clients:', error)
    }
  }

  // FIXED: Enhanced data mapping to handle different API response formats
  const loadReviews = async () => {
    setLoading(true)
    try {
      console.log('🔍 Loading reviews...')
  
      const includePrivate = (isClientUser || canViewAllReviews)
      
      const requestParams: any = {
        includePrivate: includePrivate
      }
  
      if (filters.placeId && filters.placeId !== 'all') {
        requestParams.placeId = filters.placeId
      }
  
      console.log('🔍 Loading reviews with params:', requestParams)
  
      const response = await apiClient.queryReviews(requestParams)
      
      if (response.data) {
        console.log('✅ Raw API Response:', response.data?.[0]) // Debug log
        
        // FIXED: Enhanced data mapping to handle various API response formats
        const formattedReviews = (response.data || []).map((review: any) => {
          // Try to extract rating value from different possible fields
          const ratingValue = review.ratingValue || review.ratingvalue || review.rating_value || 0
          
          console.log(`🔍 Processing review ${review.id}: ratingValue=${ratingValue}`) // Debug log
          
          return {
            id: (review.id || '').toString(),
            ratingId: (review.ratingId || review.ratingid || review.consumerRatingId || '').toString(),
            ratingValue: parseInt(ratingValue, 10) || 0, // FIXED: Ensure it's a number
            review: review.review || '',
            placeName: review.placeName || review.placename || '',
            placeId: review.placeId || review.placeid || '',
            placeAddress: review.placeAddress || review.placeaddress || '',
            author: review.author || review.displayname || review.firstname || 'Anonymous',
            reviewCreatedDate: review.reviewCreatedDate || review.datecreated || '',
            subcategory: review.subcategory || '',
            hasImages: Boolean(review.hasImages || review.hasimages),
            imageCount: parseInt(review.imageCount || review.imagecount || 0, 10),
            isPrivate: Boolean(review.isPrivate || review.isprivate)
          }
        })
        
        console.log('✅ Formatted reviews sample:', formattedReviews[0]) // Debug log
        console.log(`✅ Reviews loaded: ${formattedReviews.length}`)
        setAllReviews(formattedReviews)
      } else {
        console.error('❌ Failed to load reviews:', response.error)
        setAllReviews([])
      }
    } catch (error) {
      console.error('❌ Error loading reviews:', error)
      setAllReviews([])
    } finally {
      setLoading(false)
    }
  }

  // Client-side filtering logic
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

  // Update pagination and displayed reviews
  const updatePagination = () => {
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)
    setTotalPages(totalPages)
    
    const startIndex = (currentPage - 1) * reviewsPerPage
    const endIndex = startIndex + reviewsPerPage
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex)
    
    setDisplayedReviews(paginatedReviews)
  }

  const loadReviewStats = async () => {
    if (!filters.placeId) return
    loadReviewStatsForPlace(filters.placeId)
  }

  const loadReviewStatsForPlace = async (placeId: string) => {
    setLoadingStats(true)
    try {
      console.log('📊 Loading review stats for place:', placeId)
      
      const response = await apiClient.getReviewCount({ placeId })
      
      if (response.success) {
        setStats(response.data)
        console.log('✅ Review stats loaded:', response.data)
      } else {
        console.error('❌ Failed to load review stats:', response.error)
      }
    } catch (error) {
      console.error('❌ Error loading review stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    if (value === 'all') {
      value = ''
    }
    setFilters(prev => ({ ...prev, [key]: value }))
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
  }

  const handleViewDetails = (reviewId: string) => {
    setSelectedReviewId(reviewId)
    setIsReviewModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'text-green-600 dark:text-green-400'
    if (rating >= 7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (rating >= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">
            {isClientUser 
              ? "View and manage your business reviews" 
              : "Monitor and moderate customer reviews"
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.total_reviews}</div>
                <div className="text-xs text-muted-foreground">Total Reviews</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats.average_rating || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Average Rating</div>
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

            {/* Date From */}
            <div>
              <label className="text-sm font-medium text-foreground">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium text-foreground">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>

            {/* Has Images */}
            <div>
              <label className="text-sm font-medium text-foreground">Images</label>
              <Select value={filters.hasImages || "all"} onValueChange={(value) => handleFilterChange('hasImages', value)}>
                <SelectTrigger className="bg-background text-foreground border-border">
                  <SelectValue placeholder="All Reviews" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">All Reviews</SelectItem>
                  <SelectItem value="true" className="text-black hover:bg-gray-100">With Images</SelectItem>
                  <SelectItem value="false" className="text-black hover:bg-gray-100">No Images</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating Range */}
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
                  ? "No reviews found for your business with the current filters"
                  : "Try adjusting your filters to see more reviews"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getRatingBadgeColor(review.ratingValue)}>
                        {review.ratingValue || 0}/10
                      </Badge>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{review.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.reviewCreatedDate)}
                        </span>
                      </div>
                      {review.hasImages && (
                        <div className="flex items-center gap-1">
                          <Image className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-blue-600">{review.imageCount || 1} image(s)</span>
                        </div>
                      )}
                      {review.isPrivate && (
                        <div className="flex items-center gap-1">
                          <EyeOff className="h-4 w-4 text-orange-600" />
                          <span className="text-xs text-orange-600">Private</span>
                        </div>
                      )}
                      {!review.isPrivate && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Public</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(review.id)}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Details
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-medium text-foreground">{review.placeName}</p>
                    {review.placeAddress && (
                      <p className="text-sm text-muted-foreground">{review.placeAddress}</p>
                    )}
                    {review.subcategory && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {review.subcategory}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-foreground leading-relaxed">
                      {review.review.length > 300 
                        ? `${review.review.substring(0, 300)}...`
                        : review.review
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Details Modal */}
      {selectedReviewId && (
        <ReviewDetailsModal
          reviewId={selectedReviewId}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false)
            setSelectedReviewId(null)
          }}
          onReviewUpdated={loadReviews}
        />
      )}
    </div>
  )
}