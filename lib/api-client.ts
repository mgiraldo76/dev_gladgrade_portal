// File: lib/api-client.ts
// Path: lib/api-client.ts - FIXED gcRequest method for Firebase hosting

import { getAuth } from "firebase/auth"

interface ReviewQueryParams {
  page?: number
  limit?: number
  clientId?: string
  placeId?: string
  dateFrom?: string
  dateTo?: string
  hasImages?: string
  ratingRange?: string
  search?: string
  reviewIds?: string[]
  includePrivate?: boolean
}

interface ReviewCountParams {
  placeId: string
}

interface BulkReviewCountParams {
  placeIds: string[]
}

interface ProspectActivity {
  prospect_id: number
  activity_type: string
  subject: string
  description?: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Use full URL in all environments since we removed local API routes
    const baseUrl = this.baseUrl || process.env.NEXT_PUBLIC_API_URL || ""
    const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}/api${endpoint}`

    // Get Firebase auth token
    const auth = getAuth()
    const user = auth.currentUser
    let authHeaders = {}
    
    if (user) {
      try {
        const token = await user.getIdToken()
        authHeaders = {
          'Authorization': `Bearer ${token}`
        }
        console.log("🎫 Added auth token to request")
      } catch (error) {
        console.error("❌ Error getting auth token:", error)
      }
    } else {
      console.log("⚠️ No authenticated user found")
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    }

    console.log(`🌐 API Request: ${options.method || "GET"} ${url}`)

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      console.log(`✅ API Response: ${url}`, data)
      return data
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error)
      throw error
    }
  }

  // FIXED: gcRequest method to work in Firebase hosting by calling Google Cloud Run directly
  private async gcRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // Check if we're in a browser environment and have auth
      if (typeof window === 'undefined') {
        throw new Error('GC requests can only be made from browser environment')
      }

      // FIXED: Use the same URL construction as request() method
      const baseUrl = this.baseUrl || process.env.NEXT_PUBLIC_API_URL || ""
      const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}/api${endpoint}`

      // Get Firebase auth token for gcloud requests
      const auth = getAuth()
      const user = auth.currentUser
      let authHeaders = {}
      
      if (user) {
        try {
          const token = await user.getIdToken()
          authHeaders = {
            'Authorization': `Bearer ${token}`
          }
          console.log("🎫 Added auth token to gcloud request")
        } catch (error) {
          console.error("❌ Error getting auth token for gcloud:", error)
        }
      }

      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          ...options.headers,
        },
        ...options,
      }

      console.log(`🌐 GCloud Request: ${options.method || "GET"} ${url}`)

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      console.log(`✅ GCloud Response: ${url}`, data)
      return data
    } catch (error) {
      console.error(`❌ GCloud Error: ${endpoint}`, error)
      throw error
    }
  }

  // Department API methods - UPDATED to use /portal/settings/
  async getDepartments() {
    return this.request("/portal/settings/departments")
  }

  async createDepartment(department: { name: string; employee_count?: number; permissions?: string[] }) {
    return this.request("/portal/settings/departments", {
      method: "POST",
      body: JSON.stringify(department),
    })
  }

  async updateDepartment(department: { id: number; name: string; employee_count: number; permissions: string[] }) {
    return this.request("/portal/settings/departments", {
      method: "PUT",
      body: JSON.stringify(department),
    })
  }

  async deleteDepartment(id: number) {
    return this.request(`/portal/settings/departments?id=${id}`, {
      method: "DELETE",
    })
  }

  // Employee API methods - UPDATED to use /portal/employees/
  async getEmployees() {
    return this.request("/portal/employees")
  }

  async createEmployee(employee: {
    email: string
    full_name: string
    department_id?: number
    role?: string
    permissions?: string[]
    create_firebase_account?: boolean
    temporary_password?: string
  }) {
    return this.request("/portal/employees", {
      method: "POST",
      body: JSON.stringify(employee),
    })
  }

  async updateEmployee(employee: {
    id: number
    email: string
    full_name: string
    department_id?: number
    role: string
    status: string
    permissions: string[]
  }) {
    return this.request("/portal/employees", {
      method: "PUT",
      body: JSON.stringify(employee),
    })
  }

  async deleteEmployee(id: number) {
    return this.request(`/portal/employees?id=${id}`, {
      method: "DELETE",
    })
  }

  // Business Client API methods - UPDATED to use /portal/clients/
  async getClients() {
    return this.request("/portal/clients")
  }

  async createClient(client: {
    business_name: string
    contact_name: string
    contact_email: string
    phone?: string
    website?: string
    business_address?: string
    industry_category_id?: number
    number_of_locations?: number
    security_level?: string
    create_firebase_account?: boolean
    temporary_password?: string
  }) {
    return this.request("/portal/clients", {
      method: "POST",
      body: JSON.stringify(client),
    })
  }

  // Client locations methods - NEW
  async getClientLocations(clientId: number) {
    return this.request(`/portal/clients/${clientId}/locations`)
  }

  async createClientLocation(clientId: number, location: {
    location_name: string
    address: string
    place_id?: string
    is_primary?: boolean
    phone?: string
    manager_name?: string
    operating_hours?: string
  }) {
    return this.request(`/portal/clients/${clientId}/locations`, {
      method: "POST",
      body: JSON.stringify(location),
    })
  }

  // Client users methods - NEW
  async getClientUsers(clientId: number) {
    return this.request(`/portal/clients/${clientId}/users`)
  }

  async createClientUser(clientId: number, user: {
    email: string
    full_name: string
    role?: string
    create_firebase_account?: boolean
    temporary_password?: string
  }) {
    return this.request(`/portal/clients/${clientId}/users`, {
      method: "POST",
      body: JSON.stringify(user),
    })
  }

  // Industry Categories API methods - UPDATED to use /portal/industry-categories/
  async getIndustryCategories() {
    return this.request("/portal/industry-categories")
  }

  // Positions API methods - NEW
  async getPositions() {
    return this.request("/portal/positions")
  }

  async createPosition(position: {
    title: string
    description?: string
    level: number
    additional_permissions?: string[]
    can_access_sales?: boolean
  }) {
    return this.request("/portal/positions", {
      method: "POST",
      body: JSON.stringify(position),
    })
  }

  // Sales API methods - NEW
  async getProspects(viewAll?: boolean, employeeId?: number) {
    const params = new URLSearchParams()
    if (viewAll) params.append("viewAll", "true")
    if (employeeId) params.append("employeeId", employeeId.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/portal/sales/prospects${query}`)
  }

  async createProspect(prospect: {
    business_name: string
    contact_name: string
    contact_email: string
    phone?: string
    website?: string
    street_address?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
    formatted_address?: string
    business_type?: string  // FIXED: Changed from 'industry' to 'business_type'
    lead_source?: string
    assigned_salesperson_id?: number
    estimated_value?: number
    priority?: string
    notes?: string
    place_id?: string
  }) {
    return this.request("/portal/sales/prospects", {
      method: "POST",
      body: JSON.stringify(prospect),
    })
  }

  async convertProspect(prospectId: number, conversionData: {
    conversion_value: number
    client_contact_name: string
    client_contact_email: string
    client_contact_phone?: string
    notes?: string
  }) {
    return this.request(`/portal/sales/prospects/${prospectId}/convert`, {
      method: "POST",
      body: JSON.stringify(conversionData),
    })
  }

  async getServices() {
    return this.request("/portal/sales/services")
  }

  async getSalesDashboard() {
    return this.request("/portal/sales/dashboard")
  }

  // Organization settings API methods - UPDATED
  async getOrganizationSettings() {
    return this.request("/portal/settings/organization")
  }

  async updateOrganizationSettings(settings: any) {
    return this.request("/portal/settings/organization", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Notification settings API methods - UPDATED
  async getNotificationSettings(userId: string) {
    return this.request(`/portal/settings/notifications?userId=${userId}`)
  }

  async updateNotificationSettings(userId: string, settings: any) {
    return this.request("/portal/settings/notifications", {
      method: "PUT",
      body: JSON.stringify({ userId, ...settings }),
    })
  }

  // Google Places search - FIXED to use portal/sales endpoint
  async searchPlaces(query: string, location?: string) {
    const params = new URLSearchParams({ query })
    if (location) params.append("location", location)

    return this.request(`/portal/sales/search-places?${params.toString()}`)
  }

  // ===== NEW: BUSINESS SECTORS API METHODS =====
  // Get business sectors via gcloud-proxy (uses businesses.js routes)
  async getBusinessSectors(businessSectorName?: string) {
    return this.gcRequest('/businesses/businessSector/query', {
      method: 'POST',
      body: JSON.stringify({ businessSectorName })
    })
  }

  // Create business sector
  async createBusinessSector(sector: {
    businessSectorName: string
    other?: string
    isExternal?: boolean
    dateCreated?: string
  }) {
    return this.gcRequest('/businesses/businessSector', {
      method: 'POST',
      body: JSON.stringify(sector)
    })
  }

  // ===== NEW: PROSPECT ACTIVITIES API METHODS =====
  // Get activities for a prospect (temporary - endpoint doesn't exist yet)
  async getProspectActivities(prospectId: number) {
    return this.request(`/portal/sales/prospects/${prospectId}/activities`)
  }
  
  // Create prospect activity
  async createProspectActivity(activity: ProspectActivity) {
    return this.request(`/portal/sales/prospects/${activity.prospect_id}/activities`, {
      method: "POST",
      body: JSON.stringify(activity),
    })
  }

  async getClientBusinessLocations(businessId: number) {
    return this.request(`/portal/clients/${businessId}/locations`)
  }

  // ===== REVIEW API METHODS (these use gcRequest, now FIXED for Firebase hosting) =====

  // Get review count for a single place
  async getReviewCount(params: ReviewCountParams) {
    return this.gcRequest(`/reviews/review-count?placeId=${params.placeId}`)
  }

  // Get review counts for multiple places (bulk)
  async getBulkReviewCounts(params: BulkReviewCountParams) {
    return this.gcRequest('/reviews/review-counts-bulk', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  // Query reviews with filters and pagination  
  async queryReviews(params: ReviewQueryParams = {}) {
    // Use your existing /consumerReviews/query endpoint
    return this.gcRequest('/consumerReviews/query', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  // Get images for a specific review
  async getReviewImages(reviewId: string) {
    //return this.gcRequest(`/reviews/images/${reviewId}`)
    return this.gcRequest(`/reviews/all-images/${reviewId}`)
  }

  // Moderate a review (admin only)
  async moderateReview(reviewId: string, action: 'approve' | 'reject' | 'flag', notes?: string) {
    return this.gcRequest('/reviews/moderate', {
      method: 'POST',
      body: JSON.stringify({
        reviewId,
        action,
        notes
      })
    })
  }

  // FIXED: Update review privacy - now uses gcRequest which calls Google Cloud Run directly
  async updateReviewPrivacy(consumerReviewId: number, isPrivate: boolean) {
    return this.gcRequest('/review/consumerReview/update', {
      method: 'PATCH',
      body: JSON.stringify({
        consumerReviewId,
        isPrivate
      })
    })
  }

  // Get survey answers for a specific review
  async getReviewSurveyAnswers(reviewId: string) {
    return this.gcRequest(`/reviews/survey-answers/${reviewId}`)
  }


  async updateProspect(prospectId: number, prospect: {
    business_name?: string
    contact_name?: string
    contact_email?: string
    phone?: string
    website?: string
    business_address?: string
    street_address?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
    formatted_address?: string
    industry?: string
    status?: string
    priority?: string
    assigned_salesperson_id?: number
    estimated_value?: number
    notes?: string
    change_reason?: string
  }) {
    return this.request(`/portal/sales/prospects/${prospectId}`, {
      method: "PUT",
      body: JSON.stringify(prospect),
    })
  }

  // ===== QR CODE API METHODS =====
  // Generate QR code for a business client
  async generateClientQRCode(clientId: number) {
    return this.request(`/portal/clients/${clientId}/qr-code`, {
      method: "POST",
    })
  }

  // Send QR code via email to client
  async sendClientQREmail(clientId: number, qrCodeData: {
    qrCodeDataURL: string
  }) {
    return this.request(`/portal/clients/${clientId}/send-qr-email`, {
      method: "POST",
      body: JSON.stringify(qrCodeData),
    })
  }

  async updateClient(clientId: number, clientData: {
    business_name?: string
    contact_name?: string
    contact_email?: string
    phone?: string
    website?: string
    business_type?: string
    claim_status?: string
    security_level?: string
    sales_rep_id?: number | null
  }) {
    return this.request(`/portal/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    })
  }







  // Client locations methods - ADD MISSING UPDATE AND DELETE
  async updateClientLocation(clientId: number, locationId: number, location: {
    location_name?: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    place_id?: string
    is_primary?: boolean
    phone?: string
    manager_name?: string
    manager_email?: string
    operating_hours?: string
  }) {
    return this.request(`/portal/clients/${clientId}/locations/${locationId}`, {
      method: "PUT",
      body: JSON.stringify(location),
    })
  }

  async deleteClientLocation(clientId: number, locationId: number) {
    return this.request(`/portal/clients/${clientId}/locations/${locationId}`, {
      method: "DELETE",
    })
  }

  // Client users methods - ADD MISSING UPDATE AND DELETE
  async updateClientUser(clientId: number, userId: number, user: {
    email?: string
    full_name?: string
    role?: string
    status?: string
    reset_password?: boolean
    new_password?: string
  }) {
    return this.request(`/portal/clients/${clientId}/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(user),
    })
  }

  async deleteClientUser(clientId: number, userId: number) {
    return this.request(`/portal/clients/${clientId}/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Client activities methods - ADD NEW ACTIVITY METHODS
  async getClientActivities(clientId: number, limit: number = 10) {
    return this.request(`/portal/clients/${clientId}/activities?limit=${limit}`)
  }

  async createClientActivity(clientId: number, activity: {
    activity_type: string
    subject: string
    description?: string
    outcome?: string
    next_action?: string
    priority?: string
    scheduled_for?: string
  }) {
    return this.request(`/portal/clients/${clientId}/activities`, {
      method: "POST",
      body: JSON.stringify(activity),
    })
  }





  // Convenience method for reviews namespace (optional - for organized access)
  reviews = {
    getCount: this.getReviewCount.bind(this),
    getBulkCounts: this.getBulkReviewCounts.bind(this),
    query: this.queryReviews.bind(this),
    getImages: this.getReviewImages.bind(this),
    moderate: this.moderateReview.bind(this),
    updatePrivacy: this.updateReviewPrivacy.bind(this)
  }

  // Convenience method for business sectors
  businesses = {
    getSectors: this.getBusinessSectors.bind(this),
    createSector: this.createBusinessSector.bind(this)
  }

  // Convenience method for activities
  activities = {
    getProspectActivities: this.getProspectActivities.bind(this),
    createProspectActivity: this.createProspectActivity.bind(this)
  }












  // ===== EMPLOYEE PERMISSIONS API METHODS =====

  // Get all available permissions
  async getAvailablePermissions() {
    return this.request("/portal/employees/permissions")
  }

  // Get employee's current permissions
  async getEmployeePermissions(employeeId: number) {
    return this.request(`/portal/employees/${employeeId}/permissions`)
  }

  // Update employee permissions
  async updateEmployeePermissions(employeeId: number, permissions: string[]) {
    return this.request(`/portal/employees/${employeeId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    })
  }

  // reviews 
  async getClientRecentReviews(clientId: number, params?: {
    days?: number
    minRating?: number
    maxRating?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.days) queryParams.append('days', params.days.toString())
    if (params?.minRating) queryParams.append('minRating', params.minRating.toString())
    if (params?.maxRating) queryParams.append('maxRating', params.maxRating.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request(`/portal/clients/${clientId}/recent-reviews${query}`)
  }




  // ===== MENU MANAGEMENT API METHODS =====

  // Get menu configuration for a business
  async getMenuConfig(businessId: number, menuId?: string, menuName?: string) {
    const params = new URLSearchParams()
    if (menuId) params.append('menuId', menuId)
    if (menuName) params.append('menuName', menuName)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/portal/menu/${businessId}/config${query}`)
  }

  // Get all menus for a business
  async getBusinessMenus(businessId: number) {
    return this.request(`/portal/menu/${businessId}/menus`)
  }

  // Publish a specific menu
  async publishMenu(businessId: number, menuName: string) {
    return this.request(`/portal/menu/${businessId}/menus/${encodeURIComponent(menuName)}/publish`, {
      method: 'POST'
    })
  }

  // Save menu configuration (draft or publish)
  async saveMenuConfig(businessId: number, config: {
    config: any
    config_version?: string
    menuName?: string
    is_draft?: boolean
    is_published?: boolean
  }) {
    return this.request(`/portal/menu/${businessId}/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  // Get menu items for a business
  async getMenuItems(businessId: number, params?: {
    category_id?: string
    active_only?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.category_id) queryParams.append('category_id', params.category_id)
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request(`/portal/menu/${businessId}/items${query}`)
  }

  // Create menu item
  async createMenuItem(businessId: number, item: {
    item_type: string
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
    menu_name?: string
  }) {
    return this.request(`/portal/menu/${businessId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    })
  }

  // Update menu item
  async updateMenuItem(businessId: number, itemId: string, updates: {
    data?: any
    is_active?: boolean
    category_id?: string
    menu_name?: string
  }) {
    return this.request(`/portal/menu/${businessId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  // Delete menu item
  async deleteMenuItem(businessId: number, itemId: string) {
    return this.request(`/portal/menu/${businessId}/items/${itemId}`, {
      method: 'DELETE'
    })
  }
  // Delete entire menu and all its items
  async deleteMenu(businessId: number, menuName: string) {
    return this.request(`/portal/menu/${businessId}/menus/${encodeURIComponent(menuName)}`, {
      method: 'DELETE'
    })
  }

  // Get business type information
  async getBusinessInfo(businessId: number) {
    return this.request(`/portal/menu/${businessId}/business-info`)
  }

  /*
  // Get menu version history
  async getMenuHistory(businessId: number) {
    return this.gcRequest(`/portal/menu/${businessId}/history`)
  }

  // Save menu version to history
  async saveMenuVersion(businessId: number, version: {
    version_name: string
    config_snapshot: any
    items_snapshot?: any[]
    created_by_business_client_id?: number
  }) {
    return this.gcRequest(`/portal/menu/${businessId}/history`, {
      method: 'POST',
      body: JSON.stringify(version)
    })
  }

  // Publish a menu version
  async publishMenuVersion(businessId: number, versionId: string) {
    return this.gcRequest(`/portal/menu/${businessId}/history/${versionId}/publish`, {
      method: 'POST'
    })
  }
  */



  // Upload menu item image
  async uploadMenuImage(file: File, businessId: number) {

    try {
      if (!businessId) {
        throw new Error('Business ID is required for image upload')
      }
      console.log("📸 Starting image upload process...");
      console.log("📁 File details:", { name: file.name, size: file.size, type: file.type });

      // Check if we're in a browser environment and have auth
      if (typeof window === 'undefined') {
        throw new Error('Image uploads can only be made from browser environment')
      }

      // Get Firebase auth token
      const auth = getAuth()
      const user = auth.currentUser
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const token = await user.getIdToken()
      console.log("🎫 Got Firebase auth token");

      // Create FormData
      const formData = new FormData()
      formData.append('image', file)
      console.log("📦 FormData created with image");

      // FIXED: Use the same URL construction as other gcRequest methods
      const baseUrl = this.baseUrl || process.env.NEXT_PUBLIC_API_URL || ""
      const url = `${baseUrl}/api/portal/menu/${businessId}/upload-image`

      
      console.log("🌐 Upload URL:", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type header for FormData - let browser set it
        },
        body: formData
      })

      console.log("📡 Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed with response:", errorText);
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Upload successful:", data);

      if (!data.success || !data.image_url) {
        throw new Error('Invalid response from upload API')
      }

      return data
    } catch (error) {
      console.error("❌ Image upload error:", error)
      throw error
    }
  }

  // Get place type mappings
  async getPlaceTypeMappings() {
    return this.gcRequest('/portal/menu/place-type-mappings')
  }

  async getClientServices(clientId: number) {
    return this.request(`/portal/clients/${clientId}/services`)
  }
  

  
  
  // Category API methods
  async getMenuCategories(businessId: number) {
    return this.request(`/portal/menu/${businessId}/item_categories`)
  }

  async createMenuCategory(businessId: number, category: any) {
    return this.request(`/portal/menu/${businessId}/item_categories`, {
      method: 'POST',
      body: JSON.stringify(category)
    })
  }

  async updateMenuCategory(businessId: number, categoryId: string, updates: any) {
    return this.request(`/portal/menu/${businessId}/item_categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteMenuCategory(businessId: number, categoryId: string) {
    return this.request(`/portal/menu/${businessId}/item_categories/${categoryId}`, {
      method: 'DELETE'
    })
  }

  

  // Convenience methods for organized access
  menu = {
    getConfig: (businessId: number, menuId?: string, menuName?: string, isActive?: boolean) => {
      const params = new URLSearchParams()
      if (menuId) params.append('menuId', menuId)
      if (menuName) params.append('menuName', menuName)
      if (isActive !== undefined) params.append('isActive', isActive.toString())
      
      const query = params.toString() ? `?${params.toString()}` : ''
      return this.request(`/portal/menu/${businessId}/config${query}`)
    },

   
  
    saveConfig: (businessId: number, config: {
      config: any
      config_version?: string
      menuName?: string
      is_draft?: boolean
      is_published?: boolean
    }) => {
      return this.request(`/portal/menu/${businessId}/config`, {
        method: 'POST',
        body: JSON.stringify(config)
      })
    },
    getItems: this.getMenuItems.bind(this),
    createItem: this.createMenuItem.bind(this),
    updateItem: this.updateMenuItem.bind(this),
    deleteItem: this.deleteMenuItem.bind(this),
    deleteMenu: this.deleteMenu.bind(this),
    getBusinessInfo: this.getBusinessInfo.bind(this),
    uploadImage: (file: File, businessId: number) => this.uploadMenuImage(file, businessId),
    getPlaceTypeMappings: this.getPlaceTypeMappings.bind(this),
    getMenus: this.getBusinessMenus.bind(this),
    publishMenu: (businessId: number, menuName: string) => {
      return this.request(`/portal/menu/${businessId}/menus/${encodeURIComponent(menuName)}/publish`, {
        method: 'POST'
      })
    },
    getCategories: this.getMenuCategories.bind(this),
    createCategory: this.createMenuCategory.bind(this),
    updateCategory: this.updateMenuCategory.bind(this),
    deleteCategory: this.deleteMenuCategory.bind(this)
  }

  async generateMenuQRCode(clientId: number, menuName: string) {
    return this.request(`/portal/menu/${clientId}/qr-code`, {
      method: "POST",
      body: JSON.stringify({ menuName }),
    })
  }










  
  // ===== NEW SERVICES MANAGEMENT API METHODS =====

  // Get all services (admin/employee view)
  async getAllServices() {
    return this.request("/portal/services")
  }
  
  // Create new service (Super Admin/CCO only)
  async createService(service: {
    name: string
    description: string
    category_id: number
    base_price?: number
    setup_fee?: number
    monthly_fee?: number
    commission_rate?: number
    commission_type?: 'percentage' | 'fixed'
    commission_amount?: number
    is_recurring?: boolean
    billing_cycle?: 'one_time' | 'monthly' | 'quarterly' | 'yearly'
    available_portal?: boolean
    available_mobile?: boolean
    available_gladgrade_only?: boolean
    service_type?: 'standard' | 'premium' | 'enterprise' | 'addon'
    requires_approval?: boolean
    max_quantity?: number
    is_active?: boolean
    is_featured?: boolean
    display_order?: number
  }) {
    return this.request("/portal/services", {
      method: "POST",
      body: JSON.stringify(service),
    })
  }
  
  // Update service (Super Admin/CCO only)
  async updateService(serviceId: number, updates: Partial<{
    name: string
    description: string
    category_id: number
    base_price: number
    setup_fee: number
    monthly_fee: number
    commission_rate: number
    commission_type: 'percentage' | 'fixed'
    commission_amount: number
    is_recurring: boolean
    billing_cycle: 'one_time' | 'monthly' | 'quarterly' | 'yearly'
    available_portal: boolean
    available_mobile: boolean
    available_gladgrade_only: boolean
    service_type: 'standard' | 'premium' | 'enterprise' | 'addon'
    requires_approval: boolean
    max_quantity: number
    is_active: boolean
    is_featured: boolean
    display_order: number
  }>) {
    return this.request(`/portal/services/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }
  
  // Delete service (Super Admin/CCO only)
  async deleteService(serviceId: number) {
    return this.request(`/portal/services/${serviceId}`, {
      method: "DELETE",
    })
  }
  
  // Get service categories
  async getServiceCategories() {
    return this.request("/portal/services/categories")
  }
  
  // Create service category (Super Admin/CCO only)
  async createServiceCategory(category: {
    name: string
    description?: string
    display_order?: number
    is_active?: boolean
  }) {
    return this.request("/portal/services/categories", {
      method: "POST",
      body: JSON.stringify(category),
    })
  }
  
  // Get client services (current and available) - NEW ENDPOINT
  async getClientServicesDetailed(clientId: number) {
    return this.request(`/portal/services/client/${clientId}`)
  }
  
  // Purchase/upgrade service for client
  async purchaseClientService(clientId: number, serviceData: {
    service_id: number
    notes?: string
  }) {
    return this.request(`/portal/services/client/${clientId}/purchase`, {
      method: "POST",
      body: JSON.stringify(serviceData),
    })
  }






  


// =============================================================================
  // SOCIAL MEDIA API METHODS - ADD THESE TO YOUR EXISTING ApiClient CLASS
  // =============================================================================

  // Platform management
  async getSocialMediaPlatforms() {
    return this.request("/portal/social-media/platforms")
  }

  // Account management
  async getSocialMediaAccounts() {
    return this.request("/portal/social-media/accounts")
  }

  async connectSocialMediaAccount(accountData: {
    platform_id: number
    account_name: string
    account_username?: string
    credentials?: Record<string, string>
  }) {
    return this.request("/portal/social-media/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    })
  }

  async disconnectSocialMediaAccount(accountId: number) {
    return this.request(`/portal/social-media/accounts/${accountId}`, {
      method: "DELETE",
    })
  }

  // Posts management
  async getSocialMediaPosts(params?: {
    page?: number
    limit?: number
    status?: string
    employee_id?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.employee_id) queryParams.append('employee_id', params.employee_id.toString())
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return this.request(`/portal/social-media/posts${query}`)
  }

  async getSocialMediaPost(postId: number) {
    return this.request(`/portal/social-media/posts/${postId}`)
  }

  async createSocialMediaPost(postData: {
    title?: string
    video_file: File
    use_same_description: boolean
    default_description?: string
    platform_content: Array<{
      platform_id: number
      enabled: boolean
      custom_description?: string
      hashtags?: string
      mentions?: string
    }>
  }) {
    const formData = new FormData()
    formData.append('video', postData.video_file)
    if (postData.title) formData.append('title', postData.title)
    formData.append('use_same_description', postData.use_same_description.toString())
    if (postData.default_description) formData.append('default_description', postData.default_description)
    formData.append('platform_content', JSON.stringify(postData.platform_content))

    return this.request("/portal/social-media/posts", {
      method: "POST",
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  async publishSocialMediaPost(postId: number) {
    return this.request(`/portal/social-media/posts/${postId}/publish`, {
      method: "POST",
    })
  }

  async deleteSocialMediaPost(postId: number) {
    return this.request(`/portal/social-media/posts/${postId}`, {
      method: "DELETE",
    })
  }

  async getSocialMediaAnalytics(period?: number) {
    const query = period ? `?period=${period}` : ''
    return this.request(`/portal/social-media/analytics${query}`)
  }
  




  // =============================================================================
  // ENHANCED SOCIAL MEDIA API METHODS - ADD THESE NEW METHODS
  // =============================================================================

  // Test connection for a specific account - NEW METHOD
  async testSocialMediaConnection(accountId: number) {
    return this.request(`/portal/social-media/accounts/${accountId}/test`, {
      method: "POST",
    })
  }

  // Update API credentials for an account - NEW METHOD  
  async updateSocialMediaCredentials(accountId: number, credentials: Record<string, string>) {
    return this.request(`/portal/social-media/accounts/${accountId}/credentials`, {
      method: "PUT",
      body: JSON.stringify({ credentials }),
    })
  }

  // Enhanced create post with better file support - FIXED to follow uploadMenuImage pattern exactly
  async createSocialMediaPostEnhanced(postData: {
    title?: string
    media_file?: File | null // Can be image or video or null
    use_same_description: boolean
    default_description?: string
    platform_content: Array<{
      platform_id: number
      enabled: boolean
      custom_description?: string
      hashtags?: string
      mentions?: string
    }>
  }) {
    try {
      console.log("📱 Starting social media post creation...")
      console.log("📁 Post details:", { 
        title: postData.title, 
        hasMedia: !!postData.media_file,
        mediaType: postData.media_file?.type,
        platformCount: postData.platform_content.filter(p => p.enabled).length
      })

      // Check if we're in a browser environment and have auth - EXACTLY like uploadMenuImage
      if (typeof window === 'undefined') {
        throw new Error('Social media posts can only be created from browser environment')
      }

      // Get Firebase auth token - EXACTLY like uploadMenuImage
      const auth = getAuth()
      const user = auth.currentUser
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const token = await user.getIdToken()
      console.log("🎫 Got Firebase auth token")

      // Create FormData - EXACTLY like uploadMenuImage
      const formData = new FormData()
      
      if (postData.title) {
        formData.append('title', postData.title)
      }
      
      if (postData.media_file) {
        formData.append('media', postData.media_file) // Backend expects 'media' field
        console.log("📦 FormData created with media file")
      } else {
        console.log("📦 FormData created for text-only post")
      }
      
      formData.append('use_same_description', postData.use_same_description.toString())
      
      if (postData.default_description) {
        formData.append('default_description', postData.default_description)
      }
      
      formData.append('platform_content', JSON.stringify(postData.platform_content))

      // FIXED: Use the same URL construction as uploadMenuImage method
      const baseUrl = this.baseUrl || process.env.NEXT_PUBLIC_API_URL || ""
      const url = `${baseUrl}/api/portal/social-media/posts`
      
      console.log("🌐 Post URL:", url)

      // FIXED: Make the request EXACTLY like uploadMenuImage - direct fetch with auth
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // CRITICAL: Don't set Content-Type header for FormData - let browser set it
        },
        body: formData
      })

      console.log("📡 Post response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Post failed with response:", errorText)
        throw new Error(`Post creation failed: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Post successful:", data)

      if (!data.success) {
        throw new Error('Invalid response from post API')
      }

      return data
    } catch (error) {
      console.error("❌ Social media post error:", error)
      throw error
    }
  }

  // Validate file for specific platform - NEW METHOD
  async validateSocialMediaFile(file: File, platformId: number) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('platform_id', platformId.toString())

    return this.request("/portal/social-media/validate-file", {
      method: "POST",
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  // Get platform requirements - NEW METHOD
  async getSocialMediaPlatformRequirements(platformId: number) {
    return this.request(`/portal/social-media/platforms/${platformId}/requirements`)
  }

  // Refresh account connection status - NEW METHOD
  async refreshSocialMediaAccountStatus(accountId: number) {
    return this.request(`/portal/social-media/accounts/${accountId}/refresh`, {
      method: "POST",
    })
  }


  // ===== MOBILE APP ADMIN API METHODS =====

  // Get mobile app dashboard overview
  async getMobileAdminOverview() {
    return this.request("/portal/mobile-admin/dashboard-overview")
  }

  // Get user analytics with date range
  async getMobileUserAnalytics(days: number = 30) {
    const params = new URLSearchParams({ days: days.toString() })
    return this.request(`/portal/mobile-admin/user-analytics?${params.toString()}`)
  }

  // Get device and platform analytics
  async getMobileDeviceAnalytics(days: number = 30) {
    const params = new URLSearchParams({ days: days.toString() })
    return this.request(`/portal/mobile-admin/device-analytics?${params.toString()}`)
  }

  // Get error analytics and monitoring
  async getMobileErrorAnalytics(days: number = 7) {
    const params = new URLSearchParams({ days: days.toString() })
    return this.request(`/portal/mobile-admin/error-analytics?${params.toString()}`)
  }

  // Get detailed user information with pagination and filters
  async getMobileUserDetails(options: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
    dateFrom?: string
    dateTo?: string
    platform?: string
    search?: string
  } = {}) {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)
    if (options.dateFrom) params.append('dateFrom', options.dateFrom)
    if (options.dateTo) params.append('dateTo', options.dateTo)
    if (options.platform) params.append('platform', options.platform)
    if (options.search) params.append('search', options.search)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/portal/mobile-admin/user-details${query}`)
  }

  // Export mobile analytics data
  async exportMobileAnalyticsData(options: {
    type?: 'users' | 'errors' | 'activities' | 'all'
    format?: 'json' | 'csv'
    days?: number
  } = {}) {
    const params = new URLSearchParams()
    
    if (options.type) params.append('type', options.type)
    if (options.format) params.append('format', options.format)
    if (options.days) params.append('days', options.days.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    
    // For downloads, we need to handle differently
    if (options.format === 'csv') {
      // Return the URL for download
      const baseUrl = this.baseUrl || process.env.NEXT_PUBLIC_API_URL || ""
      const auth = getAuth()
      const user = auth.currentUser
      let authHeaders = {}

      //const token = await user.getIdToken()
      if (user) {
        try {
          const token = await user.getIdToken()
          return {
            downloadUrl: `${baseUrl}/api/portal/mobile-admin/export-data${query}`,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        } catch (error) {
          console.error("❌ Error getting auth token:", error)
        }
      } else {
        console.log("⚠️ No authenticated user found")
      }

      
    } else {
      return this.request(`/portal/mobile-admin/export-data${query}`)
    }
  }




  services = {
    // Admin/Employee methods
    getAll: this.getAllServices.bind(this),
    create: this.createService.bind(this),
    update: this.updateService.bind(this),
    delete: this.deleteService.bind(this),
    getCategories: this.getServiceCategories.bind(this),
    createCategory: this.createServiceCategory.bind(this),
    
    // Client methods
    getClientServices: this.getClientServices.bind(this), // Legacy method (simple list)
    getClientServicesDetailed: this.getClientServicesDetailed.bind(this), // New detailed method
    purchase: this.purchaseClientService.bind(this)
  }

    
  socialMedia = {
    // Platform methods
    getPlatforms: this.getSocialMediaPlatforms.bind(this),
    
    // Account methods
    getAccounts: this.getSocialMediaAccounts.bind(this),
    connectAccount: this.connectSocialMediaAccount.bind(this),
    disconnectAccount: this.disconnectSocialMediaAccount.bind(this),
    testConnection: this.testSocialMediaConnection.bind(this), // NEW
    updateCredentials: this.updateSocialMediaCredentials.bind(this), // NEW
    refreshAccountStatus: this.refreshSocialMediaAccountStatus.bind(this), // NEW
    
    // Post methods
    getPosts: this.getSocialMediaPosts.bind(this),
    getPost: this.getSocialMediaPost.bind(this),
    createPost: this.createSocialMediaPost.bind(this), // Keep existing method
    createPostEnhanced: this.createSocialMediaPostEnhanced.bind(this), // NEW enhanced method
    publishPost: this.publishSocialMediaPost.bind(this),
    deletePost: this.deleteSocialMediaPost.bind(this),
    
    // Platform and validation methods
    validateFile: this.validateSocialMediaFile.bind(this), // NEW
    getPlatformRequirements: this.getSocialMediaPlatformRequirements.bind(this), // NEW
    
    // Analytics
    getAnalytics: this.getSocialMediaAnalytics.bind(this)
  }

  mobileAdmin = {
    getOverview: this.getMobileAdminOverview.bind(this),
    getUserAnalytics: this.getMobileUserAnalytics.bind(this),
    getDeviceAnalytics: this.getMobileDeviceAnalytics.bind(this),
    getErrorAnalytics: this.getMobileErrorAnalytics.bind(this),
    getUserDetails: this.getMobileUserDetails.bind(this),
    exportData: this.exportMobileAnalyticsData.bind(this)
  }
}





export const apiClient = new ApiClient()