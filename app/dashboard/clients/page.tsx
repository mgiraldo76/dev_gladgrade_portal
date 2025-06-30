"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Building, MapPin, Star, Calendar, User, Phone, Globe, Shield, TrendingUp } from 'lucide-react'
import { apiClient } from "@/lib/api-client"
import { EditClientModal } from "@/components/edit-client-modal"
import { useAuth } from "@/app/providers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SortAsc, SortDesc, Filter } from "lucide-react"


export default function ClientsPage() {
  const { role } = useAuth() // Use role instead of user.role
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  //const [sortField, setSortField] = useState("business_name")
  const [sortField, setSortField] = useState<SortField>("business_name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  //const [sortDirection, setSortDirection] = useState("asc")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")


  type SortField = "business_name" | "industry_category_name" | "datecreated"

const handleSort = (field: SortField) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  } else {
    setSortField(field)
    setSortDirection("asc")
  }
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

  const filteredClients = clients
  .filter((client) => {
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

    // Handle date sorting
    if (sortField === "datecreated") {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    // Handle string sorting
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
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
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
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="unclaimed">Unclaimed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold"> {client.business_name  || "Unnamed Business"}</h3>
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
                    <div className="text-2xl font-bold text-primary">{client.gcsg_score || "N/A"}</div>
                    <div className="text-xs text-gray-500">GCSG Score</div>
                  </div>

                  {/* Reviews */}
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{client.average_rating || "N/A"}</span>
                    </div>
                    <div className="text-xs text-gray-500">{client.total_reviews || 0} reviews</div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-2">
                    <Badge variant={client.claim_status === "verified" ? "default" : "secondary"}>
                      {client.claim_status === "verified" ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        client.claim_status || "Unclaimed"
                      )}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={client.isactive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                    >
                      {client.isactive ? "Active" : "Inactive"}
                    </Badge>
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
                <span>Industry: {client.industry_category || "Not specified"}</span>
                {client.business_description && <span>• {client.business_description.substring(0, 100)}...</span>}
              </div>
            </CardContent>
          </Card>
        ))}
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
        userRole={role || ""} // Use role from auth context
      />

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-sm text-gray-600">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{clients.filter((c) => c.claim_status === "verified").length}</div>
                <div className="text-sm text-gray-600">Verified</div>
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
                    ? Math.round(clients.reduce((sum, c) => sum + (c.gcsg_score || 0), 0) / clients.length)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg GCSG</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + (c.total_reviews || 0), 0)}</div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
