// Path: /components/menu/MenuLayoutDesigner.tsx
// Name: FIXED Menu Layout Designer - Prevents Freezing and Enables Real Saving

"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"


import { getItemCategoryId, filterItemsByCategory, groupItemsByCategory } from "@/lib/category-utils"
import { SectionManager } from "@/lib/section-manager"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDebouncedCallback } from 'use-debounce'

import { 
  Grid3X3, 
  List, 
  Plus, 
  Trash2, 
  Move,
  Square,
  Image as ImageIcon,
  Type,
  DollarSign,
  Tag,
  AlertCircle,
  Zap,
  Save,
  Edit,
  Upload,
  Palette
} from "lucide-react"

interface GridCell {
  row: number
  col: number
  isOccupied: boolean
  occupiedBy?: string
}

interface SectionContent {
  text: string
  subtitle?: string
  image_url?: string
  background_color: string
  text_color: string
  font_size: number
  font_weight: 'normal' | 'bold'
  border_radius: number
  padding: number
  alignment: 'left' | 'center' | 'right'
}

interface LayoutSection {
  id: string
  type: 'items' | 'ad' | 'promotion' | 'special' | 'category'
  gridPosition: { row: number; col: number }
  gridSize: { rowSpan: number; colSpan: number }
  content?: SectionContent
  style?: any
  title?: string
  category_id?: string
  editable: boolean
}

interface MenuItem {
  id: string
  data: {
    name: string
    price: number
    description: string
    image_url?: string
    category?: string
    category_id?: string | number
  }
  category_id?: string
  is_active: boolean
  menu_name: string
}

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
}

interface MenuLayoutDesignerProps {
  config: any
  onChange: (config: any) => void
  businessType: string
  selectedMenu: string
  onSaveConfig?: (config: any) => Promise<void>
  items: MenuItem[]
  categories: Category[]
}



const SECTION_TYPES = [
  { 
    value: 'ad', 
    label: 'Advertisement', 
    icon: ImageIcon, 
    color: 'bg-green-100 text-green-700 border-green-300', 
    defaultSize: { rowSpan: 1, colSpan: 4 },
    defaultContent: {
      text: 'Your Advertisement Here',
      subtitle: 'Promote your business',
      background_color: '#10b981',
      text_color: '#ffffff',
      font_size: 16,
      font_weight: 'bold' as const,
      border_radius: 8,
      padding: 16,
      alignment: 'center' as const
    }
  },
  { 
    value: 'promotion', 
    label: 'Special Offer', 
    icon: Zap, 
    color: 'bg-orange-100 text-orange-700 border-orange-300', 
    defaultSize: { rowSpan: 1, colSpan: 2 },
    defaultContent: {
      text: '20% OFF TODAY ONLY',
      subtitle: 'Limited time offer',
      background_color: '#f59e0b',
      text_color: '#ffffff',
      font_size: 18,
      font_weight: 'bold' as const,
      border_radius: 12,
      padding: 20,
      alignment: 'center' as const
    }
  },
  { 
    value: 'special', 
    label: 'Daily Special', 
    icon: Tag, 
    color: 'bg-purple-100 text-purple-700 border-purple-300', 
    defaultSize: { rowSpan: 1, colSpan: 2 },
    defaultContent: {
      text: 'DAILY SPECIAL',
      subtitle: 'Today\'s featured item',
      background_color: '#8b5cf6',
      text_color: '#ffffff',
      font_size: 16,
      font_weight: 'bold' as const,
      border_radius: 8,
      padding: 16,
      alignment: 'center' as const
    }
  }
]

