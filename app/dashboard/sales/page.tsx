// File: app/dashboard/sales/page.tsx
"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Target, TrendingUp, DollarSign, Grid, List, Edit, Search, SortAsc, SortDesc, X, Filter } from "lucide-react"
import { ProspectModal } from "@/components/prospect-modal"
import { ConversionModal } from "@/components/conversion-modal"
import { useAuth } from "@/app/providers"
import { EditProspectModal } from "@/components/edit-prospect-modal"

export default function SalesPage() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState({
    totalProspects: 0,
    totalClients: 0,
    conversionRate: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    avgSalesCycle: 0,
  })
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProspect, setSelectedProspect] = useState<any>(null)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [viewAll, setViewAll] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [userRole, setUserRole] = useState("")
  const [canViewAll, setCanViewAll] = useState(false)
  const [editProspect, setEditProspect] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // ✅ Search and Sort States
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [user, viewAll])

  const loadData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch("/api/sales/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data || stats)
      }

      // Load prospects with role-based filtering
      const headers: Record<string, string> = {}
      if (user?.email) {
        headers["x-user-email"] = user.email
      }

      const url = `/api/sales/prospects${viewAll ? "?view_all=true" : ""}`
      const prospectsResponse = await fetch(url, { headers })

      if (prospectsResponse.ok) {
        const prospectsData = await prospectsResponse.json()
        setProspects(prospectsData.data || [])
        setUserRole(prospectsData.user_role || "")
        setCanViewAll(prospectsData.can_view_all || false)
        console.log(`📊 Loaded ${prospectsData.data?.length || 0} prospects`)
      }
    } catch (error) {
      console.error("Error loading sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConvertProspect = (prospect: any) => {
    setSelectedProspect(prospect)
    setShowConversionModal(true)
  }

  const handleConversionSuccess = () => {
    setShowConversionModal(false)
    setSelectedProspect(null)
    loadData() // Refresh the data
  }

  const handleEditProspect = (prospect: any) => {
    setEditProspect(prospect)
    setShowEditModal(true)
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setEditProspect(null)
    loadData() // Refresh the data
  }

  // ✅ FIXED: Theme-aware status colors
  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      contacted: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
      qualified: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
      proposal: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      negotiation: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      converted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      lost: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    }
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground border-border"
  }

  // ✅ FIXED: Theme-aware priority colors
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-muted text-muted-foreground border-border",
      medium: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      high: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      urgent: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    }
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground border-border"
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // ✅ Enhanced filtering and sorting with useMemo for performance
  const filteredAndSortedProspects = useMemo(() => {
    let filtered = [...prospects]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((prospect: any) => {
        const searchableFields = [
          prospect.business_name,
          prospect.contact_name,
          prospect.contact_email,
          prospect.phone,
          prospect.formatted_address,
          prospect.street_address,
          prospect.city,
          prospect.state,
          prospect.zip_code,
          prospect.website,
          prospect.notes,
          prospect.assigned_salesperson_name,
          prospect.business_type,
        ]
        
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(query)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((prospect: any) => prospect.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((prospect: any) => prospect.priority === priorityFilter)
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a: any, b: any) => {
        let aValue: string | number = a[sortField]
        let bValue: string | number = b[sortField]

        // Handle different data types
        if (sortField === "estimated_value") {
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
        } else if (sortField === "created_at") {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        } else {
          aValue = String(aValue || "").toLowerCase()
          bValue = String(bValue || "").toLowerCase()
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [prospects, searchQuery, statusFilter, priorityFilter, sortField, sortDirection])

  // ✅ Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setSortField("created_at")
    setSortDirection("desc")
  }

  // ✅ Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(prospects.map((p: any) => p.status))
    return Array.from(statuses).sort()
  }, [prospects])

  const uniquePriorities = useMemo(() => {
    const priorities = new Set(prospects.map((p: any) => p.priority))
    return Array.from(priorities).sort()
  }, [prospects])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ✅ FIXED: Theme-aware sortable header
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted/50 text-foreground"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === "asc" ? 
            <SortAsc className="h-3 w-3" /> : 
            <SortDesc className="h-3 w-3" />
        )}
      </div>
    </th>
  )

  // ✅ FIXED: Theme-aware table view
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            <SortableHeader field="business_name">Business</SortableHeader>
            <SortableHeader field="contact_name">Contact</SortableHeader>
            <SortableHeader field="assigned_salesperson_name">Salesperson</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="priority">Priority</SortableHeader>
            <SortableHeader field="estimated_value">Value</SortableHeader>
            <SortableHeader field="created_at">Created</SortableHeader>
            <th className="border border-border px-4 py-2 text-left text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedProspects.map((prospect: any) => (
            <tr key={prospect.id} className="hover:bg-muted/30 transition-colors">
              <td className="border border-border px-4 py-2">
                <div className="font-medium text-foreground">{prospect.business_name}</div>
                {prospect.formatted_address && (
                  <div className="text-sm text-muted-foreground">{prospect.formatted_address}</div>
                )}
              </td>
              <td className="border border-border px-4 py-2">
                {prospect.contact_name && <div className="text-foreground">{prospect.contact_name}</div>}
                {prospect.contact_email && <div className="text-sm text-muted-foreground">{prospect.contact_email}</div>}
              </td>
              <td className="border border-border px-4 py-2">
                <div className="font-medium text-foreground">{prospect.assigned_salesperson_name}</div>
                <div className="text-sm text-muted-foreground">{prospect.assigned_salesperson_role}</div>
              </td>
              <td className="border border-border px-4 py-2">
                <Badge variant="outline" className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
              </td>
              <td className="border border-border px-4 py-2">
                <Badge variant="outline" className={getPriorityColor(prospect.priority)}>{prospect.priority}</Badge>
              </td>
              <td className="border border-border px-4 py-2">
                {prospect.estimated_value > 0 && (
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${Number(prospect.estimated_value).toLocaleString()}
                  </div>
                )}
              </td>
              <td className="border border-border px-4 py-2">
                <div className="text-sm text-muted-foreground">{new Date(prospect.created_at).toLocaleDateString()}</div>
              </td>
              <td className="border border-border px-4 py-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditProspect(prospect)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {prospect.status !== "converted" && prospect.status !== "lost" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleConvertProspect(prospect)}
                    >
                      Convert
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ✅ FIXED: Theme-aware card view
  const renderCardView = () => (
    <div className="space-y-4">
      {filteredAndSortedProspects.map((prospect: any) => (
        <Card key={prospect.id} className="hover:bg-muted/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{prospect.business_name}</h3>
                  <Badge variant="outline" className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
                  <Badge variant="outline" className={getPriorityColor(prospect.priority)}>{prospect.priority}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {prospect.contact_name && <div>Contact: {prospect.contact_name}</div>}
                  {prospect.contact_email && <div>Email: {prospect.contact_email}</div>}
                  {prospect.phone && <div>Phone: {prospect.phone}</div>}
                  {prospect.formatted_address && <div>Address: {prospect.formatted_address}</div>}
                  {viewAll && (
                    <div className="font-medium text-primary">
                      Assigned to: {prospect.assigned_salesperson_name} ({prospect.assigned_salesperson_role})
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                {prospect.estimated_value > 0 && (
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    ${Number(prospect.estimated_value).toLocaleString()}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Created: {new Date(prospect.created_at).toLocaleDateString()}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditProspect(prospect)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {prospect.status !== "converted" && prospect.status !== "lost" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleConvertProspect(prospect)}
                    >
                      Convert to Client
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {prospect.notes && (
              <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                {prospect.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage prospects and track sales performance
            {viewAll ? " (All Prospects)" : " (My Prospects)"}
          </p>
        </div>
        <ProspectModal
          trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Prospect
            </Button>
          }
          onProspectCreated={loadData}
        />
      </div>

      {/* ✅ FIXED: Theme-aware view controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {canViewAll && (
                <div className="flex items-center space-x-2">
                  <Switch id="view-all" checked={viewAll} onCheckedChange={setViewAll} />
                  <Label htmlFor="view-all" className="text-foreground">View All Prospects</Label>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Role: <span className="font-medium text-foreground">{userRole}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
                <Grid className="h-4 w-4 mr-1" />
                Cards
              </Button>
              <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                <List className="h-4 w-4 mr-1" />
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prospects.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredAndSortedProspects.length !== prospects.length && 
                `${filteredAndSortedProspects.length} filtered • `}
              {viewAll ? "All prospects in system" : "Your prospects in pipeline"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Converted prospects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Prospects to clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingCommissions}</div>
            <p className="text-xs text-muted-foreground">Pending commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Prospects List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prospects Pipeline</CardTitle>
              <CardDescription>Track and manage sales prospects</CardDescription>
            </div>
            {prospects.length === 0 && (
              <ProspectModal
                trigger={
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Prospect
                  </Button>
                }
                onProspectCreated={loadData}
              />
            )}
          </div>

          {/* ✅ FIXED: Search and filter controls with light dropdown backgrounds */}
          {prospects.length > 0 && (
            <div className="space-y-4 pt-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by business name, contact, address, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-foreground">Sort by:</Label>
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-40 bg-background text-foreground border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="business_name" className="text-black hover:bg-gray-100">Business Name</SelectItem>
                      <SelectItem value="contact_name" className="text-black hover:bg-gray-100">Contact Name</SelectItem>
                      <SelectItem value="created_at" className="text-black hover:bg-gray-100">Created Date</SelectItem>
                      <SelectItem value="estimated_value" className="text-black hover:bg-gray-100">Value</SelectItem>
                      <SelectItem value="status" className="text-black hover:bg-gray-100">Status</SelectItem>
                      <SelectItem value="priority" className="text-black hover:bg-gray-100">Priority</SelectItem>
                      <SelectItem value="assigned_salesperson_name" className="text-black hover:bg-gray-100">Salesperson</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  >
                    {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-foreground">Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-background text-foreground border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="all" className="text-black hover:bg-gray-100">All Status</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status} className="text-black hover:bg-gray-100">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-foreground">Priority:</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32 bg-background text-foreground border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="all" className="text-black hover:bg-gray-100">All Priority</SelectItem>
                      {uniquePriorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="text-black hover:bg-gray-100">
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                )}

                {/* Results Counter */}
                <div className="text-sm text-muted-foreground ml-auto">
                  Showing {filteredAndSortedProspects.length} of {prospects.length} prospects
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {prospects.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No prospects yet</h3>
              <p className="text-muted-foreground mb-4">Start building your sales pipeline by adding your first prospect.</p>
            </div>
          ) : filteredAndSortedProspects.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No prospects match your filters</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria.</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>{viewMode === "cards" ? renderCardView() : renderTableView()}</>
          )}
        </CardContent>
      </Card>

      {/* Conversion Modal */}
      {selectedProspect && (
        <ConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          prospect={selectedProspect}
          onSuccess={handleConversionSuccess}
        />
      )}

      {/* Edit Modal */}
      {editProspect && (
        <EditProspectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          prospect={editProspect}
          onSuccess={handleEditSuccess}
          userRole={userRole}
        />
      )}
    </div>
  )
}