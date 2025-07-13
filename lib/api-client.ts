// File: lib/api-client.ts
// Path: lib/api-client.ts - UPDATED to use /portal/ endpoints

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
}

interface ReviewCountParams {
  placeId: string
}

interface BulkReviewCountParams {
  placeIds: string[]
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

  // Helper function to get authentication token
  private async getAuthToken(): Promise<string> {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (user) {
        return await user.getIdToken()
      }
      throw new Error('No authenticated user')
    } catch (error) {
      console.error('Error getting auth token:', error)
      throw error
    }
  }

  // Helper for GC proxy requests with auth
  private async gcRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // Check if we're in a browser environment and have auth
      if (typeof window === 'undefined') {
        throw new Error('GC requests can only be made from browser environment')
      }

      const url = endpoint.startsWith("http") ? endpoint : `/api/gcloud-proxy${endpoint}`

      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      }

      console.log(`🌐 GC Proxy Request: ${options.method || "GET"} ${url}`)

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      console.log(`✅ GC Proxy Response: ${url}`, data)
      return data
    } catch (error) {
      console.error(`❌ GC Proxy Error: ${endpoint}`, error)
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
  async getProspects() {
    return this.request("/portal/sales/prospects")
  }

  async createProspect(prospect: {
    business_name: string
    contact_name: string
    contact_email: string
    phone?: string
    website?: string
    business_address?: string
    industry?: string
    lead_source?: string
    assigned_salesperson_id?: number
    notes?: string
  }) {
    return this.request("/portal/sales/prospects", {
      method: "POST",
      body: JSON.stringify(prospect),
    })
  }

  async convertProspect(prospectId: number, conversionData: {
    industry_category_id?: number
    number_of_locations?: number
    security_level?: string
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

  // Google Places search - UPDATED
  async searchPlaces(query: string, location?: string) {
    const params = new URLSearchParams({ query })
    if (location) params.append("location", location)

    return this.request(`/portal/clients/search-places?${params.toString()}`)
  }

  // ===== REVIEW API METHODS (these use gcloud-proxy, so they're correct) =====

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
    return this.gcRequest(`/reviews/images/${reviewId}`)
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

  // Convenience method for reviews namespace (optional - for organized access)
  reviews = {
    getCount: this.getReviewCount.bind(this),
    getBulkCounts: this.getBulkReviewCounts.bind(this),
    query: this.queryReviews.bind(this),
    getImages: this.getReviewImages.bind(this),
    moderate: this.moderateReview.bind(this)
  }
}

export const apiClient = new ApiClient()