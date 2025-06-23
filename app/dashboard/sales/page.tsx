"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Users, Target, TrendingUp, DollarSign, Grid, List, Edit } from "lucide-react"
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
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProspects = [...prospects].sort((a: any, b: any) => {
    if (!sortField) return 0

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="border border-gray-200 px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </div>
    </th>
  )

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <SortableHeader field="business_name">Business</SortableHeader>
            <SortableHeader field="contact_name">Contact</SortableHeader>
            <SortableHeader field="assigned_salesperson_name">Salesperson</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="priority">Priority</SortableHeader>
            <SortableHeader field="estimated_value">Value</SortableHeader>
            <SortableHeader field="created_at">Created</SortableHeader>
            <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProspects.map((prospect: any) => (
            <tr key={prospect.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-4 py-2">
                <div className="font-medium">{prospect.business_name}</div>
                {prospect.formatted_address && (
                  <div className="text-sm text-gray-600">{prospect.formatted_address}</div>
                )}
              </td>
              <td className="border border-gray-200 px-4 py-2">
                {prospect.contact_name && <div>{prospect.contact_name}</div>}
                {prospect.contact_email && <div className="text-sm text-gray-600">{prospect.contact_email}</div>}
              </td>
              <td className="border border-gray-200 px-4 py-2">
                <div className="font-medium">{prospect.assigned_salesperson_name}</div>
                <div className="text-sm text-gray-600">{prospect.assigned_salesperson_role}</div>
              </td>
              <td className="border border-gray-200 px-4 py-2">
                <Badge className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
              </td>
              <td className="border border-gray-200 px-4 py-2">
                <Badge className={getPriorityColor(prospect.priority)}>{prospect.priority}</Badge>
              </td>
              <td className="border border-gray-200 px-4 py-2">
                {prospect.estimated_value > 0 && (
                  <div className="font-semibold text-green-600">
                    ${Number(prospect.estimated_value).toLocaleString()}
                  </div>
                )}
              </td>
              <td className="border border-gray-200 px-4 py-2">
                <div className="text-sm">{new Date(prospect.created_at).toLocaleDateString()}</div>
              </td>
              <td className="border border-gray-200 px-4 py-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditProspect(prospect)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {prospect.status !== "converted" && prospect.status !== "lost" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
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

  const renderCardView = () => (
    <div className="space-y-4">
      {sortedProspects.map((prospect: any) => (
        <div key={prospect.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{prospect.business_name}</h3>
                <Badge className={getStatusColor(prospect.status)}>{prospect.status}</Badge>
                <Badge className={getPriorityColor(prospect.priority)}>{prospect.priority}</Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {prospect.contact_name && <div>Contact: {prospect.contact_name}</div>}
                {prospect.contact_email && <div>Email: {prospect.contact_email}</div>}
                {prospect.phone && <div>Phone: {prospect.phone}</div>}
                {prospect.formatted_address && <div>Address: {prospect.formatted_address}</div>}
                {viewAll && (
                  <div className="font-medium text-blue-600">
                    Assigned to: {prospect.assigned_salesperson_name} ({prospect.assigned_salesperson_role})
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              {prospect.estimated_value > 0 && (
                <div className="text-lg font-semibold text-green-600">
                  ${Number(prospect.estimated_value).toLocaleString()}
                </div>
              )}
              <div className="text-sm text-gray-500">Created: {new Date(prospect.created_at).toLocaleDateString()}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditProspect(prospect)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {prospect.status !== "converted" && prospect.status !== "lost" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleConvertProspect(prospect)}
                  >
                    Convert to Client
                  </Button>
                )}
              </div>
            </div>
          </div>
          {prospect.notes && <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">{prospect.notes}</div>}
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-gray-600">
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

      {/* View Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          {canViewAll && (
            <div className="flex items-center space-x-2">
              <Switch id="view-all" checked={viewAll} onCheckedChange={setViewAll} />
              <Label htmlFor="view-all">View All Prospects</Label>
            </div>
          )}
          <div className="text-sm text-gray-600">
            Role: <span className="font-medium">{userRole}</span>
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
        </CardHeader>
        <CardContent>
          {prospects.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects yet</h3>
              <p className="text-gray-600 mb-4">Start building your sales pipeline by adding your first prospect.</p>
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
