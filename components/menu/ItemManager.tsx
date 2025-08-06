// Path: /components/menu/ItemManager.tsx
// Name: Item Manager - Add, Edit, and Manage Menu Items with Menu Name Support

"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/app/providers"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Package,
  Car,
  Heart,
  Utensils
} from "lucide-react"

interface MenuItem {
  id: string
  data: {
    name: string
    price: number
    description: string
    image_url?: string
    category?: string
    // Business-specific fields
    year?: string | number
    mileage?: string | number
    duration?: string | number
    sku?: string
    [key: string]: any // Allow additional dynamic fields
  }
  category_id?: string
  is_active: boolean
  date_created: string
  menu_name: string // Added menu name support
}

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
}

interface ItemManagerProps {
  items: MenuItem[]
  categories: Category[]
  businessType: string
  businessId: number
  selectedMenu: string // NEW: Track which menu we're editing
  onChange: (items: MenuItem[]) => void
}

const BUSINESS_TYPE_LABELS = {
  food: { singular: 'Menu Item', plural: 'Menu Items', icon: Utensils, fields: ['name', 'price', 'description', 'image'] },
  cars: { singular: 'Vehicle', plural: 'Inventory', icon: Car, fields: ['name', 'price', 'year', 'mileage', 'description', 'image'] },
  health: { singular: 'Service', plural: 'Services', icon: Heart, fields: ['name', 'price', 'duration', 'description', 'image'] },
  products: { singular: 'Product', plural: 'Products', icon: Package, fields: ['name', 'price', 'sku', 'description', 'image'] }
}

