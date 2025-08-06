// Path: /components/menu/MobilePreview.tsx
// Name: FIXED Mobile Preview - Properly Shows Actual Category Names

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Wifi,
  Battery,
  Signal
} from "lucide-react"

interface MenuItem {
  id: string
  data: {
    name: string
    price: number
    description: string
    image_url?: string
    category?: string
  }
  category_id?: string
  is_active: boolean
  menu_name: string
}

interface BusinessInfo {
  id: number
  name: string
  item_type: string
  button_label: string
}

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
}

interface MobilePreviewProps {
  config: any
  items: MenuItem[]
  categories: Category[]
  businessInfo: BusinessInfo | null
}

export function MobilePreview({ config, items, categories, businessInfo }: MobilePreviewProps) {
  
  console.log('🔍 MobilePreview received config:', {
    layout_type: config?.layout_type,
    columns: config?.columns,
    sections: config?.sections?.length || 0,
    selectedMenu: config?.selectedMenu,
    styling: config?.styling,
    theme: config?.theme
  })

  console.log('🔍 MobilePreview received items:', {
    totalItems: items?.length || 0,
    itemsData: items?.map(item => ({
      name: item.data?.name,
      menu_name: item.menu_name,
      category_id: item.category_id
    }))
  })

  console.log('🔍 MobilePreview received categories:', categories)

  // Add safety check
  if (!config) {
    console.log('❌ No config found')
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading configuration...</p>
        </CardContent>
      </Card>
    )
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // ✅ FIXED: Use Flutter-compatible styling format with proper fallbacks
  const styling = {
    background_color: config.theme?.bg_color || config.styling?.background_color || '#f5f5f5',
    card_color: config.theme?.card_color || config.styling?.card_color || '#ffffff',
    text_color: config.theme?.text_color || config.styling?.text_color || '#1f2937',
    primary_color: config.theme?.primary_color || config.styling?.primary_color || '#3b82f6',
    card_elevation: config.theme?.card_elevation || config.styling?.card_elevation || 2,
    border_radius: config.theme?.border_radius || config.styling?.border_radius || 8
  }

  const layoutType = config.layout_type || 'list'
  const columns = config.columns || 1
  const sections = config.sections || []

  console.log('🎨 Using styling:', styling)
  console.log('📱 Layout settings:', { layoutType, columns })

  // ✅ FIXED: Filter items to only show from selected menu
  const currentMenuItems = items.filter(item => {
    const itemMenuName = item.menu_name || 'Default Menu'
    const selectedMenuName = config.selectedMenu || 'Default Menu'
    return itemMenuName === selectedMenuName && item.is_active
  })

  console.log('🔍 Filtered items for preview:', {
    selectedMenu: config.selectedMenu,
    filteredCount: currentMenuItems.length,
    allItemsCount: items.length
  })

  // ✅ FIXED: Smart category assignment for items with undefined category_id
  const getActualCategoryForItem = (item: MenuItem) => {
    if (item.category_id && item.category_id !== 'uncategorized') {
      return categories.find(cat => String(cat.id) === String(item.category_id))
    }
    
    // If item has undefined or uncategorized category_id, assign to first real category
    if (categories.length > 0) {
      return categories[0]
    }
    
    return null
  }

  // ✅ FIXED: Group items by their ACTUAL categories, not by undefined values
  const itemsByActualCategory = currentMenuItems.reduce((acc, item) => {
    const actualCategory = getActualCategoryForItem(item)
    const categoryId = actualCategory?.id || 'truly-uncategorized'
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: actualCategory || null,
        items: []
      }
    }
    acc[categoryId].items.push(item)
    return acc
  }, {} as Record<string, { category: Category | null, items: MenuItem[] }>)

  console.log('🔍 Items grouped by ACTUAL categories:', itemsByActualCategory)

  const phoneWidth = orientation === 'portrait' ? 320 : 568
  const phoneHeight = orientation === 'portrait' ? 568 : 320

  // ✅ FIXED: Render items based on actual categories, not section configuration
  const renderMenuContent = () => {
    if (sections.length > 0) {
      // Render using sections configuration but with SMART category mapping
      return sections.map((section: any, index: number) => {
        console.log('🔍 Rendering section:', section.type, section.category_id)
        
        if (section.type === 'category') {
          // ✅ FIXED: Smart category name resolution
          let categoryName = section.content?.text || section.title || 'Category'
          
          if (section.category_id === 'uncategorized' && categories.length > 0) {
            // Use the first real category name instead of "Other Items"
            categoryName = categories[0].name
            console.log('🏷️ Mapped uncategorized section to actual category:', categoryName)
          } else if (section.category_id && section.category_id !== 'uncategorized') {
            const actualCategory = categories.find(cat => String(cat.id) === String(section.category_id))
            if (actualCategory) {
              categoryName = actualCategory.name
            }
          }
          
          console.log('🏷️ Final category name:', categoryName, 'for section:', section.category_id)
          
          return (
            <div 
              key={index}
              className="mb-2 px-2 py-1 rounded font-bold text-sm"
              style={{
                backgroundColor: section.content?.background_color || styling.primary_color,
                color: section.content?.text_color || '#ffffff',
                fontSize: `${section.content?.font_size || 16}px`,
                fontWeight: section.content?.font_weight || 'bold',
                borderRadius: `${styling.border_radius}px`,
                textAlign: section.content?.alignment || 'left'
              }}
            >
              {categoryName}
            </div>
          )
        }

        if (section.type === 'items') {
          // ✅ FIXED: Get items using SMART category mapping
          let sectionItems: MenuItem[] = []
          
          if (section.category_id === 'uncategorized') {
            // Map all items with undefined category_id to first real category if available
            if (categories.length > 0) {
              const firstCategoryId = categories[0].id
              sectionItems = currentMenuItems.filter(item => 
                !item.category_id || 
                item.category_id === 'uncategorized' || 
                item.category_id === undefined ||
                String(item.category_id) === String(firstCategoryId)
              )
              console.log('🔍 Smart mapping: assigned undefined items to category:', categories[0].name)
            } else {
              // Truly uncategorized items when no categories exist
              sectionItems = currentMenuItems.filter(item => 
                !item.category_id || item.category_id === 'uncategorized' || item.category_id === undefined
              )
            }
          } else {
            sectionItems = currentMenuItems.filter(item => 
              String(item.category_id) === String(section.category_id)
            )
          }
          
          console.log('🔍 Items for section:', section.category_id, 'found:', sectionItems.length)
          
          if (layoutType === 'grid') {
            return (
              <div 
                key={index}
                className="grid gap-2 mb-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(columns, 2)}, 1fr)` }}
              >
                {sectionItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2 shadow-sm"
                    style={{ 
                      backgroundColor: styling.card_color,
                      borderRadius: `${styling.border_radius}px`,
                      boxShadow: `0 ${styling.card_elevation}px ${styling.card_elevation * 2}px rgba(0,0,0,0.1)`
                    }}
                  >
                    <div className="text-center">
                      <div 
                        className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center"
                        style={{ borderRadius: `${styling.border_radius - 2}px` }}
                      >
                        {item.data.image_url ? (
                          <img 
                            src={item.data.image_url} 
                            alt={item.data.name}
                            className="w-full h-full object-cover rounded"
                            style={{ borderRadius: `${styling.border_radius - 2}px` }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">IMG</span>
                        )}
                      </div>
                      <h4 
                        className="font-medium text-xs truncate"
                        style={{ color: styling.text_color }}
                      >
                        {item.data.name}
                      </h4>
                      <p 
                        className="font-bold text-sm"
                        style={{ color: styling.primary_color }}
                      >
                        ${item.data.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          } else {
            // List layout
            return (
              <div key={index} className="space-y-2 mb-4">
                {sectionItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start gap-3 p-3 shadow-sm"
                    style={{ 
                      backgroundColor: styling.card_color,
                      borderRadius: `${styling.border_radius}px`,
                      boxShadow: `0 ${styling.card_elevation}px ${styling.card_elevation * 2}px rgba(0,0,0,0.1)`
                    }}
                  >
                    <div 
                      className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center"
                      style={{ borderRadius: `${styling.border_radius - 2}px` }}
                    >
                      {item.data.image_url ? (
                        <img 
                          src={item.data.image_url} 
                          alt={item.data.name}
                          className="w-full h-full object-cover rounded"
                          style={{ borderRadius: `${styling.border_radius - 2}px` }}
                        />
                      ) : (
                        <span className="text-xs text-gray-500">IMG</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-sm truncate"
                        style={{ color: styling.text_color }}
                      >
                        {item.data.name}
                      </h4>
                      <p 
                        className="text-xs opacity-70 line-clamp-1 mt-1"
                        style={{ color: styling.text_color }}
                      >
                        {item.data.description}
                      </p>
                      <p 
                        className="font-bold text-sm mt-1"
                        style={{ color: styling.primary_color }}
                      >
                        ${item.data.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        }

        // Handle promotional sections
        if (section.type === 'ad' || section.type === 'promotion' || section.type === 'special') {
          return (
            <div 
              key={index}
              className="p-3 rounded text-center text-sm mb-4"
              style={{ 
                backgroundColor: section.content?.background_color || styling.primary_color,
                color: section.content?.text_color || '#ffffff',
                borderRadius: `${styling.border_radius}px`,
                fontSize: `${section.content?.font_size || 16}px`,
                fontWeight: section.content?.font_weight || 'bold'
              }}
            >
              {section.content?.text || 'Promotional Content'}
              {section.content?.subtitle && (
                <div className="text-xs mt-1 opacity-90">{section.content.subtitle}</div>
              )}
              {section.content?.image_url && (
                <img 
                  src={section.content.image_url} 
                  alt="" 
                  className="mt-2 max-w-full max-h-16 object-contain mx-auto"
                  style={{ borderRadius: `${styling.border_radius}px` }}
                />
              )}
            </div>
          )
        }

        return null
      })
    } else {
      // ✅ FIXED: Show items grouped by ACTUAL categories when no sections defined
      return Object.entries(itemsByActualCategory).map(([categoryId, { category, items: categoryItems }]) => (
        <div key={categoryId} className="mb-4">
          {/* Category Header - Use ACTUAL category name */}
          <div 
            className="mb-2 px-2 py-1 rounded font-bold text-sm"
            style={{
              backgroundColor: styling.primary_color,
              color: '#ffffff',
              borderRadius: `${styling.border_radius}px`
            }}
          >
            {category ? category.name : 'Other Items'}
          </div>

          {/* Items for this category */}
          {layoutType === 'grid' ? (
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(columns, 2)}, 1fr)` }}
            >
              {categoryItems.map((item) => (
                <div 
                  key={item.id}
                  className="p-2 shadow-sm"
                  style={{ 
                    backgroundColor: styling.card_color,
                    borderRadius: `${styling.border_radius}px`,
                    boxShadow: `0 ${styling.card_elevation}px ${styling.card_elevation * 2}px rgba(0,0,0,0.1)`
                  }}
                >
                  <div className="text-center">
                    <div 
                      className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center"
                      style={{ borderRadius: `${styling.border_radius - 2}px` }}
                    >
                      {item.data.image_url ? (
                        <img 
                          src={item.data.image_url} 
                          alt={item.data.name}
                          className="w-full h-full object-cover rounded"
                          style={{ borderRadius: `${styling.border_radius - 2}px` }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">IMG</span>
                      )}
                    </div>
                    <h4 
                      className="font-medium text-xs truncate"
                      style={{ color: styling.text_color }}
                    >
                      {item.data.name}
                    </h4>
                    <p 
                      className="font-bold text-sm"
                      style={{ color: styling.primary_color }}
                    >
                      ${item.data.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 p-3 shadow-sm"
                  style={{ 
                    backgroundColor: styling.card_color,
                    borderRadius: `${styling.border_radius}px`,
                    boxShadow: `0 ${styling.card_elevation}px ${styling.card_elevation * 2}px rgba(0,0,0,0.1)`
                  }}
                >
                  <div 
                    className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ borderRadius: `${styling.border_radius - 2}px` }}
                  >
                    {item.data.image_url ? (
                      <img 
                        src={item.data.image_url} 
                        alt={item.data.name}
                        className="w-full h-full object-cover rounded"
                        style={{ borderRadius: `${styling.border_radius - 2}px` }}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">IMG</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-sm truncate"
                      style={{ color: styling.text_color }}
                    >
                      {item.data.name}
                    </h4>
                    <p 
                      className="text-xs opacity-70 line-clamp-1 mt-1"
                      style={{ color: styling.text_color }}
                    >
                      {item.data.description}
                    </p>
                    <p 
                      className="font-bold text-sm mt-1"
                      style={{ color: styling.primary_color }}
                    >
                      ${item.data.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))
    }
  }

  return (
    <Card className={isExpanded ? 'fixed inset-4 z-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Mobile Preview
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          {/* Phone Frame */}
          <div 
            className="relative bg-gray-900 rounded-3xl p-2 shadow-2xl"
            style={{ 
              width: phoneWidth + 40, 
              height: phoneHeight + 80 
            }}
          >
            {/* Phone Screen */}
            <div 
              className="relative bg-black rounded-2xl overflow-hidden"
              style={{ 
                width: phoneWidth, 
                height: phoneHeight 
              }}
            >
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-black text-white text-xs flex justify-between items-center px-4 py-1">
                <div className="flex items-center gap-1">
                  <span>9:41</span>
                </div>
                <div className="flex items-center gap-1">
                  <Signal className="h-3 w-3" />
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3 w-3" />
                </div>
              </div>

              {/* App Header */}
              <div 
                className="absolute top-6 left-0 right-0 z-10 px-4 py-3"
                style={{ backgroundColor: styling.primary_color }}
              >
                <h1 className="text-white font-semibold text-center">
                  {config.selectedMenu || businessInfo?.button_label || 'Menu'}
                </h1>
              </div>

              {/* App Content */}
              <div 
                className="absolute top-16 left-0 right-0 bottom-0 overflow-y-auto"
                style={{ backgroundColor: styling.background_color }}
              >
                <div className="p-3">
                  {currentMenuItems.length > 0 ? (
                    renderMenuContent()
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No items in {config.selectedMenu}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Badge variant="outline">
            {layoutType === 'grid' ? `Grid (${columns} cols)` : 'List'}
          </Badge>
          <Badge variant="outline">
            {currentMenuItems.length} items
          </Badge>
          <Badge variant="outline">
            {sections.length} sections
          </Badge>
          <Badge variant="outline">
            {orientation}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}