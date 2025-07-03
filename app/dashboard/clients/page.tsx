// Update the existing clients page to include real review counts
// Add these imports and modify the existing page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building, MapPin, Star, Calendar, User, Phone, Globe, Shield, TrendingUp, MessageSquare, ExternalLink, BadgeCheck, CheckCircle, XCircle, Users } from 'lucide-react'
import { apiClient } from "@/lib/api-client"
import { EditClientModal } from "@/components/edit-client-modal"
import { useAuth } from "@/app/providers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMultipleGCSGScores, cleanupGCSGCache } from "@/lib/gcsg-utils"
import Link from "next/link"
import { getAuth } from 'firebase/auth'

// Add this interface for review counts
interface ReviewCounts {
  [placeId: string]: {
    total_reviews: number
    total_ratings: number
    average_rating: string | null
    recent_reviews: number
    reviews_with_images: number
  }
}

export default function ClientsPage() {
  const { role, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>("business_name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showInactive, setShowInactive] = useState(false) // NEW: Hide inactive by default
  const [gcsgScores, setGcsgScores] = useState<Map<string, any>>(new Map())
  const [loadingGCSG, setLoadingGCSG] = useState(false)
  
  // NEW: Review counts state
  const [reviewCounts, setReviewCounts] = useState<ReviewCounts>({})
  const [loadingReviews, setLoadingReviews] = useState(false)

  type SortField = "business_name" | "industry_category_name" | "datecreated"

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Load review counts for all clients
  const loadReviewCounts = async (clientList: any[]) => {
    setLoadingReviews(true)
    try {
      // Get all place IDs from clients
      const placeIds = clientList
        .filter(client => client.place_id)
        .map(client => client.place_id)
      
      if (placeIds.length > 0) {
        console.log(`📊 Loading review counts for ${placeIds.length} clients with place IDs`)
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        // Get Firebase token (same as gcsg-utils.ts)
        const auth = getAuth()
        const currentUser = auth.currentUser
        if (currentUser) {
          const token = await currentUser.getIdToken()
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch('/api/gcloud-proxy/review-counts-bulk', {
          method: 'POST',
          headers,
          body: JSON.stringify({ placeIds })
        })

        if (response.ok) {
          const data = await response.json()
          setReviewCounts(data.data || {})
          console.log(`✅ Loaded review counts for ${Object.keys(data.data || {}).length} places`)
        } else {
          console.error('Failed to load review counts:', response.status)
          setReviewCounts({})
        }
      } else {
        console.log("ℹ️ No clients have place IDs for review lookup")
        setReviewCounts({})
      }
    } catch (error) {
      console.error("❌ Error loading review counts:", error)
      setReviewCounts({})
    } finally {
      setLoadingReviews(false)
    }
  }

  // Load GCSG scores
  const loadGCSGScores = async (clientList: any[]) => {
    setLoadingGCSG(true)
    try {
      cleanupGCSGCache()
      const placeIds = clientList
        .filter(client => client.place_id)
        .map(client => client.place_id)
      
      if (placeIds.length > 0) {
        console.log(`🎯 Loading GCSG scores for ${placeIds.length} clients with place IDs`)
        const scores = await getMultipleGCSGScores(placeIds)
        setGcsgScores(scores)
        console.log(`✅ Loaded ${scores.size} GCSG scores`)
      } else {
        console.log("ℹ️ No clients have place IDs for GCSG lookup")
        setGcsgScores(new Map())
      }
    } catch (error) {
      console.error("❌ Error loading GCSG scores:", error)
      setGcsgScores(new Map())
    } finally {
      setLoadingGCSG(false)
    }
  }

  // Helper function to get review count display
  const getReviewCountDisplay = (client: any) => {
    if (!client.place_id) {
      return { count: "N/A", className: "text-gray-400", tooltip: "No Place ID available" }
    }
    
    if (loadingReviews) {
      return { count: "...", className: "text-gray-400", tooltip: "Loading review count" }
    }
    
    const reviewData = reviewCounts[client.place_id]
    if (!reviewData) {
      return { count: "0", className: "text-gray-600", tooltip: "No reviews found" }
    }
    
    const count = reviewData.total_reviews.toString()
    const className = reviewData.total_reviews > 0 ? "text-blue-600 hover:text-blue-800 cursor-pointer" : "text-gray-600"
    const tooltip = `${reviewData.total_reviews} reviews • Avg: ${reviewData.average_rating || 'N/A'} • Recent: ${reviewData.recent_reviews}`
    
    return { count, className, tooltip }
  }

  // Helper function to get GCSG display
  const getGCSGDisplay = (client: any) => {
    if (!client.place_id) {
      return { score: "N/A", className: "text-gray-400", tooltip: "No Place ID available" }
    }
    
    if (loadingGCSG) {
      return { score: "...", className: "text-gray-400", tooltip: "Loading GCSG score" }
    }
    
    const gcsgData = gcsgScores.get(client.place_id)
    if (!gcsgData) {
      return { score: "N/A", className: "text-gray-400", tooltip: "GCSG score not available" }
    }
    
    if (gcsgData.error) {
      return { score: "Error", className: "text-red-500", tooltip: `Error: ${gcsgData.error}` }
    }
    
    if (gcsgData.score === null) {
      return { score: "N/A", className: "text-gray-400", tooltip: "No GCSG score found" }
    }
    
    let className = "text-gray-600"
    if (gcsgData.score >= 800) className = "text-green-600 font-semibold"
    else if (gcsgData.score >= 700) className = "text-green-500"
    else if (gcsgData.score >= 600) className = "text-yellow-600"
    else if (gcsgData.score >= 500) className = "text-orange-500"
    else className = "text-red-500"
    
    const tooltip = `GCSG Score: ${gcsgData.score}${gcsgData.cached ? ' (cached)' : ''}`
    
    return { score: gcsgData.score.toString(), className, tooltip }
  }

  // Load clients on component mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      console.log("📊 Loading business clients...")
  
      const response = await apiClient.getClients()
      if (response.success) {
        setClients(response.data)
        console.log("✅ Clients loaded:", response.data.length)

        // Load both GCSG scores and review counts
        await Promise.all([
          loadGCSGScores(response.data),
          loadReviewCounts(response.data)
        ])
      }
    } catch (error) {
      console.error("❌ Error loading clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageClient = (client: any) => {
    setSelectedClient(client)
    setIsClientModalOpen(true)
  }

  const handleClientUpdated = () => {
    loadClients() // Reload the clients list
  }

  // NEW: Filter to hide inactive clients by default
  const filteredClients = clients
    .filter((client) => {
      // Hide inactive clients unless explicitly shown
      if (!showInactive && !client.isactive) {
        return false
      }

      // Search filter
      const searchMatch = 
        client.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.business_address?.toLowerCase().includes(searchTerm.toLowerCase())

      // Sector filter
      const sectorMatch = sectorFilter === "all" || client.industry_category_name === sectorFilter

      // Status filter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "verified" && client.isverified) ||
        (statusFilter === "active" && client.isactive) ||
        (statusFilter === "pending" && !client.isverified)

      return searchMatch && sectorMatch && statusMatch
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "datecreated") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Get unique sectors for filter dropdown
  const uniqueSectors = [...new Set(clients.map(c => c.industry_category_name).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Business Clients</h1>
          <div className="flex items-center gap-2 mt-1">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">GladGrade Portal Management</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Claim Business
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              loadGCSGScores(clients)
              loadReviewCounts(clients)
            }}
            disabled={loadingGCSG || loadingReviews}
          >
            {(loadingGCSG || loadingReviews) ? "Loading..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by business name, contact, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* NEW: Show Inactive Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showInactive" className="text-sm text-gray-700">
                Show Inactive
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const reviewDisplay = getReviewCountDisplay(client)
          const gcsgDisplay = getGCSGDisplay(client)
          
          return (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{client.business_name || "Unnamed Business"}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {client.contact_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{client.contact_name}</span>
                          </div>
                        )}
                        {client.contact_email && (
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>{client.contact_email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {client.business_address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {client.business_address}
                              {client.city && `, ${client.city}`}
                              {client.state && `, ${client.state}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* GCSG Score */}
                    <div className="text-center">
                      <div 
                        className={`text-2xl font-bold ${gcsgDisplay.className}`}
                        title={gcsgDisplay.tooltip}
                      >
                        {gcsgDisplay.score}
                      </div>
                      <div className="text-xs text-gray-500">
                        GCSG Score
                        {client.place_id && gcsgScores.get(client.place_id)?.cached && (
                          <span className="text-blue-500 ml-1" title="Cached result">📋</span>
                        )}
                      </div>
                    </div>

                    {/* Reviews - NOW CLICKABLE */}
                    <div className="text-center">
                      {client.place_id && reviewDisplay.count !== "N/A" && reviewDisplay.count !== "..." ? (
                        <Link 
                          href={`/dashboard/reviews?clientId=${client.id}&placeId=${client.place_id}`}
                          className={reviewDisplay.className}
                          title={reviewDisplay.tooltip}
                        >
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-semibold">{reviewDisplay.count}</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </Link>
                      ) : (
                        <div 
                          className={reviewDisplay.className}
                          title={reviewDisplay.tooltip}
                        >
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-semibold">{reviewDisplay.count}</span>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Reviews
                        {loadingReviews && (
                          <span className="text-blue-500 ml-1" title="Loading...">⏳</span>
                        )}
                      </div>
                    </div>
                    {/*
                    * Star Rating *
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">
                          {client.place_id && reviewCounts[client.place_id]?.average_rating || "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Avg Rating</div>
                    </div>
                    */}

                   
{/* Status Icons - Professional & Clear */}
<div className="flex flex-col gap-3 items-center">
  {/* Verification Status */}
  <div className="relative group">
    {client.claim_status === "verified" ? (
      <Shield className="h-5 w-5 text-green-500 cursor-pointer fill-current" />
    ) : client.claim_status === "pending" ? (
      <Shield className="h-5 w-5 text-orange-400 cursor-pointer fill-current" />
    ) : client.claim_status === "claimed" ? (
      <Shield className="h-5 w-5 text-purple-300 cursor-pointer fill-current" />
    ) : client.claim_status === "rejected" ? (
      <Shield className="h-5 w-5 text-red-500 cursor-pointer fill-current" />
    ) : (
      <Shield className="h-5 w-5 text-gray-300 cursor-pointer fill-current" />
    )}
    {/* Tooltip */}
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
      {client.claim_status === "verified" ? "Verified" : 
       client.claim_status === "pending" ? "Pending Verification" : 
       client.claim_status === "claimed" ? "Claimed" :
       client.claim_status === "rejected" ? "Rejected" :
       "Unclaimed"}
    </div>
  </div>

  {/* Activity Status */}
  <div className="relative group">
    {client.isactive ? (
      <CheckCircle className="h-5 w-5 text-green-500 cursor-pointer" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500 cursor-pointer" />
    )}
    {/* Tooltip */}
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
      {client.isactive ? "Active" : "Inactive"}
    </div>
  </div>
</div>


                    {/* Sales Rep */}
                    <div className="text-right">
                      <div className="text-sm font-medium">{client.sales_rep_name || "Unassigned"}</div>
                      <div className="text-xs text-gray-500">Sales Representative</div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleManageClient(client)}>
                        Manage
                      </Button>
                      {client.website && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={client.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Type and Additional Info */}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>Industry: {client.industry_category_name || "Not specified"}</span>
                  {client.business_description && <span>• {client.business_description.substring(0, 100)}...</span>}
                  {!client.isactive && <span className="text-red-600">• INACTIVE</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Client Edit Modal */}
      <EditClientModal
        client={selectedClient}
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false)
          setSelectedClient(null)
        }}
        onSuccess={handleClientUpdated}
        userRole={role || ""}
      />

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredClients.length}</div>
                <div className="text-sm text-gray-600">
                  {showInactive ? "Total Clients" : "Active Clients"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredClients.filter((c) => c.claim_status === "verified").length}
                </div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(reviewCounts).reduce((sum, counts) => sum + counts.total_reviews, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {clients.length > 0
                    ? Math.round(clients.reduce((sum, c) => {
                        const gcsgData = gcsgScores.get(c.place_id)
                        return sum + (gcsgData?.score || 0)
                      }, 0) / clients.filter(c => gcsgScores.get(c.place_id)?.score).length) || 0
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg GCSG</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}