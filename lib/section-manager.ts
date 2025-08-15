// Path: /lib/section-manager.ts
// Name: Smart Section Manager - Preserves promotional content while managing categories

import { groupItemsByCategory } from './category-utils'

interface LayoutSection {
  id: string
  type: 'items' | 'ad' | 'promotion' | 'special' | 'category'
  gridPosition: { row: number; col: number }
  gridSize: { rowSpan: number; colSpan: number }
  content?: any
  style?: any
  title?: string
  category_id?: string
  editable: boolean
}

interface Category {
  id: string | number
  name: string
  color?: string
  icon?: string
}

interface MenuItem {
  id: string
  category_id?: string | number
  data: any
  is_active: boolean
  menu_name: string
}

export class SectionManager {
  /**
   * Apply theme changes ONLY to category sections (promotional sections untouched)
   */
  static applyThemeToSections(sections: LayoutSection[], newTheme: any): LayoutSection[] {
    return sections.map(section => {
      if (section.type === 'category' && section.content) {
        return {
          ...section,
          content: {
            ...section.content,
            background_color: newTheme.primary_color || section.content.background_color,
            border_radius: newTheme.border_radius || section.content.border_radius
          }
        }
      }
      return section // Promotional sections unchanged
    })
  }

  /**
   * Smart category regeneration - preserves promotional sections
   */
  static updateCategorySections(
    currentSections: LayoutSection[],
    categories: Category[],
    items: MenuItem[],
    selectedMenu: string,
    layoutType: string,
    columns: number,
    styling: any
  ): LayoutSection[] {
    // SACRED: Preserve ALL promotional sections
    const promotionalSections = currentSections.filter(s => 
      s.editable && (s.type === 'ad' || s.type === 'promotion' || s.type === 'special')
    )

    console.log('🛡️ PRESERVING promotional sections:', promotionalSections.length)

    // Filter items for current menu
    const currentMenuItems = items.filter(item => {
      const itemMenuName = item.menu_name || 'Default Menu'
      return itemMenuName === selectedMenu && item.is_active
    })

    // Group items by categories
    const itemsByCategory = groupItemsByCategory(currentMenuItems, categories)

    // Find occupied rows by promotional content
    const occupiedRows = new Set<number>()
    promotionalSections.forEach(section => {
      const { row } = section.gridPosition
      const { rowSpan } = section.gridSize
      for (let r = row; r < row + rowSpan; r++) {
        occupiedRows.add(r)
      }
    })

    // Helper to find next available row
    const findNextAvailableRow = (startRow: number): number => {
      let testRow = startRow
      while (occupiedRows.has(testRow)) {
        testRow++
      }
      return testRow
    }

    // Generate fresh category/items sections
    const newCategorySections: LayoutSection[] = []
    let currentRow = 0

    Object.entries(itemsByCategory).forEach(([categoryId, { category, items: categoryItems }]) => {
      if (categoryId === 'uncategorized' || !category) return

      // Find available row for category header
      currentRow = findNextAvailableRow(currentRow)

      // Category header section
      newCategorySections.push({
        id: `category-${category.id}`,
        type: 'category',
        gridPosition: { row: currentRow, col: 0 },
        gridSize: { rowSpan: 1, colSpan: 4 },
        title: category.name,
        category_id: String(category.id),
        editable: false,
        content: {
          text: category.name,
          background_color: category.color || styling.primary_color,
          text_color: '#ffffff',
          font_size: 18,
          font_weight: 'bold',
          border_radius: styling.border_radius || 8,
          padding: 12,
          alignment: 'left'
        }
      })
      currentRow++

      // Find available row for items section
      currentRow = findNextAvailableRow(currentRow)

      // Items section
      const itemsRows = layoutType === 'grid' 
        ? Math.ceil(Math.max(categoryItems.length, 1) / columns) 
        : Math.max(categoryItems.length, 1)
      
      newCategorySections.push({
        id: `items-${category.id}`,
        type: 'items',
        gridPosition: { row: currentRow, col: 0 },
        gridSize: { rowSpan: itemsRows, colSpan: 4 },
        category_id: String(category.id),
        editable: false,
        title: `${category.name} Items`
      })
      currentRow += itemsRows + 1
    })

    console.log('✅ Generated category sections:', newCategorySections.length)
    console.log('🛡️ Preserved promotional sections:', promotionalSections.length)

    // Combine: category sections + preserved promotional sections
    return [...newCategorySections, ...promotionalSections]
  }

  /**
   * Reposition promotional sections when layout changes (avoid overlaps)
   */
  static repositionSectionsIfNeeded(sections: LayoutSection[]): LayoutSection[] {
    // Check for overlaps and reposition if needed
    const occupancyMap = new Map<string, string>()
    const repositioned: LayoutSection[] = []

    // First pass: place category sections (they have priority)
    sections.filter(s => s.type === 'category' || s.type === 'items').forEach(section => {
      repositioned.push(section)
      
      // Mark occupied cells
      for (let r = section.gridPosition.row; r < section.gridPosition.row + section.gridSize.rowSpan; r++) {
        for (let c = section.gridPosition.col; c < section.gridPosition.col + section.gridSize.colSpan; c++) {
          occupancyMap.set(`${r}-${c}`, section.id)
        }
      }
    })

    // Second pass: reposition promotional sections if they overlap
    sections.filter(s => s.editable && (s.type === 'ad' || s.type === 'promotion' || s.type === 'special')).forEach(section => {
      let targetRow = section.gridPosition.row
      let targetCol = section.gridPosition.col

      // Check if current position is available
      let isPositionAvailable = true
      for (let r = targetRow; r < targetRow + section.gridSize.rowSpan; r++) {
        for (let c = targetCol; c < targetCol + section.gridSize.colSpan; c++) {
          if (occupancyMap.has(`${r}-${c}`)) {
            isPositionAvailable = false
            break
          }
        }
        if (!isPositionAvailable) break
      }

      // If position is occupied, find next available position
      if (!isPositionAvailable) {
        let maxRow = 0
        occupancyMap.forEach((_, key) => {
          const row = parseInt(key.split('-')[0])
          maxRow = Math.max(maxRow, row)
        })
        targetRow = maxRow + 1
        targetCol = 0
      }

      const repositionedSection = {
        ...section,
        gridPosition: { row: targetRow, col: targetCol }
      }

      repositioned.push(repositionedSection)

      // Mark new occupied cells
      for (let r = targetRow; r < targetRow + section.gridSize.rowSpan; r++) {
        for (let c = targetCol; c < targetCol + section.gridSize.colSpan; c++) {
          occupancyMap.set(`${r}-${c}`, section.id)
        }
      }
    })

    return repositioned
  }
}