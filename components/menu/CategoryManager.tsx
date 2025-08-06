// Path: /components/menu/CategoryManager.tsx
// Name: Category Manager - Fixed Hook Issues

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Tag,
  Move,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Utensils,
  Car,
  Package,
  Heart
} from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
  position: number
  is_active: boolean
  item_count?: number
  color?: string
  icon?: string
}

interface CategoryManagerProps {
  categories: Category[]
  businessType: string
  businessId: number
  onChange: (categories: Category[]) => void
}

// Business type specific category suggestions
const CATEGORY_SUGGESTIONS = {
  food: [
    { name: 'Appetizers', icon: '🥗', color: '#10b981' },
    { name: 'Main Courses', icon: '🍽️', color: '#3b82f6' },
    { name: 'Desserts', icon: '🍰', color: '#f59e0b' },
    { name: 'Beverages', icon: '🥤', color: '#06b6d4' },
    { name: 'Specials', icon: '⭐', color: '#8b5cf6' },
    { name: 'Kids Menu', icon: '🧒', color: '#ec4899' }
  ],
  cars: [
    { name: 'Sedans', icon: '🚗', color: '#3b82f6' },
    { name: 'SUVs', icon: '🚙', color: '#10b981' },
    { name: 'Trucks', icon: '🚚', color: '#f59e0b' },
    { name: 'Luxury', icon: '🏎️', color: '#8b5cf6' },
    { name: 'Electric', icon: '⚡', color: '#06b6d4' },
    { name: 'Used', icon: '🔄', color: '#6b7280' }
  ],
  health: [
    { name: 'Massage Therapy', icon: '💆', color: '#10b981' },
    { name: 'Facial Treatments', icon: '✨', color: '#f59e0b' },
    { name: 'Body Treatments', icon: '🧘', color: '#3b82f6' },
    { name: 'Nail Services', icon: '💅', color: '#ec4899' },
    { name: 'Wellness Packages', icon: '🌿', color: '#8b5cf6' },
    { name: 'Consultations', icon: '👩‍⚕️', color: '#06b6d4' }
  ],
  products: [
    { name: 'New Arrivals', icon: '🆕', color: '#10b981' },
    { name: 'Best Sellers', icon: '🔥', color: '#f59e0b' },
    { name: 'Sale Items', icon: '💰', color: '#ef4444' },
    { name: 'Electronics', icon: '📱', color: '#3b82f6' },
    { name: 'Clothing', icon: '👕', color: '#8b5cf6' },
    { name: 'Home & Garden', icon: '🏠', color: '#06b6d4' }
  ]
}

const BUSINESS_TYPE_LABELS = {
  food: { singular: 'Menu Item', plural: 'Menu Items', icon: Utensils },
  cars: { singular: 'Vehicle', plural: 'Inventory', icon: Car },
  health: { singular: 'Service', plural: 'Services', icon: Heart },
  products: { singular: 'Product', plural: 'Products', icon: Package }
}

