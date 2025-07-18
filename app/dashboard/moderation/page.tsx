// File: app/dashboard/moderation/page.tsx
// MINIMAL CHANGES - Only add auth headers to existing fetch calls

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  ImageIcon,
  MessageSquare,
  Megaphone,
  Users,
  CheckCircle,
  XCircle,
  Flag,
  Trash2,
  Eye,
  Calendar,
  User,
  Building,
  Clock,
  Shield,
  Tag,
} from "lucide-react"
import { getAuth } from "firebase/auth" // ADDED: Import Firebase auth

interface ModerationItem {
  content_type: string
  id: number
  content: string
  created_at: string
  moderation_status_id: number
  moderation_status: string
  moderated_by_employee_id?: number
  moderated_by_name?: string
  moderation_notes?: string
  moderated_at?: string
  user_name?: string
  business_name?: string
  placeid?: string
  message_category_id?: number
  message_category_name?: string
}

interface ModerationStats {
  statsByType: { [key: string]: { [key: string]: number } }
  totalsByStatus: { [key: string]: number }
  summary: {
    totalPending: number
    totalApproved: number
    totalFlagged: number
    totalRejected: number
    totalDeleted: number
  }
}

interface MessageCategory {
  id: number
  name: string
}

// ADDED: Helper function to get auth headers
const getAuthHeaders = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  
  if (user) {
    try {
      const token = await user.getIdToken()
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error("❌ Error getting auth token:", error)
    }
  }
  
  return {
    'Content-Type': 'application/json'
  }
}

// ADDED: Helper function to make authenticated requests to Google Cloud Run
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://gladgrade-api-360532994710.us-east4.run.app"
  const url = `${baseUrl}/api${endpoint}`
  
  const headers = await getAuthHeaders()
  
  const config: RequestInit = {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  }
  
  console.log(`🌐 API Request: ${options.method || "GET"} ${url}`)
  
  const response = await fetch(url, config)
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`)
  }
  
  return data
}

// Simple Checkbox Component
function SimpleCheckbox({
  checked,
  onCheckedChange,
  className = "",
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 rounded border-border text-primary focus:ring-primary ${className}`}
    />
  )
}

// Simple Alert Dialog Component
function SimpleAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border-border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2 text-foreground">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