const CONTENT_TEMPLATES = [
  {
    name: "20% Off Sale",
    content: {
      text: "20% OFF TODAY ONLY",
      subtitle: "Use code: SAVE20",
      background_color: "#ef4444",
      text_color: "#ffffff",
      font_size: 18,
      font_weight: "bold" as const,
      border_radius: 12,
      padding: 20,
      alignment: "center" as const
    }
  },
  {
    name: "New Item Alert",
    content: {
      text: "NEW ITEM ALERT",
      subtitle: "Check out our latest addition",
      background_color: "#10b981",
      text_color: "#ffffff",
      font_size: 16,
      font_weight: "bold" as const,
      border_radius: 8,
      padding: 16,
      alignment: "center" as const
    }
  },
  {
    name: "Daily Special",
    content: {
      text: "TODAY'S SPECIAL",
      subtitle: "Limited availability",
      background_color: "#8b5cf6",
      text_color: "#ffffff",
      font_size: 16,
      font_weight: "bold" as const,
      border_radius: 8,
      padding: 16,
      alignment: "center" as const
    }
  }
]

// Define grid dimensions for mobile layout
const GRID_ROWS = 12
const GRID_COLS = 4
const CELL_SIZE = 48

export function MenuLayoutDesigner({ 
  config, 
  onChange, 
  businessType, 
  selectedMenu,
  onSaveConfig,
  items,
  categories 
}: MenuLayoutDesignerProps) {
  const { toast } = useToast()
  const gridRef = useRef<HTMLDivElement>(null)
  

const [sectionsRestored, setSectionsRestored] = useState(false)



  
  // ✅ FIXED: Use useMemo and useCallback to prevent unnecessary re-renders
  const [gridLayout, setGridLayout] = useState<GridCell[][]>(() => {
    const grid: GridCell[][] = []
    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = []
      for (let col = 0; col < GRID_COLS; col++) {
        grid[row][col] = { row, col, isOccupied: false }
      }
    }
    return grid
  })
  
  const [sections, setSections] = useState<LayoutSection[]>([])
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isDirty, setIsDirty] = useState(false) 

  // Content editor state
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<LayoutSection | null>(null)
  const [pendingSection, setPendingSection] = useState<{type: string, position?: {row: number, col: number}} | null>(null)

  // Remove conflicting local state - make component fully controlled
  const layoutType = config?.layout_type || 'list'
  const columns = config?.columns || 1

  // Auto-save with debouncing to prevent freezing
  const debouncedSave = useDebouncedCallback(
    async (configToSave: any) => {
      if (onSaveConfig) {
        try {
          await onSaveConfig(configToSave)
          console.log('🔄 Auto-saved configuration')
        } catch (error) {
          console.error('❌ Auto-save failed:', error)
        }
      }
    },
    500 // 500ms debounce
  )

  // ✅ CRITICAL: Load sections from saved config FIRST
  useEffect(() => {
    console.log('🔄 Config sections effect - sections in config:', config?.sections?.length || 0)
    
    if (config?.sections && config.sections.length > 0) {
      console.log('📥 Restoring sections from config:', config.sections.length, 'sections')
      
      // Reconstruct sections from config
      const restoredSections: LayoutSection[] = config.sections.map((section: any) => ({
        id: section.id,
        type: section.type,
        gridPosition: section.gridPosition || { row: 0, col: 0 },
        gridSize: section.gridSize || { rowSpan: 1, colSpan: 4 },
        content: section.content,
        style: section.style,
        title: section.title,
        category_id: section.category_id,
        editable: section.editable !== false
      }))
      
      console.log('✅ Setting restored sections:', restoredSections.map(s => ({ 
        id: s.id, 
        type: s.type, 
        editable: s.editable 
      })))
      
      setSections(restoredSections)
      updateGridOccupancy(restoredSections)
      
      // Mark as restored
      setSectionsRestored(true)
    }
  }, [config?.sections])

  // ✅ SMART: Only regenerate when we have categories but NO sections from config
  useEffect(() => {
    console.log('🧠 Smart section management check:', {
      categories: categories.length,
      items: items.length,
      sections: sections.length,
      hasConfigSections: !!(config?.sections && config.sections.length > 0),
      sectionsRestored
    })
    
    // Don't run if we have no categories yet
    if (categories.length === 0) {
      console.log('⏳ Waiting for categories to load')
      return
    }

    // ✅ CRITICAL: Don't run if config has sections (they will be restored by the other effect)
    if (config?.sections && config.sections.length > 0) {
      console.log('⏭️ Skipping smart management - config has sections that will be restored')
      return
    }

    // ✅ CRITICAL: Don't regenerate if we already have sections
    if (sections.length > 0) {
      const hasPromotionalSections = sections.some(s => s.editable && (s.type === 'ad' || s.type === 'promotion' || s.type === 'special'))
      
      if (hasPromotionalSections) {
        console.log('⏭️ Skipping regeneration - preserving promotional sections:', sections.filter(s => s.editable).length)
        return
      }
      
      console.log('⏭️ Skipping regeneration - sections already exist')
      return
    }

    // Only generate if we have categories but no config sections and no current sections
    console.log('🔄 Generating fresh sections for categories (no config sections exist)')

    const styling = {
      background_color: config?.theme?.bg_color || config?.styling?.background_color || '#f5f5f5',
      card_color: config?.theme?.card_color || config?.styling?.card_color || '#ffffff',
      text_color: config?.theme?.text_color || config?.styling?.text_color || '#1f2937',
      primary_color: config?.theme?.primary_color || config?.styling?.primary_color || '#3b82f6',
      card_elevation: config?.theme?.card_elevation || config?.styling?.card_elevation || 2,
      border_radius: config?.theme?.border_radius || config?.styling?.border_radius || 8
    }

    const updatedSections = SectionManager.updateCategorySections(
      [], // Start with empty array when generating fresh
      categories,
      items,
      selectedMenu,
      layoutType,
      columns,
      styling
    )

    const finalSections = SectionManager.repositionSectionsIfNeeded(updatedSections)

    console.log('✅ Generated fresh sections:', finalSections.length)
    setSections(finalSections)
    updateGridOccupancy(finalSections)
  }, [categories, items, selectedMenu, layoutType, columns, config?.sections])

  // ✅ Menu change - reset flag when menu changes
  useEffect(() => {
    console.log('🔄 Menu change detection for:', selectedMenu)
    setSectionsRestored(false)
  }, [selectedMenu])

      



  // ✅ Menu change - reset restoration flag when menu actually changes
  useEffect(() => {
    console.log('🔄 Menu change detection for:', selectedMenu)
    
    // Reset restoration flag when menu changes to allow fresh loading
    setSectionsRestored(false)
    
  }, [selectedMenu])





  // Only reset sections when menu ACTUALLY changes, not on every render
  useEffect(() => {
    console.log('🔄 Menu change detection for:', selectedMenu)
    
    // Don't do anything - let the smart section management handle everything
    // The aggressive clearing was the problem!
    
  }, [selectedMenu])
  
 

  
  const updateGridOccupancy = useCallback((currentSections: LayoutSection[]) => {
    const newGrid: GridCell[][] = []
    for (let row = 0; row < GRID_ROWS; row++) {
      newGrid[row] = []
      for (let col = 0; col < GRID_COLS; col++) {
        newGrid[row][col] = { row, col, isOccupied: false }
      }
    }

    currentSections.forEach(section => {
      const { row, col } = section.gridPosition
      const { rowSpan, colSpan } = section.gridSize
      
      for (let r = row; r < Math.min(row + rowSpan, GRID_ROWS); r++) {
        for (let c = col; c < Math.min(col + colSpan, GRID_COLS); c++) {
          if (newGrid[r] && newGrid[r][c]) {
            newGrid[r][c].isOccupied = true
            newGrid[r][c].occupiedBy = section.id
          }
        }
      }
    })

    setGridLayout(newGrid)
  }, [])

  const canPlaceSection = useCallback((row: number, col: number, rowSpan: number, colSpan: number, excludeId?: string) => {
    if (row < 0 || col < 0 || row + rowSpan > GRID_ROWS || col + colSpan > GRID_COLS) {
      return false
    }

    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        const cell = gridLayout[r]?.[c]
        if (cell?.isOccupied && cell.occupiedBy !== excludeId) {
          return false
        }
      }
    }
    return true
  }, [gridLayout])

  const findNearestAvailablePosition = useCallback((targetRow: number, targetCol: number, rowSpan: number, colSpan: number, excludeId?: string) => {
    // Try the exact position first
    if (canPlaceSection(targetRow, targetCol, rowSpan, colSpan, excludeId)) {
      return { row: targetRow, col: targetCol }
    }

    // Search in expanding circles around the target position
    for (let radius = 1; radius < Math.max(GRID_ROWS, GRID_COLS); radius++) {
      for (let row = Math.max(0, targetRow - radius); row <= Math.min(GRID_ROWS - rowSpan, targetRow + radius); row++) {
        for (let col = Math.max(0, targetCol - radius); col <= Math.min(GRID_COLS - colSpan, targetCol + radius); col++) {
          if (canPlaceSection(row, col, rowSpan, colSpan, excludeId)) {
            return { row, col }
          }
        }
      }
    }

    return null
  }, [canPlaceSection])

  const gridToPixel = useCallback((row: number, col: number) => ({
    x: col * CELL_SIZE + 8,
    y: row * CELL_SIZE + 8
  }), [])

  const pixelToGrid = useCallback((x: number, y: number) => ({
    row: Math.floor((y - 8) / CELL_SIZE),
    col: Math.floor((x - 8) / CELL_SIZE)
  }), [])

  const openContentEditor = useCallback((sectionType: string, existingSection?: LayoutSection) => {
    const sectionTypeConfig = SECTION_TYPES.find(t => t.value === sectionType)
    if (!sectionTypeConfig) return

    if (existingSection) {
      setEditingSection(existingSection)
    } else {
      const newSection: LayoutSection = {
        id: `${sectionType}-${Date.now()}`,
        type: sectionType as any,
        gridPosition: { row: 0, col: 0 },
        gridSize: sectionTypeConfig.defaultSize,
        content: { ...sectionTypeConfig.defaultContent },
        editable: true,
        title: sectionTypeConfig.label
      }
      setEditingSection(newSection)
      setPendingSection({ type: sectionType })
    }
    setIsContentEditorOpen(true)
  }, [])

  const saveContentEditor = useCallback(async () => {
    if (!editingSection) return

    try {
      if (pendingSection) {
        // Adding new section
        const position = findNearestAvailablePosition(0, 0, editingSection.gridSize.rowSpan, editingSection.gridSize.colSpan)
        if (!position) {
          toast({
            title: "No Space Available",
            description: "Cannot add section - grid is full.",
            variant: "destructive"
          })
          return
        }

        const newSection = {
          ...editingSection,
          gridPosition: position
        }

        console.log('💾 Adding new section:', newSection)
        const updatedSections = [...sections, newSection]
        setSections(updatedSections)
        updateGridOccupancy(updatedSections)
        setPendingSection(null)

        toast({
          title: "Section Added",
          description: `${editingSection.title} has been added to ${selectedMenu}.`,
        })
      } else {
        // Updating existing section
        console.log('💾 Updating existing section:', editingSection.id)
        const updatedSections = sections.map(s => 
          s.id === editingSection.id ? editingSection : s
        )
        setSections(updatedSections)
        updateGridOccupancy(updatedSections)

        toast({
          title: "Section Updated",
          description: "Content has been updated successfully.",
        })
      }

      setIsContentEditorOpen(false)
      setEditingSection(null)
    } catch (error) {
      console.error('❌ Error saving content:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save section content.",
        variant: "destructive"
      })
    }
  }, [editingSection, pendingSection, sections, findNearestAvailablePosition, updateGridOccupancy, selectedMenu, toast])

  const deleteSection = useCallback((id: string) => {
    const updatedSections = sections.filter(s => s.id !== id)
    setSections(updatedSections)
    updateGridOccupancy(updatedSections)
    if (selectedSection === id) {
      setSelectedSection(null)
    }
  }, [sections, updateGridOccupancy, selectedSection])

  const handleMouseDown = useCallback((e: React.MouseEvent, sectionId: string) => {
    e.preventDefault()
    setDraggedSection(sectionId)
    setSelectedSection(sectionId)
    setIsDragging(true)
    setShowGrid(true)
    
    const section = sections.find(s => s.id === sectionId)
    if (section && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect()
      const sectionPos = gridToPixel(section.gridPosition.row, section.gridPosition.col)
      setDragOffset({
        x: e.clientX - rect.left - sectionPos.x,
        y: e.clientY - rect.top - sectionPos.y
      })
    }
  }, [sections, gridToPixel])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedSection || !gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    
    const gridPos = pixelToGrid(x, y)
    const section = sections.find(s => s.id === draggedSection)
    
    if (section) {
      const { rowSpan, colSpan } = section.gridSize
      const snappedPos = findNearestAvailablePosition(gridPos.row, gridPos.col, rowSpan, colSpan, draggedSection)
      
      if (snappedPos) {
        setSections(prev => prev.map(s => 
          s.id === draggedSection 
            ? { ...s, gridPosition: snappedPos }
            : s
        ))
      }
    }
  }, [draggedSection, dragOffset, sections, pixelToGrid, findNearestAvailablePosition])

  const handleMouseUp = useCallback(() => {
    if (draggedSection) {
      updateGridOccupancy(sections)
    }
    setDraggedSection(null)
    setIsDragging(false)
    setShowGrid(false)
  }, [draggedSection, sections, updateGridOccupancy])

  // Event listeners with proper cleanup
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // ✅ FIXED: Handle layout type changes properly
  const handleLayoutTypeChange = useCallback((type: 'list' | 'grid') => {
    console.log('🔄 Layout type changing to:', type)
    const newColumns = type === 'grid' ? Math.max(columns, 2) : 1
    
    onChange({
      layout_type: type,
      columns: newColumns
    })
  }, [onChange, columns])

  const handleColumnsChange = useCallback((newColumns: number[]) => {
    console.log('🔄 Columns changing to:', newColumns[0])
    
    onChange({
      columns: newColumns[0]
    })
  }, [onChange])

  const updateSections = useCallback(async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving COMPLETE configuration (theme + layout):', {
        layoutType,
        columns,
        sectionsCount: sections.length,
        hasTheme: !!(config?.theme || config?.styling)
      })
  
      // Apply current theme to sections before saving
      let finalSections = sections
      if (config?.theme || config?.styling) {
        console.log('🎨 Applying current theme to sections before save')
        finalSections = SectionManager.applyThemeToSections(sections, config.theme || config.styling)
        
        // Update UI with themed sections
        setSections(finalSections)
        updateGridOccupancy(finalSections)
      }
    
      const configSections = finalSections.map(section => ({
        id: section.id,
        type: section.type,
        gridPosition: section.gridPosition,
        gridSize: section.gridSize,
        content: section.content,
        style: section.style,
        title: section.title,
        category_id: section.category_id,
        editable: section.editable
      }))
      
      const currentStyling = config?.styling || config?.theme || {}
      const updatedStyling = {
        background_color: currentStyling.bg_color || currentStyling.background_color || '#f5f5f5',
        card_color: currentStyling.card_color || '#ffffff',
        text_color: currentStyling.text_color || '#1f2937',
        primary_color: currentStyling.primary_color || '#3b82f6',
        card_elevation: currentStyling.card_elevation || 2,
        border_radius: currentStyling.border_radius || 8
      }
        
      const updatedConfig = {
        ...config,
        layout_type: layoutType,
        columns: columns,
        theme: config?.theme || {}, // Preserve existing theme
        styling: updatedStyling,
        sections: configSections,
        selectedMenu: selectedMenu
      }
  
      onChange(updatedConfig)
      
      if (onSaveConfig) {
        await onSaveConfig(updatedConfig)
      }
  
      setIsDirty(false)
      toast({
        title: "Layout & Theme Saved",
        description: `Complete configuration saved for ${selectedMenu}.`,
      })
    } catch (error) {
      console.error('Error saving complete configuration:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save configuration.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [sections, config, layoutType, columns, selectedMenu, onChange, onSaveConfig, toast, updateGridOccupancy])

  const renderSectionContent = useCallback((section: LayoutSection) => {
    if (section.type === 'items') {
      // Use standardized filtering
      const sectionItems = filterItemsByCategory(items, section.category_id || '')
  
      if (layoutType === 'grid') {
        return (
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}
          >
            {sectionItems.slice(0, 8).map((item, index) => (
              <div key={index} className="bg-white rounded p-1 border text-xs">
                <div className="font-medium truncate">{item.data.name}</div>
                <div className="text-green-600 font-bold">${item.data.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )
      } else {
        return (
          <div className="space-y-1">
            {sectionItems.slice(0, 6).map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-white rounded px-2 py-1 text-xs">
                <span className="font-medium truncate">{item.data.name}</span>
                <span className="text-green-600 font-bold">${item.data.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )
      }
    }
  
    // Rest of the function remains the same...
    if (section.type === 'category') {
      return (
        <div 
          className="w-full h-full flex items-center px-2 rounded font-bold text-sm"
          style={{
            backgroundColor: section.content?.background_color || '#f3f4f6',
            color: section.content?.text_color || '#1f2937',
            fontSize: `${section.content?.font_size || 16}px`,
            fontWeight: section.content?.font_weight || 'bold',
            borderRadius: `${section.content?.border_radius || 8}px`,
            padding: `${section.content?.padding || 12}px`,
            textAlign: section.content?.alignment || 'left'
          }}
        >
          {section.content?.text || section.title}
        </div>
      )
    }
  
    if (section.content) {
      return (
        <div 
          className="w-full h-full flex flex-col justify-center items-center text-center rounded"
          style={{
            backgroundColor: section.content.background_color,
            color: section.content.text_color,
            fontSize: `${section.content.font_size}px`,
            fontWeight: section.content.font_weight,
            borderRadius: `${section.content.border_radius}px`,
            padding: `${section.content.padding}px`,
            textAlign: section.content.alignment as any
          }}
        >
          <div className="font-bold">{section.content.text}</div>
          {section.content.subtitle && (
            <div className="text-sm opacity-90 mt-1">{section.content.subtitle}</div>
          )}
          {section.content.image_url && (
            <img 
              src={section.content.image_url} 
              alt="" 
              className="mt-2 max-w-full max-h-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>
      )
    }
  
    return (
      <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
        {section.title}
      </div>
    )
  }, [items, layoutType, columns])

  // ✅ FIXED: Add loading state display
  if (isLoadingConfig) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading layout configuration...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Layout Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Layout Settings - {selectedMenu}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading layout settings...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Layout Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={layoutType === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLayoutTypeChange('list')}
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    List
                  </Button>
                  <Button
                    variant={layoutType === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLayoutTypeChange('grid')}
                    className="flex items-center gap-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </Button>
                </div>
                {/* Debug info - remove after testing */}
                <div className="text-xs text-gray-500">
                  Current: {layoutType} | Config: {config?.layout_type}
                </div>
              </div>

              {layoutType === 'grid' && (
                <div className="space-y-2">
                  <Label>Columns: {columns}</Label>
                  <Slider
                    value={[columns]}
                    onValueChange={handleColumnsChange}
                    max={8}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                  {/* Debug info - remove after testing */}
                  <div className="text-xs text-gray-500">
                    Current: {columns} | Config: {config?.columns}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Content Sections
            </span>
            <Badge variant="outline">{sections.length} sections in {selectedMenu}</Badge>
          </CardTitle>
          <CardDescription>
            Add promotional content between your menu categories. Categories and items are auto-generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {SECTION_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => openContentEditor(type.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  Add {type.label}
                </Button>
              )
            })}
          </div>

          {/* WYSIWYG Mobile Layout Designer */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 relative">
            <div className="flex justify-center">
              {/* Phone Frame */}
              <div className="relative bg-gray-900 rounded-3xl p-4 shadow-2xl">
                <div className="w-80 h-[600px] bg-black rounded-2xl overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 z-20 bg-black text-white text-xs flex justify-between items-center px-4 py-2">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-white rounded-sm"></div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="absolute top-8 left-0 right-0 z-20 bg-blue-600 px-4 py-3">
                    <h1 className="text-white font-semibold text-center">{selectedMenu}</h1>
                  </div>

                  {/* Grid Container */}
                  <div 
                    ref={gridRef}
                    className="absolute top-20 left-4 right-4 bottom-4 bg-white rounded-lg overflow-auto relative"
                    style={{ 
                      width: GRID_COLS * CELL_SIZE + 16, 
                      height: GRID_ROWS * CELL_SIZE + 16,
                      margin: '0 auto'
                    }}
                  >
                    {/* Grid Lines (show when dragging or always in design mode) */}
                    {(showGrid || isDragging) && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Vertical lines */}
                        {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
                          <div
                            key={`v-${i}`}
                            className="absolute top-0 bottom-0 border-l border-blue-200"
                            style={{ left: i * CELL_SIZE + 8 }}
                          />
                        ))}
                        {/* Horizontal lines */}
                        {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
                          <div
                            key={`h-${i}`}
                            className="absolute left-0 right-0 border-t border-blue-200"
                            style={{ top: i * CELL_SIZE + 8 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Rendered Sections with Real Content */}
                    {sections.map((section) => {
                      const isSelected = selectedSection === section.id
                      const position = gridToPixel(section.gridPosition.row, section.gridPosition.col)
                      
                      return (
                        <div
                          key={section.id}
                          className={`absolute border-2 rounded-lg transition-all group ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 z-10' 
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          } ${
                            section.editable ? 'cursor-move' : 'cursor-default'
                          }`}
                          style={{
                            left: position.x,
                            top: position.y,
                            width: section.gridSize.colSpan * CELL_SIZE - 4,
                            height: section.gridSize.rowSpan * CELL_SIZE - 4,
                            opacity: draggedSection === section.id ? 0.7 : 1
                          }}
                          onMouseDown={(e) => section.editable && handleMouseDown(e, section.id)}
                          onClick={() => setSelectedSection(section.id)}
                        >
                          {/* Section Controls */}
                          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {section.editable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openContentEditor(section.type, section)
                                }}
                                className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-100"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {section.editable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSection(section.id)
                                }}
                                className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Section Content */}
                          <div className="w-full h-full p-1 overflow-hidden">
                            {renderSectionContent(section)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No sections added to {selectedMenu}</p>
              <p className="text-sm">Categories and items will auto-populate. Add promotional content above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Editor Dialog */}
      <Dialog open={isContentEditorOpen} onOpenChange={setIsContentEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {pendingSection ? 'Create' : 'Edit'} {editingSection?.title}
            </DialogTitle>
            <DialogDescription>
              Design your promotional content with custom text, colors, and styling.
            </DialogDescription>
          </DialogHeader>

          {editingSection && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TEMPLATES.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection({
                        ...editingSection,
                        content: { ...template.content }
                      })}
                      className="h-auto p-2 text-xs"
                    >
                      <div className="text-center">
                        <div className="font-bold">{template.content.text}</div>
                        <div className="text-xs opacity-70">{template.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Content Editor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Main Text</Label>
                    <Input
                      value={editingSection.content?.text || ''}
                      onChange={(e) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, text: e.target.value }
                      })}
                      placeholder="Enter main text"
                    />
                  </div>

                  <div>
                    <Label>Subtitle (Optional)</Label>
                    <Input
                      value={editingSection.content?.subtitle || ''}
                      onChange={(e) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, subtitle: e.target.value }
                      })}
                      placeholder="Enter subtitle"
                    />
                  </div>

                  <div>
                    <Label>Image URL (Optional)</Label>
                    <Input
                      value={editingSection.content?.image_url || ''}
                      onChange={(e) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, image_url: e.target.value }
                      })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Text Alignment</Label>
                    <Select
                      value={editingSection.content?.alignment || 'center'}
                      onValueChange={(value: 'left' | 'center' | 'right') => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, alignment: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSection.content?.background_color || '#3b82f6'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          content: { ...editingSection.content!, background_color: e.target.value }
                        })}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editingSection.content?.background_color || '#3b82f6'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          content: { ...editingSection.content!, background_color: e.target.value }
                        })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSection.content?.text_color || '#ffffff'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          content: { ...editingSection.content!, text_color: e.target.value }
                        })}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editingSection.content?.text_color || '#ffffff'}
                        onChange={(e) => setEditingSection({
                          ...editingSection,
                          content: { ...editingSection.content!, text_color: e.target.value }
                        })}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Font Size: {editingSection.content?.font_size || 16}px</Label>
                    <Slider
                      value={[editingSection.content?.font_size || 16]}
                      onValueChange={(value) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, font_size: value[0] }
                      })}
                      min={12}
                      max={32}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Border Radius: {editingSection.content?.border_radius || 8}px</Label>
                    <Slider
                      value={[editingSection.content?.border_radius || 8]}
                      onValueChange={(value) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, border_radius: value[0] }
                      })}
                      min={0}
                      max={24}
                      step={2}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Padding: {editingSection.content?.padding || 16}px</Label>
                    <Slider
                      value={[editingSection.content?.padding || 16]}
                      onValueChange={(value) => setEditingSection({
                        ...editingSection,
                        content: { ...editingSection.content!, padding: value[0] }
                      })}
                      min={8}
                      max={32}
                      step={4}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div 
                    className="w-full max-w-xs mx-auto flex flex-col justify-center items-center text-center rounded"
                    style={{
                      backgroundColor: editingSection.content?.background_color,
                      color: editingSection.content?.text_color,
                      fontSize: `${editingSection.content?.font_size}px`,
                      fontWeight: editingSection.content?.font_weight,
                      borderRadius: `${editingSection.content?.border_radius}px`,
                      padding: `${editingSection.content?.padding}px`,
                      textAlign: editingSection.content?.alignment
                    }}
                  >
                    <div className="font-bold">{editingSection.content?.text || 'Sample Text'}</div>
                    {editingSection.content?.subtitle && (
                      <div className="text-sm opacity-90 mt-1">{editingSection.content.subtitle}</div>
                    )}
                    {editingSection.content?.image_url && (
                      <img 
                        src={editingSection.content.image_url} 
                        alt="" 
                        className="mt-2 max-w-full max-h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContentEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveContentEditor}>
              {pendingSection ? 'Add Section' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Changes */}
      <div className="flex justify-end gap-2">
        <Badge variant="outline" className="mr-auto">
          {sections.filter(s => s.type === 'category' || s.type === 'items').length} auto-generated + {sections.filter(s => s.editable).length} custom sections
        </Badge>
        <Button 
          onClick={updateSections} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>
    </div>
  )
}