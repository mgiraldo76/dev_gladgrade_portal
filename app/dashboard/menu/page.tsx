// Path: /app/dashboard/menu/page.tsx
// Name: FIXED Menu Management Page - Prevents Freezing and Enables Saving

"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/app/providers"
import { apiClient } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Palette, 
  Layout, 
  Plus, 
  History, 
  Eye, 
  Save, 
  Upload as Publish,
  ArrowLeft,
  Settings,
  Tag,
  DollarSign,
  Copy,
  Trash2,
  AlertCircle,
  Edit,        
  Upload as UploadIcon 
} from "lucide-react"

// Import our custom components
import { MenuLayoutDesigner } from "@/components/menu/MenuLayoutDesigner"
import { ThemeCustomizer } from "@/components/menu/ThemeCustomizer"
import { CategoryManager } from "@/components/menu/CategoryManager"
import { ItemManager } from "@/components/menu/ItemManager"
import { VersionController } from "@/components/menu/VersionController"
import { MobilePreview } from "@/components/menu/MobilePreview"
import { BusinessTypeDetector } from "@/components/menu/BusinessTypeDetector"
import { formatDistanceToNow } from "date-fns"

interface MenuConfig {
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
  // ✅ FIXED: Add styling for Flutter compatibility
  styling: {
    background_color: string
    card_color: string
    text_color: string
    primary_color: string
    card_elevation: number
    border_radius: number
  }
  sections: Array<{
    type: 'items' | 'ad' | 'promotion' | 'special'
    gridPosition?: { row: number; col: number }
    gridSize?: { rowSpan: number; colSpan: number }
    position?: 'top' | 'middle' | 'bottom'
    content?: any
    style?: any
    title?: string
  }>
  selectedMenu?: string
}

interface BusinessInfo {
  id: number
  name: string
  item_type: string
  button_label: string
  has_items: boolean
}

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

