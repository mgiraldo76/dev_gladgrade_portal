// File: lib/api-client.ts
// API client for GladGrade Portal backend with Review functionality

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
    const url = endpoint.startsWith("http") ? endpoint : `/api${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
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

  // Department API methods
  async getDepartments() {
    return this.request("/settings/departments")
  }

  async createDepartment(department: { name: string; employee_count?: number; permissions?: string[] }) {
    return this.request("/settings/departments", {
      method: "POST",
      body: JSON.stringify(department),
    })
  }

  async updateDepartment(department: { id: number; name: string; employee_count: number; permissions: string[] }) {
    return this.request("/settings/departments", {
      method: "PUT",
      body: JSON.stringify(department),
    })
  }

  async deleteDepartment(id: number) {
    return this.request(`/settings/departments?id=${id}`, {
      method: "DELETE",
    })
  }

  // Employee API methods
  async getEmployees() {
    return this.request("/employees")
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
    return this.request("/employees", {
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
    return this.request("/employees", {
      method: "PUT",
      body: JSON.stringify(employee),
    })
  }

  async deleteEmployee(id: number) {
    return this.request(`/employees?id=${id}`, {
      method: "DELETE",
    })
  }

  // Business Client API methods
  async getClients() {
    return this.request("/clients")
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
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    })
  }

  // Industry Categories API methods
  async getIndustryCategories() {
    return this.request("/industry-categories")
  }

  // Organization settings API methods
  async getOrganizationSettings() {
    return this.request("/settings/organization")
  }

  async updateOrganizationSettings(settings: any) {
    return this.request("/settings/organization", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Notification settings API methods
  async getNotificationSettings(userId: string) {
    return this.request(`/settings/notifications?userId=${userId}`)
  }

  async updateNotificationSettings(userId: string, settings: any) {
    return this.request("/settings/notifications", {
      method: "PUT",
      body: JSON.stringify({ userId, ...settings }),
    })
  }

  // Google Places search
  async searchPlaces(query: string, location?: string) {
    const params = new URLSearchParams({ query })
    if (location) params.append("location", location)

    return this.request(`/clients/search-places?${params.toString()}`)
  }

  // ===== NEW: REVIEW API METHODS =====

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