export default function ContentModerationPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ModerationItem[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [messageCategories, setMessageCategories] = useState<MessageCategory[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [contentTypeFilter, setContentTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Moderation dialog states
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [moderationNotes, setModerationNotes] = useState("")
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [isBulkAction, setIsBulkAction] = useState(false)

  // Load data on component mount and when filters change
  useEffect(() => {
    loadModerationItems()
    loadModerationStats()
    loadMessageCategories()
  }, [contentTypeFilter, statusFilter, searchTerm, currentPage])

  const loadModerationItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: contentTypeFilter,
        status: statusFilter,
        page: currentPage.toString(),
        limit: "20",
      })

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      // CHANGED: Use apiRequest helper instead of direct fetch
      const result = await apiRequest(`/moderation?${params}`)

      if (result.success) {
        setItems(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        console.log("✅ Moderation items loaded:", result.data?.length || 0)
      }
    } catch (error) {
      console.error("❌ Error loading moderation items:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadModerationStats = async () => {
    try {
      // CHANGED: Use apiRequest helper instead of direct fetch
      const result = await apiRequest("/moderation/stats")

      if (result.success) {
        setStats(result.data)
        console.log("✅ Moderation stats loaded")
      }
    } catch (error) {
      console.error("❌ Error loading moderation stats:", error)
    }
  }

  const loadMessageCategories = async () => {
    try {
      // CHANGED: Use apiRequest helper instead of direct fetch
      const result = await apiRequest("/moderation/message-categories")

      if (result.success) {
        setMessageCategories(result.data || [])
        console.log("✅ Message categories loaded")
      }
    } catch (error) {
      console.error("❌ Error loading message categories:", error)
    }
  }

  const handleItemSelect = (itemKey: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemKey)
    } else {
      newSelected.delete(itemKey)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = items.map((item) => `${item.content_type}-${item.id}`)
      setSelectedItems(new Set(allKeys))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleIndividualModeration = (item: ModerationItem, action: string) => {
    setSelectedItem(item)
    setSelectedAction(action)
    setIsBulkAction(false)
    setModerationNotes("")
    setIsModerationDialogOpen(true)
  }

  const handleBulkModeration = (action: string) => {
    if (selectedItems.size === 0) {
      alert("Please select items to moderate")
      return
    }

    setSelectedAction(action)
    setIsBulkAction(true)
    setModerationNotes("")
    setIsModerationDialogOpen(true)
  }

  const confirmModeration = async () => {
    try {
      let itemsToModerate: Array<{ content_type: string; id: number }> = []

      if (isBulkAction) {
        itemsToModerate = Array.from(selectedItems).map((itemKey) => {
          const [content_type, id] = itemKey.split("-")
          return { content_type, id: Number.parseInt(id) }
        })
      } else if (selectedItem) {
        itemsToModerate = [
          {
            content_type: selectedItem.content_type,
            id: selectedItem.id,
          },
        ]
      }

      // CHANGED: Use apiRequest helper instead of direct fetch
      const result = await apiRequest("/moderation", {
        method: "POST",
        body: JSON.stringify({
          items: itemsToModerate,
          action: selectedAction,
          notes: moderationNotes,
          moderator_id: 1, // TODO: Get actual employee ID from auth
        }),
      })

      if (result.success) {
        setIsModerationDialogOpen(false)
        setIsConfirmDialogOpen(false)
        setSelectedItems(new Set())
        setSelectedItem(null)

        // Reload data
        loadModerationItems()
        loadModerationStats()

        alert(`✅ Successfully ${selectedAction}ed ${itemsToModerate.length} item(s)`)
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Error moderating content:", error)
      alert("Failed to moderate content. Please try again.")
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "review":
        return <MessageSquare className="h-4 w-4" />
      case "ad":
        return <Megaphone className="h-4 w-4" />
      case "communication":
        return <Users className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", icon: Clock },
      approved: { color: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800", icon: CheckCircle },
      flagged: { color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", icon: Flag },
      rejected: { color: "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800", icon: XCircle },
      deleted: { color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", icon: Trash2 },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getMessageCategoryName = (categoryId?: number) => {
    if (!categoryId) return null
    const category = messageCategories.find((c) => c.id === categoryId)
    return category ? category.name : null
  }

  const truncateContent = (content: string | null | undefined, maxLength = 100) => {
    if (!content || content.length <= maxLength) return content || "No content"
    return content.substring(0, maxLength) + "..."
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content moderation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Review and moderate user-generated content</span>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkModeration("approve")}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve ({selectedItems.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkModeration("reject")}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject ({selectedItems.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.summary.totalPending}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.summary.totalApproved}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.summary.totalFlagged}</div>
                  <div className="text-sm text-muted-foreground">Flagged</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.summary.totalRejected}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.summary.totalDeleted}</div>
                  <div className="text-sm text-muted-foreground">Deleted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search content, users, or businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background text-foreground border-border"
                />
              </div>
            </div>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-48 bg-background text-foreground border-border">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-black hover:bg-gray-100">All Content</SelectItem>
                <SelectItem value="image" className="text-black hover:bg-gray-100">Images</SelectItem>
                <SelectItem value="review" className="text-black hover:bg-gray-100">Reviews</SelectItem>
                <SelectItem value="ad" className="text-black hover:bg-gray-100">Advertisements</SelectItem>
                <SelectItem value="communication" className="text-black hover:bg-gray-100">Communications</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background text-foreground border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-black hover:bg-gray-100">All Status</SelectItem>
                <SelectItem value="pending" className="text-black hover:bg-gray-100">Pending</SelectItem>
                <SelectItem value="approved" className="text-black hover:bg-gray-100">Approved</SelectItem>
                <SelectItem value="flagged" className="text-black hover:bg-gray-100">Flagged</SelectItem>
                <SelectItem value="rejected" className="text-black hover:bg-gray-100">Rejected</SelectItem>
                <SelectItem value="deleted" className="text-black hover:bg-gray-100">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Items */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <span>Content Items</span>
            <div className="flex items-center gap-2">
              <SimpleCheckbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No content items found for moderation.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or check back later for new content.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const itemKey = `${item.content_type}-${item.id}`
                const isSelected = selectedItems.has(itemKey)
                const messageCategoryName =
                  item.content_type === "communication" ? getMessageCategoryName(item.message_category_id) : null

                return (
                  <div
                    key={itemKey}
                    className={`border border-border rounded-lg p-4 ${isSelected ? "bg-primary/10 border-primary/30" : "hover:bg-muted/30"}`}
                  >
                    <div className="flex items-start gap-4">
                      <SimpleCheckbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemSelect(itemKey, checked)}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContentTypeIcon(item.content_type)}
                          <Badge variant="outline" className="capitalize border-border">
                            {item.content_type}
                          </Badge>
                          {getStatusBadge(item.moderation_status)}
                          {messageCategoryName && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                              <Tag className="h-3 w-3 mr-1" />
                              {messageCategoryName}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">ID: {item.id}</span>
                        </div>

                        <div className="mb-2">
                          {item.content_type === "image" ? (
                            <div className="flex items-center gap-4">
                              <img
                                src={item.content || "/placeholder.svg"}
                                alt="Content"
                                className="w-20 h-20 object-cover rounded border border-border"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=80&text=Image"
                                }}
                              />
                              <div>
                                <p className="text-sm text-muted-foreground">Image URL:</p>
                                <p className="text-sm font-mono break-all text-foreground">{truncateContent(item.content, 80)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground">{truncateContent(item.content, 200)}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {item.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{item.user_name}</span>
                            </div>
                          )}
                          {item.business_name && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>{item.business_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          {item.moderated_by_name && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>Moderated by {item.moderated_by_name}</span>
                            </div>
                          )}
                        </div>

                        {item.moderation_notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm border border-border">
                            <strong className="text-foreground">Notes:</strong> <span className="text-foreground">{item.moderation_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "approve")}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "reject")}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "flag")}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isBulkAction
                ? `${selectedAction} ${selectedItems.size} items`
                : `${selectedAction} ${selectedItem?.content_type}`}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isBulkAction
                ? `You are about to ${selectedAction} ${selectedItems.size} selected items.`
                : `You are about to ${selectedAction} this ${selectedItem?.content_type}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Moderation Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this moderation action..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                rows={3}
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModerationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsModerationDialogOpen(false)
                setIsConfirmDialogOpen(true)
              }}
              className={
                selectedAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : selectedAction === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : selectedAction === "flag"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-gray-600 hover:bg-gray-700"
              }
            >
              {selectedAction} {isBulkAction ? `${selectedItems.size} items` : "item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <SimpleAlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Confirm Moderation Action"
        description={`Are you sure you want to ${selectedAction} ${isBulkAction ? `${selectedItems.size} items` : "this item"}? This action cannot be undone.`}
        onConfirm={confirmModeration}
        confirmText={`Confirm ${selectedAction}`}
      />
    </div>
  )
}