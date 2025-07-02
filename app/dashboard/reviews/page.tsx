// File: app/dashboard/reviews/page.tsx
// Enhanced Reviews Dashboard with filtering, pagination, and role-based access

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

export default function ReviewsPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [reviews, setReviews] = useState<Review[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  
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

  // Load clients for filter dropdown (admin users only)
  useEffect(() => {
    if (canViewAllReviews) {
      loadClients()
    }
  }, [canViewAllReviews])

  // Load reviews when filters change
  useEffect(() => {
    loadReviews()
  }, [currentPage, filters])

  // Load stats when client/place changes
  useEffect(() => {
    if (filters.placeId) {
      loadReviewStats()
    }
  }, [filters.placeId])

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

      const response = await fetch(`/api/gcloud-proxy/review-count?placeId=${filters.placeId}`, { headers })
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

      const response = await fetch(`/api/gcloud-proxy/reviews/query`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          page: currentPage,
          limit: reviewsPerPage,
          placeId: filters.placeId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          hasImages: filters.hasImages,
          ratingRange: filters.ratingRange,
          search: filters.searchText,
          clientId: filters.clientId
        })
      })
      
      if (response.ok) {
        const data = await response.json()

        console.log('✅ Reviews API Response:', data)
        console.log('✅ Setting reviews:', data.data?.reviews)
        console.log('✅ Setting totalCount:', data.data?.totalCount)
        
        setReviews(data.data?.reviews || [])
        setTotalCount(data.data?.totalCount || 0)
        setTotalPages(Math.ceil((data.data?.totalCount || 0) / reviewsPerPage))
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
    if (rating >= 9) return 'text-green-600'
    if (rating >= 7) return 'text-yellow-600'
    return 'text-red-600'
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

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Customer Reviews</h1>
          <div className="flex items-center gap-2 mt-1">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">
              {isClientUser ? 'Your Business Reviews' : 'Platform Review Management'}
            </span>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.total_reviews}</div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.average_rating || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.rating_breakdown.good}</div>
                <div className="text-xs text-gray-600">Good (9-10)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.rating_breakdown.mediocre}</div>
                <div className="text-xs text-gray-600">Mediocre (7-8)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.rating_breakdown.poor}</div>
                <div className="text-xs text-gray-600">Poor (0-6)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Client Filter - Only for admin users */}
            {canViewAllReviews && (
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={filters.clientId || "all"} onValueChange={(value) => handleFilterChange('clientId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            
            {/* Has Images Filter */}
            <div>
              <label className="text-sm font-medium">Images</label>
              <Select value={filters.hasImages || "all"} onValueChange={(value) => handleFilterChange('hasImages', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reviews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="true">With Images</SelectItem>
                  <SelectItem value="false">Without Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Rating Range Filter */}
            <div>
              <label className="text-sm font-medium">Rating Range</label>
              <Select value={filters.ratingRange || "all"} onValueChange={(value) => handleFilterChange('ratingRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="0-6">Poor (0-6)</SelectItem>
                  <SelectItem value="7-8">Mediocre (7-8)</SelectItem>
                  <SelectItem value="9-10">Good (9-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Text */}
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search reviews..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {reviews.length} of {totalCount} reviews
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No reviews found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRatingBadgeVariant(review.ratingValue)}>
                        <Star className="h-3 w-3 mr-1" />
                        {review.ratingValue}/10
                      </Badge>
                      <div>
                        <div className="font-medium">{review.placeName}</div>
                        <div className="text-sm text-gray-600">{review.placeAddress}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        {review.author}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(review.reviewCreatedDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-700">{review.review}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {review.subcategory && (
                        <Badge variant="outline" className="text-xs">
                          {review.subcategory}
                        </Badge>
                      )}
                      {review.hasImages && (
                        <Badge variant="outline" className="text-xs">
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
          <div className="text-sm text-gray-600">
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