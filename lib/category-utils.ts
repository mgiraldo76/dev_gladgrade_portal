// Path: /lib/category-utils.ts
// Name: Category Utilities - Standardized Category ID Resolution

interface MenuItem {
    id: string
    category_id?: string | number
    data: {
      category_id?: string | number
      category?: string
      [key: string]: any
    }
  }
  
  interface Category {
    id: string | number
    name: string
    color?: string
    icon?: string
  }
  
  /**
   * Get the authoritative category ID for an item
   * Priority: item.category_id -> item.data.category_id -> null
   */
  export function getItemCategoryId(item: MenuItem): string | null {
    // Priority 1: Direct category_id column
    if (item.category_id !== undefined && item.category_id !== null && item.category_id !== '') {
      return String(item.category_id)
    }
    
    // Priority 2: JSONB data.category_id
    if (item.data?.category_id !== undefined && item.data.category_id !== null && item.data.category_id !== '') {
      return String(item.data.category_id)
    }
    
    return null
  }
  
  /**
   * Check if an item belongs to a specific category
   */
  export function itemBelongsToCategory(item: MenuItem, categoryId: string | number): boolean {
    const itemCategoryId = getItemCategoryId(item)
    return itemCategoryId === String(categoryId)
  }
  
  /**
   * Filter items by category using standardized logic
   */
  export function filterItemsByCategory(items: MenuItem[], categoryId: string | number): MenuItem[] {
    return items.filter(item => itemBelongsToCategory(item, categoryId))
  }
  
  /**
   * Get the category object for an item
   */
  export function getItemCategory(item: MenuItem, categories: Category[]): Category | null {
    const categoryId = getItemCategoryId(item)
    if (!categoryId) return null
    
    return categories.find(cat => String(cat.id) === categoryId) || null
  }
  
  /**
   * Group items by their categories
   */
  export function groupItemsByCategory(items: MenuItem[], categories: Category[]): Record<string, { category: Category | null, items: MenuItem[] }> {
    const grouped: Record<string, { category: Category | null, items: MenuItem[] }> = {}
    
    items.forEach(item => {
      const categoryId = getItemCategoryId(item) || 'uncategorized'
      
      if (!grouped[categoryId]) {
        const category = categoryId === 'uncategorized' 
          ? null 
          : categories.find(cat => String(cat.id) === categoryId) || null
        
        grouped[categoryId] = {
          category,
          items: []
        }
      }
      
      grouped[categoryId].items.push(item)
    })
    
    return grouped
  }