export function ItemManager({ items, categories, businessType, businessId, selectedMenu, onChange }: ItemManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [pendingEditItem, setPendingEditItem] = useState<MenuItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    description: '',
    category_id: '',
    image_url: '',
    additional_data: {} as any
  })

  const businessLabels = BUSINESS_TYPE_LABELS[businessType as keyof typeof BUSINESS_TYPE_LABELS] || 
                        BUSINESS_TYPE_LABELS.food

  // Filter items based on search and category - only show items from selected menu
  const filteredItems = items.filter(item => {
    const itemMenuName = item.menu_name || 'Default Menu'
    const inSelectedMenu = itemMenuName === selectedMenu
    const matchesSearch = item.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.data.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Fix category matching - handle both string and number IDs
    const itemCategoryId = String(item.category_id || item.data?.category_id || '')
    const selectedCategoryId = String(selectedCategory)
    const matchesCategory = selectedCategory === 'all' || itemCategoryId === selectedCategoryId
    
    const matchesActive = showInactive || item.is_active
    
    console.log('🔍 Item filter debug:', {
      itemName: item.data.name,
      itemCategoryId,
      selectedCategoryId,
      matchesCategory,
      inSelectedMenu,
      matchesSearch,
      matchesActive
    })
    
    return inSelectedMenu && matchesSearch && matchesCategory && matchesActive
  })

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      if (!businessId) {
        throw new Error('Business ID not available. Please refresh the page.')
      }
      
      const result = await apiClient.menu.uploadImage(file, businessId)
      
      if (!result.success || !result.image_url) {
        throw new Error('Invalid response from upload API')
      }
      
      toast({
        title: "Image Uploaded",
        description: "Image has been successfully uploaded.",
      })
      
      return result.image_url
    } catch (error) {
      console.error('Image upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const addItem = async () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter an item name.",
        variant: "destructive"
      })
      return
    }

    try {
      const itemData = {
        item_type: businessType,
        data: {
          name: newItem.name,
          price: newItem.price,
          description: newItem.description,
          image_url: newItem.image_url,
          category: categories.find(cat => cat.id === newItem.category_id)?.name,
          ...newItem.additional_data
        },
        category_id: newItem.category_id,
        menu_name: selectedMenu // NEW: Associate with selected menu
      }

      const createdItem = await apiClient.menu.createItem(businessId, itemData)
      
      // Add to local state
      const newMenuItem: MenuItem = {
        id: createdItem.id,
        data: createdItem.data,
        category_id: newItem.category_id,
        is_active: true,
        date_created: new Date().toISOString(),
        menu_name: selectedMenu
      }

      onChange([...items, newMenuItem])
      
      // Reset form
      setNewItem({
        name: '',
        price: 0,
        description: '',
        category_id: '',
        image_url: '',
        additional_data: {}
      })
      setIsAddDialogOpen(false)
      
      toast({
        title: "Item Added",
        description: `${newItem.name} has been added to ${selectedMenu}.`,
      })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: "Add Failed",
        description: "Failed to add item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      // Update via API
      await apiClient.menu.updateItem(businessId, id, {
        data: updates.data,
        is_active: updates.is_active,
        category_id: updates.category_id
      })

      // Update local state
      onChange(items.map(item => item.id === id ? { ...item, ...updates } : item))
      
      toast({
        title: "Item Updated",
        description: "Changes have been saved.",
      })
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteItem = async (id: string) => {
    try {
      await apiClient.menu.deleteItem(businessId, id)
      
      const item = items.find(i => i.id === id)
      onChange(items.filter(item => item.id !== id))
      
      toast({
        title: "Item Deleted",
        description: `${item?.data.name} has been removed.`,
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const duplicateItem = async (item: MenuItem) => {
    try {
      const duplicatedData = {
        item_type: businessType,
        data: {
          ...item.data,
          name: `${item.data.name} (Copy)`
        },
        category_id: item.category_id,
        menu_name: selectedMenu // Duplicate in the same menu
      }

      const createdItem = await apiClient.menu.createItem(businessId, duplicatedData)
      
      const duplicated: MenuItem = {
        id: createdItem.id,
        data: createdItem.data,
        category_id: item.category_id,
        is_active: true,
        date_created: new Date().toISOString(),
        menu_name: selectedMenu
      }
      
      onChange([...items, duplicated])
      
      toast({
        title: "Item Duplicated",
        description: `Created a copy of ${item.data.name} in ${selectedMenu}.`,
      })
    } catch (error) {
      console.error('Error duplicating item:', error)
      toast({
        title: "Duplicate Failed",
        description: "Failed to duplicate item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const BusinessIcon = businessLabels.icon

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusinessIcon className="h-5 w-5" />
            {businessLabels.plural} Management - {selectedMenu}
          </CardTitle>
          <CardDescription>
            Add, edit, and organize your {businessLabels.plural.toLowerCase()} for {selectedMenu}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${businessLabels.plural.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showInactive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
                className="flex items-center gap-2"
              >
                {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showInactive ? 'All' : 'Active Only'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredItems.length} of {items.filter(i => (i.menu_name || 'Default Menu') === selectedMenu).length} items
              </Badge>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add {businessLabels.singular}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New {businessLabels.singular} to {selectedMenu}</DialogTitle>
                    <DialogDescription>
                      Create a new {businessLabels.singular.toLowerCase()} for {selectedMenu}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="item-name">{businessLabels.singular} Name</Label>
                          <Input
                            id="item-name"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder={`Enter ${businessLabels.singular.toLowerCase()} name`}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="item-price">Price</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="item-price"
                              type="number"
                              step="0.01"
                              value={newItem.price}
                              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="item-category">Category</Label>
                          <Select 
                            value={newItem.category_id} 
                            onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <span className="flex items-center gap-2">
                                    {category.icon && <span>{category.icon}</span>}
                                    {category.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <Label htmlFor="item-description">Description</Label>
                          <Textarea
                            id="item-description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            placeholder={`Describe your ${businessLabels.singular.toLowerCase()}`}
                            rows={3}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            {newItem.image_url ? (
                              <div className="flex items-center gap-4">
                                <img 
                                  src={newItem.image_url} 
                                  alt="Preview" 
                                  className="w-20 h-20 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">Image uploaded</p>
                                  <p className="text-xs text-gray-500 truncate">{newItem.image_url}</p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setNewItem({ ...newItem, image_url: '' })}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600 mb-2">Upload an image</p>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      try {
                                        const url = await handleImageUpload(file)
                                        setNewItem({ ...newItem, image_url: url })
                                      } catch (error) {
                                        // Error already handled in handleImageUpload
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Button 
                                  variant="outline" 
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  {isUploading ? 'Uploading...' : 'Choose File'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      {/* Business-specific fields */}
                      {businessType === 'cars' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Year</Label>
                            <Input
                              type="number"
                              value={newItem.additional_data.year || ''}
                              onChange={(e) => setNewItem({
                                ...newItem,
                                additional_data: { ...newItem.additional_data, year: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Mileage</Label>
                            <Input
                              type="number"
                              value={newItem.additional_data.mileage || ''}
                              onChange={(e) => setNewItem({
                                ...newItem,
                                additional_data: { ...newItem.additional_data, mileage: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      )}
                      
                      {businessType === 'health' && (
                        <div>
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={newItem.additional_data.duration || ''}
                            onChange={(e) => setNewItem({
                              ...newItem,
                              additional_data: { ...newItem.additional_data, duration: e.target.value }
                            })}
                          />
                        </div>
                      )}
                      
                      {businessType === 'products' && (
                        <div>
                          <Label>SKU</Label>
                          <Input
                            value={newItem.additional_data.sku || ''}
                            onChange={(e) => setNewItem({
                              ...newItem,
                              additional_data: { ...newItem.additional_data, sku: e.target.value }
                            })}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addItem} disabled={!newItem.name.trim()}>
                      Add to {selectedMenu}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`${!item.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              {/* Item Image */}
              {item.data.image_url ? (
                <img
                  src={item.data.image_url}
                  alt={item.data.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              {/* Item Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg truncate">{item.data.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        console.log('🚨 Edit clicked for item:', item)
                        console.log('🔍 Item category_id:', item.category_id)
                        setPendingEditItem(item)
                        // Delay opening dialog to avoid dropdown/dialog conflict
                        setTimeout(() => {
                          const itemWithCategory = {
                            ...item,
                            category_id: item.category_id || item.data?.category_id || ''
                          }
                          console.log('🔧 Setting editing item with category:', itemWithCategory.category_id)
                          setEditingItem(itemWithCategory)
                          setPendingEditItem(null)
                          }, 100)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateItem(item)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateItem(item.id, { is_active: !item.is_active })}
                      >
                        {item.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-600">
                    ${item.data.price.toFixed(2)}
                  </span>
                  {(item.category_id || item.data?.category_id) && (
                    <Badge variant="outline" className="text-xs">
                      {categories.find(cat => cat.id === (item.category_id || item.data?.category_id))?.name}
                    </Badge>
                  )}
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Hidden
                    </Badge>
                  )}
                </div>
                
                {item.data.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.data.description}
                  </p>
                )}
                
                {/* Business-specific additional info */}
                {businessType === 'cars' && item.data.year && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>Year: {item.data.year}</span>
                    {item.data.mileage && <span>• {item.data.mileage} miles</span>}
                  </div>
                )}
                
                {businessType === 'health' && item.data.duration && (
                  <div className="text-xs text-gray-500">
                    Duration: {item.data.duration} minutes
                  </div>
                )}
                
                {businessType === 'products' && item.data.sku && (
                  <div className="text-xs text-gray-500">
                    SKU: {item.data.sku}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <BusinessIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedCategory !== 'all' 
                ? `No ${businessLabels.plural.toLowerCase()} found in ${selectedMenu}`
                : `No ${businessLabels.plural.toLowerCase()} in ${selectedMenu} yet`
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : `Get started by adding your first ${businessLabels.singular.toLowerCase()} to ${selectedMenu}`
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add {businessLabels.singular}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={(open) => {
            console.log('🚨 Edit dialog state changing to:', open)
            if (!open && !pendingEditItem) {
              setEditingItem(null)
            }
          }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {businessLabels.singular}</DialogTitle>
              <DialogDescription>
                Update the {businessLabels.singular.toLowerCase()} details in {selectedMenu}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-item-name">{businessLabels.singular} Name</Label>
                    <Input
                      id="edit-item-name"
                      value={editingItem.data.name}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, name: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-item-price">Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="edit-item-price"
                        type="number"
                        step="0.01"
                        value={editingItem.data.price}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, price: parseFloat(e.target.value) || 0 }
                        })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-item-category">Category</Label>
                    <Select 
                      value={editingItem.category_id || editingItem.data?.category_id || ''} 
                      onValueChange={(value) => {
                        console.log('🏷️ Category changed to:', value)
                        setEditingItem({
                          ...editingItem,
                          category_id: value,
                          data: { 
                            ...editingItem.data, 
                            category: categories.find(cat => cat.id === value)?.name,
                            category_id: value // Also store in data for API compatibility
                          }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <span className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              {category.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="edit-item-description">Description</Label>
                    <Textarea
                      id="edit-item-description"
                      value={editingItem.data.description}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {editingItem.data.image_url ? (
                        <div className="flex items-center gap-4">
                          <img 
                            src={editingItem.data.image_url} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Current image</p>
                            <p className="text-xs text-gray-500 truncate">{editingItem.data.image_url}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingItem({
                              ...editingItem,
                              data: { ...editingItem.data, image_url: '' }
                            })}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 mb-2">Upload an image</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                try {
                                  const url = await handleImageUpload(file)
                                  setEditingItem({
                                    ...editingItem,
                                    data: { ...editingItem.data, image_url: url }
                                  })
                                } catch (error) {
                                  // Error already handled in handleImageUpload
                                }
                              }
                            }}
                            className="hidden"
                            id="edit-file-input"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('edit-file-input')?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {isUploading ? 'Uploading...' : 'Choose File'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                {/* Business-specific fields for editing */}
                {businessType === 'cars' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={editingItem.data.year || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, year: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Mileage</Label>
                      <Input
                        type="number"
                        value={editingItem.data.mileage || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, mileage: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {businessType === 'health' && (
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={editingItem.data.duration || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, duration: e.target.value }
                      })}
                    />
                  </div>
                )}
                
                {businessType === 'products' && (
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={editingItem.data.sku || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, sku: e.target.value }
                      })}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log('💾 Saving item with category:', editingItem.category_id)
                  updateItem(editingItem.id, {
                    ...editingItem,
                    category_id: editingItem.category_id // Ensure category_id is passed
                  })
                  setEditingItem(null)
                }}
                disabled={!editingItem.data.name.trim()}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{businessLabels.plural} Summary - {selectedMenu}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {items.filter(i => (i.menu_name || 'Default Menu') === selectedMenu).length}
              </div>
              <div className="text-sm text-gray-600">Total {businessLabels.plural}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(i => (i.menu_name || 'Default Menu') === selectedMenu && i.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${(() => {
                  const menuItems = items.filter(i => (i.menu_name || 'Default Menu') === selectedMenu)
                  return menuItems.length > 0 
                    ? (menuItems.reduce((sum, item) => sum + item.data.price, 0) / menuItems.length).toFixed(2)
                    : '0.00'
                })()}
              </div>
              <div className="text-sm text-gray-600">Avg Price</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}