interface MenuItem {
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

interface MenuInfo {
  name: string
  item_count: number
  is_active: boolean
  is_published: boolean
  config_is_active: boolean
  last_updated: string
}

interface ClientServices {
  services: any[]
  menu_limit: number
  has_unlimited_menus: boolean
}

export default function MenuManagementPage() {
  const { user, role, businessId } = useAuth()
  const { toast } = useToast()
  
  // Core state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [clientServices, setClientServices] = useState<ClientServices | null>(null)
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // Menu management state
  const [availableMenus, setAvailableMenus] = useState<MenuInfo[]>([])
  const [selectedMenu, setSelectedMenu] = useState<string>('')
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [newMenuName, setNewMenuName] = useState('')
  
  // UI state
  const [activeTab, setActiveTab] = useState('layout')
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedMenu) {
      loadMenuData(selectedMenu)
    }
  }, [selectedMenu])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadBusinessInfo(),
        loadClientServices(),
        loadAvailableMenus()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast({
        title: "Error Loading Data",
        description: "Failed to load menu data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadClientServices = async () => {
    try {
      if (!businessId) {
        console.log('⚠️ No businessId available')
        return
      }

      const services = await apiClient.getClientServices(businessId)
      setClientServices(services.data)
      console.log('✅ Client services loaded:', services.data)
    } catch (error) {
      console.error('Error loading client services:', error)
      setClientServices({
        services: [],
        menu_limit: 3,
        has_unlimited_menus: false
      })
    }
  }

  const loadAvailableMenus = async () => {
    try {
      if (!businessId) return
  
      const allItems = await apiClient.menu.getItems(businessId)
      
      const menuMap = new Map<string, MenuInfo>()
      
      allItems.forEach((item: MenuItem) => {
        const menuName = item.menu_name || 'Default Menu'
        if (!menuMap.has(menuName)) {
          menuMap.set(menuName, {
            name: menuName,
            item_count: 0,
            is_active: item.is_active,
            is_published: false,
            config_is_active: true, // Will be updated below
            last_updated: item.date_created
          })
        }
        const menu = menuMap.get(menuName)!
        menu.item_count++
        if (new Date(item.date_created) > new Date(menu.last_updated)) {
          menu.last_updated = item.date_created
        }
      })
  
      // ✅ FIXED: Get actual config is_active state for each menu
      for (const [menuName, menuInfo] of menuMap) {
        try {
          const configResponse = await apiClient.menu.getConfig(businessId!, undefined, menuName)
          if (configResponse && configResponse.id) {
            menuInfo.config_is_active = configResponse.is_active
            menuInfo.is_published = configResponse.is_published
          }
        } catch (error) {
          console.error(`Error getting config state for ${menuName}:`, error)
        }
      }
  
      if (menuMap.size === 0) {
        menuMap.set('Default Menu', {
          name: 'Default Menu',
          item_count: 0,
          is_active: true,
          is_published: false,
          config_is_active: true,
          last_updated: new Date().toISOString()
        })
      }
  
      const menus = Array.from(menuMap.values())
      setAvailableMenus(menus)
      
      console.log('✅ Available menus loaded:', menus)
    } catch (error) {
      console.error('Error loading available menus:', error)
    }
  }

  const loadMenuData = async (menuName: string) => {
    try {
      await Promise.all([
        loadMenuConfig(menuName),
        loadMenuItems(menuName),
        loadCategories()
      ])
    } catch (error) {
      console.error('Error loading menu data:', error)
      toast({
        title: "Error Loading Menu",
        description: `Failed to load ${menuName} data. Please try again.`,
        variant: "destructive"
      })
    }
  }

  const loadBusinessInfo = async () => {
    setBusinessInfo({
      id: businessId || 1,
      name: "Sample Business",
      item_type: "food",
      button_label: "Menu",
      has_items: true
    })
  }

  const loadMenuConfig = async (menuName: string) => {
    try {
      console.log(`🔧 Loading menu config for: ${menuName}`)
      
      // ✅ FIXED: Get the actual config is_active state
      const currentMenu = availableMenus.find(m => m.name === menuName)
      const actualIsActive = currentMenu?.config_is_active ?? true
      
      console.log(`🔧 Using config is_active state: ${actualIsActive} for menu: ${menuName}`)
      
      const response = await apiClient.menu.getConfig(businessId!, undefined, menuName, actualIsActive)
      
      if (response && response.config) {
        console.log('✅ Raw config from API:', response.config)
        
        const dbConfig = response.config
        
        const loadedConfig: MenuConfig = {
          layout_type: dbConfig.layout_type || 'list',
          columns: dbConfig.columns || 1,
          theme: dbConfig.theme || {
            bg_color: '#f5f5f5',
            card_color: '#ffffff',
            text_color: '#1f2937',
            primary_color: '#3b82f6',
            card_elevation: 2,
            border_radius: 8
          },
          styling: dbConfig.styling || dbConfig.theme || {
            background_color: '#f5f5f5',
            card_color: '#ffffff',
            text_color: '#1f2937',
            primary_color: '#3b82f6',
            card_elevation: 2,
            border_radius: 8
          },
          sections: dbConfig.sections || [],
          selectedMenu: menuName
        }
        
        console.log('✅ Final loaded config with correct values:', {
          layout_type: loadedConfig.layout_type,
          columns: loadedConfig.columns,
          sectionsCount: loadedConfig.sections.length
        })
        
        setMenuConfig(loadedConfig)
        setCurrentVersion(response.config_version || 'v1.0.0')
        setIsDirty(false)
      }
    } catch (error) {
      console.error(`❌ Error loading config for ${menuName}:`, error)
      
      toast({
        title: "Configuration Load Failed",
        description: "Failed to load menu configuration.",
        variant: "destructive"
      })
    }
  }

  const loadMenuItems = async (menuName: string) => {
    try {
      if (!businessId) return

      const allItems = await apiClient.menu.getItems(businessId)
      const menuSpecificItems = allItems.filter((item: MenuItem) => 
        (item.menu_name || 'Default Menu') === menuName
      )
      setMenuItems(menuSpecificItems)
    } catch (error) {
      console.error('Error loading menu items:', error)
      setMenuItems([])
    }
  }

  const loadCategories = async () => {
    try {
      if (!businessId) return
      
      const categories = await apiClient.menu.getCategories(businessId)
      setCategories(categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    }
  }

  // ✅ FIXED: Use useCallback to prevent infinite re-renders and remove console.trace
  const handleConfigChange = useCallback((newConfig: Partial<MenuConfig>) => {
    console.log('📝 Config change received:', newConfig)
    console.log('📝 Current menuConfig before update:', menuConfig)
    
    if (menuConfig) {
      const updatedConfig: MenuConfig = { 
        ...menuConfig, 
        ...newConfig,
        // Ensure layout_type and columns are properly set
        layout_type: newConfig.layout_type !== undefined ? newConfig.layout_type : menuConfig.layout_type,
        columns: newConfig.columns !== undefined ? newConfig.columns : menuConfig.columns,
        theme: newConfig.theme ? { ...menuConfig.theme, ...newConfig.theme } : menuConfig.theme,
        sections: newConfig.sections !== undefined ? newConfig.sections : menuConfig.sections,
        styling: newConfig.styling ? { ...menuConfig.styling, ...newConfig.styling } : menuConfig.styling,
        selectedMenu: selectedMenu
      }
      
      console.log('📝 Updated config being set:', updatedConfig)
      setMenuConfig(updatedConfig)
      setIsDirty(true)
    }
  }, [menuConfig, selectedMenu])

  // ✅ FIXED: Proper save draft function that actually saves
  const handleSaveDraft = async () => {
    if (!menuConfig || !businessId) {
      toast({
        title: "Save Failed",
        description: "No configuration to save or missing business ID.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      console.log('💾 Saving draft config:', menuConfig)
      
      const saveResponse = await apiClient.menu.saveConfig(businessId, {
        config: menuConfig,
        config_version: currentVersion,
        menuName: selectedMenu,
        is_draft: true,
        is_published: false
      })
      
      console.log('✅ Draft saved successfully:', saveResponse)
      
      setIsDirty(false)
      toast({
        title: "Draft Saved",
        description: `${selectedMenu} configuration saved as draft.`,
      })
    } catch (error) {
      console.error('❌ Error saving draft:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // ✅ FIXED: Proper publish function that actually publishes
  const handlePublish = async () => {
    if (!menuConfig || !businessId) {
      toast({
        title: "Publish Failed",
        description: "No configuration to publish or missing business ID.",
        variant: "destructive"
      })
      return
    }

    setIsPublishing(true)
    try {
      console.log('🚀 Publishing menu:', selectedMenu)
      
      // First save the current config
      await apiClient.menu.saveConfig(businessId, {
        config: menuConfig,
        config_version: currentVersion,
        menuName: selectedMenu,
        is_draft: false,
        is_published: true
      })
      
      // Then publish this specific menu
      await apiClient.menu.publishMenu(businessId, selectedMenu)
      
      setIsDirty(false)
      
      setAvailableMenus(prev => prev.map(menu => ({
        ...menu,
        is_published: menu.name === selectedMenu
      })))
      
      toast({
        title: "Menu Published",
        description: `${selectedMenu} is now live with the current layout.`,
      })
    } catch (error) {
      console.error('❌ Error publishing menu:', error)
      toast({
        title: "Publish Failed", 
        description: "Failed to publish menu. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const canCreateNewMenu = () => {
    if (!clientServices) return false
    if (clientServices.has_unlimited_menus) return true
    return availableMenus.length < clientServices.menu_limit
  }

  const createNewMenu = async () => {
    if (!newMenuName.trim()) {
      toast({
        title: "Menu Name Required",
        description: "Please enter a name for the new menu.",
        variant: "destructive"
      })
      return
    }

    if (availableMenus.some(menu => menu.name === newMenuName.trim())) {
      toast({
        title: "Menu Name Exists",
        description: "A menu with this name already exists.",
        variant: "destructive"
      })
      return
    }

    if (!canCreateNewMenu()) {
      toast({
        title: "Menu Limit Reached",
        description: `You can only create ${clientServices?.menu_limit} menus with your current plan.`,
        variant: "destructive"
      })
      return
    }

    try {
      const sampleItem = {
        item_type: businessInfo?.item_type || 'food',
        data: {
          name: 'Sample Item',
          price: 0,
          description: 'This is a sample item. You can edit or delete it.',
          category: 'Default'
        },
        menu_name: newMenuName.trim()
      }

      await apiClient.menu.createItem(businessId!, sampleItem)
      
      await loadAvailableMenus()
      setSelectedMenu(newMenuName.trim())
      setNewMenuName('')
      setIsCreateMenuOpen(false)
      
      toast({
        title: "Menu Created",
        description: `${newMenuName} has been created successfully.`,
      })
    } catch (error) {
      console.error('Error creating menu:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create new menu. Please try again.",
        variant: "destructive"
      })
    }
  }

  const duplicateMenu = async (sourceMenuName: string) => {
    const duplicateName = `${sourceMenuName} (Copy)`
    
    if (!canCreateNewMenu()) {
      toast({
        title: "Menu Limit Reached",
        description: `You can only create ${clientServices?.menu_limit} menus with your current plan.`,
        variant: "destructive"
      })
      return
    }

    try {
      const sourceItems = menuItems.filter(item => 
        (item.menu_name || 'Default Menu') === sourceMenuName
      )

      for (const item of sourceItems) {
        const duplicatedItem = {
          item_type: businessInfo?.item_type || 'food',
          data: {
            ...item.data,
            name: item.data.name
          },
          menu_name: duplicateName
        }
        await apiClient.menu.createItem(businessId!, duplicatedItem)
      }

      await loadAvailableMenus()
      setSelectedMenu(duplicateName)
      
      toast({
        title: "Menu Duplicated",
        description: `${duplicateName} created with ${sourceItems.length} items.`,
      })
    } catch (error) {
      console.error('Error duplicating menu:', error)
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate menu. Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteMenu = async (menuName: string) => {
    if (availableMenus.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one menu.",
        variant: "destructive"
      })
      return
    }

    try {
      const menuSpecificItems = menuItems.filter(item => 
        (item.menu_name || 'Default Menu') === menuName
      )

      for (const item of menuSpecificItems) {
        await apiClient.menu.deleteItem(businessId!, item.id)
      }

      await loadAvailableMenus()
      
      if (selectedMenu === menuName) {
        const remainingMenus = availableMenus.filter(m => m.name !== menuName)
        if (remainingMenus.length > 0) {
          setSelectedMenu(remainingMenus[0].name)
        }
      }
      
      toast({
        title: "Menu Deleted",
        description: `${menuName} has been deleted.`,
      })
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast({
        title: "Deletion Failed",
        description: "Failed to delete menu. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your menus...</p>
        </div>
      </div>
    )
  }

  const currentMenu = availableMenus.find(m => m.name === selectedMenu)

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">GladMenu Admin</h1>
            <p className="text-muted-foreground">
              Manage your {businessInfo?.button_label?.toLowerCase() || 'menu'} - {businessInfo?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="secondary" className="text-orange-600 bg-orange-100">
              Unsaved Changes
            </Badge>
          )}
          <Badge variant="outline">
            {currentVersion}
          </Badge>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              
              
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish Menu</AlertDialogTitle>
                <AlertDialogDescription>
                  By publishing "{selectedMenu}", you will be making this menu active and deactivating any other published menu. This will be visible to all customers immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                  Yes, Publish Menu
                </AlertDialogAction>
              </AlertDialogFooter>
              
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Menu Selector Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Menu Management
              </CardTitle>
              <CardDescription>
                Manage your menus. You can have up to {clientServices?.has_unlimited_menus ? 'unlimited' : clientServices?.menu_limit} menus.
              </CardDescription>
            </div>
            <Dialog open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!canCreateNewMenu()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Menu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Menu</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new menu. You can create up to {clientServices?.has_unlimited_menus ? 'unlimited' : clientServices?.menu_limit} menus.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-menu-name">Menu Name</Label>
                    <Input
                      id="new-menu-name"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      placeholder="e.g., Summer Menu, Lunch Menu, Dinner Menu"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateMenuOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewMenu}>
                    Create Menu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Updated</th>
                  <th className="text-left p-4 font-medium">Items</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableMenus.map((menu) => (
                  <tr key={menu.name} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{menu.name}</td>
                    <td className="p-4">
                      <Badge 
                        variant={menu.is_published ? "default" : menu.is_active ? "secondary" : "outline"}
                        className={menu.is_published ? "bg-green-600" : ""}
                      >
                        {menu.is_published ? "Live" : menu.is_active ? "Active" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDistanceToNow(new Date(menu.last_updated), { addSuffix: true })}
                    </td>
                    <td className="p-4 text-gray-600">{menu.item_count}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMenu(menu.name)
                            setShowMobilePreview(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>

                        {!menu.is_published && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMenu(menu.name)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            
                            {selectedMenu === menu.name && isDirty && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="flex items-center gap-1"
                              >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Saving...' : 'Save Draft'}
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateMenu(menu.name)}
                          disabled={!canCreateNewMenu()}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </Button>
                        {!menu.is_published && selectedMenu === menu.name && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMenu(menu.name)
                              handleSaveDraft()
                            }}
                            disabled={isSaving}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Draft'}
                          </Button>
                        )}
                        {!menu.is_published && menu.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMenu(menu.name)
                              handlePublish()
                            }}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700"
                          >
                            <UploadIcon className="h-4 w-4" />
                            Make Live
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={availableMenus.length <= 1}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          {/* AlertDialog content stays the same */}
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      

      {/* Main Content Area - Full Width */}
      {selectedMenu && (
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {businessInfo?.button_label} Configuration - {selectedMenu}
            </CardTitle>
            <CardDescription>
              Design and customize your {businessInfo?.button_label?.toLowerCase()} layout, theme, and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="layout" className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="theme" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Items
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="mt-6">
                <MenuLayoutDesigner 
                  key={`${selectedMenu}-${menuConfig?.layout_type}-${menuConfig?.columns}`}
                  config={menuConfig}
                  onChange={handleConfigChange}
                  businessType={businessInfo?.item_type || 'food'}
                  selectedMenu={selectedMenu}
                  onSaveConfig={async (config) => {
                    try {
                      await apiClient.menu.saveConfig(businessId!, {
                        config: config,
                        config_version: currentVersion,
                        menuName: selectedMenu
                      })
                      console.log('✅ Layout config saved successfully')
                    } catch (error) {
                      console.error('❌ Error saving layout config:', error)
                      throw error
                    }
                  }}
                  items={menuItems}
                  categories={categories}
                />
              </TabsContent>

              <TabsContent value="theme" className="mt-6">
                <ThemeCustomizer 
                  config={menuConfig}
                  onChange={handleConfigChange}
                />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <CategoryManager 
                  categories={categories}
                  businessType={businessInfo?.item_type || 'food'}
                  businessId={businessId || 1}
                  onChange={(newCategories: Category[]) => setCategories(newCategories)}
                />
              </TabsContent>

              <TabsContent value="items" className="mt-6">
                <ItemManager 
                  items={menuItems}
                  categories={categories}
                  businessType={businessInfo?.item_type || 'food'}
                  businessId={businessId || 1}
                  selectedMenu={selectedMenu}
                  onChange={(newItems: MenuItem[]) => setMenuItems(newItems)}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <VersionController 
                  currentVersion={currentVersion}
                  selectedMenu={selectedMenu}
                  onVersionChange={setCurrentVersion}
                  onRevert={() => loadMenuData(selectedMenu)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Mobile Preview Modal */}
      {showMobilePreview && (
        <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mobile Preview - {selectedMenu}</DialogTitle>
              <DialogDescription>
                See how your menu will look on mobile devices
              </DialogDescription>
            </DialogHeader>
            <MobilePreview 
              key={`${menuConfig?.layout_type}-${menuConfig?.columns}-${menuConfig?.selectedMenu}`}
              config={menuConfig}
              items={menuItems}
              categories={categories}
              businessInfo={businessInfo}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Business Type Detector Component (hidden, used for API calls) */}
      <BusinessTypeDetector 
        onBusinessTypeDetected={(info: BusinessInfo) => setBusinessInfo(info)}
      />
    </div>
  )
}