export function CategoryManager({ categories, businessType, businessId, onChange }: CategoryManagerProps) {
  const { toast } = useToast()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: ''
  })

  const businessLabels = BUSINESS_TYPE_LABELS[businessType as keyof typeof BUSINESS_TYPE_LABELS] || 
                        BUSINESS_TYPE_LABELS.food
  const suggestions = CATEGORY_SUGGESTIONS[businessType as keyof typeof CATEGORY_SUGGESTIONS] || 
                     CATEGORY_SUGGESTIONS.food

  const addCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        icon: newCategory.icon,
        position: categories.length
      }

      const createdCategory = await apiClient.menu.createCategory(businessId, categoryData)
      
      onChange([...categories, createdCategory])
      setNewCategory({ name: '', description: '', color: '#3b82f6', icon: '' })
      setIsAddDialogOpen(false)

      toast({
        title: "Category Added",
        description: `${newCategory.name} has been created.`,
      })
    } catch (error) {
      console.error('Error creating category:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await apiClient.menu.updateCategory(businessId, id, updates)
      onChange(categories.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
      
      toast({
        title: "Category Updated",
        description: "Changes have been saved.",
      })
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await apiClient.menu.deleteCategory(businessId, id)
      onChange(categories.filter(cat => cat.id !== id))
      
      toast({
        title: "Category Deleted",
        description: "Category has been removed.",
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(cat => cat.id === id)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const newCategories = [...categories]
    const [movedCategory] = newCategories.splice(index, 1)
    newCategories.splice(newIndex, 0, movedCategory)
    
    // Update positions
    newCategories.forEach((cat, i) => cat.position = i)
    onChange(newCategories)
  }

  const addSuggestedCategory = async (suggestion: typeof suggestions[0]) => {
    try {
      const categoryData = {
        name: suggestion.name,
        description: `${suggestion.name} category`,
        color: suggestion.color,
        icon: suggestion.icon,
        position: categories.length
      }
      
      const createdCategory = await apiClient.menu.createCategory(businessId, categoryData)
      onChange([...categories, createdCategory])

      toast({
        title: "Category Added",
        description: `${suggestion.name} has been created.`,
      })
    } catch (error) {
      console.error('Error creating suggested category:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create category. Please try again.",
        variant: "destructive"
      })
    }
  }

  const BusinessIcon = businessLabels.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusinessIcon className="h-5 w-5" />
            {businessLabels.plural} Categories
          </CardTitle>
          <CardDescription>
            Organize your {businessLabels.plural.toLowerCase()} into categories for better customer navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {categories.length} Categories
              </Badge>
              <Badge variant="outline">
                {categories.reduce((sum, cat) => sum + (cat.item_count || 0), 0)} Total {businessLabels.plural}
              </Badge>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for your {businessLabels.plural.toLowerCase()}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder={`e.g., ${suggestions[0]?.name || 'Category Name'}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description (Optional)</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description of this category"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-color">Category Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <Input
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          placeholder="#3b82f6"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category-icon">Icon (Emoji)</Label>
                      <Input
                        id="category-icon"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                        placeholder="🍽️"
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addCategory}>
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Add</CardTitle>
            <CardDescription>
              Common categories for {businessType} businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  onClick={() => addSuggestedCategory(suggestion)}
                  className="flex items-center gap-2"
                  disabled={categories.some(cat => cat.name === suggestion.name)}
                >
                  <span>{suggestion.icon}</span>
                  {suggestion.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Categories</CardTitle>
          <CardDescription>
            Manage and organize your categories. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No categories created yet</p>
              <p className="text-sm">Add your first category to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories
                .sort((a, b) => a.position - b.position)
                .map((category, index) => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      category.is_active 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    {/* Category Color & Icon */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-lg">{category.icon}</span>
                    </div>

                    {/* Category Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {category.item_count || 0} items
                        </Badge>
                        {!category.is_active && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>

                    {/* Position Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveCategory(category.id, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveCategory(category.id, 'down')}
                        disabled={index === categories.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateCategory(category.id, { is_active: !category.is_active })}
                        >
                          {category.is_active ? (
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
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={(open) => {
          if (!open) setEditingCategory(null)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Modify the category details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category-description">Description</Label>
                <Textarea
                  id="edit-category-description"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category-color">Category Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={editingCategory.color || '#3b82f6'}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingCategory.color || '#3b82f6'}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-category-icon">Icon (Emoji)</Label>
                  <Input
                    id="edit-category-icon"
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="text-center"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateCategory(editingCategory.id, editingCategory)
                setEditingCategory(null)
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Statistics */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter(cat => cat.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {categories.reduce((sum, cat) => sum + (cat.item_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total {businessLabels.plural}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {categories.length > 0 
                    ? Math.round(categories.reduce((sum, cat) => sum + (cat.item_count || 0), 0) / categories.filter(cat => cat.is_active).length) 
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg per Category</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}