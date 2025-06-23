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
      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
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

      const response = await fetch(`/api/moderation?${params}`)
      const result = await response.json()

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
      const response = await fetch("/api/moderation/stats")
      const result = await response.json()

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
      const response = await fetch("/api/moderation/message-categories")
      const result = await response.json()

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

      const response = await fetch("/api/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToModerate,
          action: selectedAction,
          notes: moderationNotes,
          moderator_id: 1, // TODO: Get actual employee ID from auth
        }),
      })

      const result = await response.json()

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
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      flagged: { color: "bg-red-100 text-red-800", icon: Flag },
      rejected: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      deleted: { color: "bg-red-100 text-red-800", icon: Trash2 },
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
          <p className="text-gray-600">Loading content moderation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Content Moderation</h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">Review and moderate user-generated content</span>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkModeration("approve")}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve ({selectedItems.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkModeration("reject")}
                className="text-red-600 hover:text-red-700"
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.summary.totalPending}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.summary.totalApproved}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.summary.totalFlagged}</div>
                  <div className="text-sm text-gray-600">Flagged</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.summary.totalRejected}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.summary.totalDeleted}</div>
                  <div className="text-sm text-gray-600">Deleted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search content, users, or businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
                <SelectItem value="ad">Advertisements</SelectItem>
                <SelectItem value="communication">Communications</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Items</span>
            <div className="flex items-center gap-2">
              <SimpleCheckbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No content items found for moderation.</p>
                <p className="text-sm text-gray-500 mt-2">
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
                    className={`border rounded-lg p-4 ${isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start gap-4">
                      <SimpleCheckbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemSelect(itemKey, checked)}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContentTypeIcon(item.content_type)}
                          <Badge variant="outline" className="capitalize">
                            {item.content_type}
                          </Badge>
                          {getStatusBadge(item.moderation_status)}
                          {messageCategoryName && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              <Tag className="h-3 w-3 mr-1" />
                              {messageCategoryName}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">ID: {item.id}</span>
                        </div>

                        <div className="mb-2">
                          {item.content_type === "image" ? (
                            <div className="flex items-center gap-4">
                              <img
                                src={item.content || "/placeholder.svg"}
                                alt="Content"
                                className="w-20 h-20 object-cover rounded border"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=80&text=Image"
                                }}
                              />
                              <div>
                                <p className="text-sm text-gray-600">Image URL:</p>
                                <p className="text-sm font-mono break-all">{truncateContent(item.content, 80)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{truncateContent(item.content, 200)}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
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
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <strong>Notes:</strong> {item.moderation_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "approve")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "reject")}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIndividualModeration(item, "flag")}
                          className="text-orange-600 hover:text-orange-700"
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
              <span className="flex items-center px-4">
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
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {isBulkAction
                ? `${selectedAction} ${selectedItems.size} items`
                : `${selectedAction} ${selectedItem?.content_type}`}
            </DialogTitle>
            <DialogDescription>
              {isBulkAction
                ? `You are about to ${selectedAction} ${selectedItems.size} selected items.`
                : `You are about to ${selectedAction} this ${selectedItem?.content_type}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Moderation Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this moderation action..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                rows={3}
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
