// Path: /types/menu.ts
// Name: Menu Types - Enhanced data structures for WYSIWYG menu system

export interface SectionContent {
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
  
  export interface LayoutSection {
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
  
  export interface MenuConfig {
    layout_type: 'list' | 'grid'
    columns?: number
    theme: {
      bg_color: string
      card_color: string
      text_color: string
      primary_color: string
      card_elevation: number
      border_radius: number
    }
    sections: LayoutSection[]
    selectedMenu: string
  }
  
  export interface MenuItem {
    id: string
    data: {
      name: string
      price: number
      description: string
      image_url?: string
      category?: string
      year?: string | number
      mileage?: string | number
      duration?: string | number
      sku?: string
      [key: string]: any
    }
    category_id?: string
    is_active: boolean
    date_created: string
    menu_name: string
  }
  
  export interface Category {
    id: string
    name: string
    description?: string
    position: number
    is_active: boolean
    color?: string
    icon?: string
    date_created?: string
  }
  
  export interface ContentTemplate {
    name: string
    content: SectionContent
  }