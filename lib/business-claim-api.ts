// File: lib/business-claim-api.ts
// Path: lib/business-claim-api.ts

import { apiClient } from '@/lib/api-client'


export interface IndustryCategory {
    id: number
    name: string
    description?: string
    icon?: string
  }
  
  export interface BusinessClaimData {
    business_name: string
    contact_name?: string
    contact_email: string
    phone?: string
    admin_phone?: string
    website?: string
    business_address: string
    industry_category_id?: number
    fein?: string
    dun_bradstreet_id?: string
    form_start_time?: number
  }
  
  export interface BusinessClaimResponse {
    success: boolean
    data?: {
      claim_request: any
      prospect: any
      file_uploads: any[]
      duplicate_detected: boolean
    }
    message?: string
    emails_sent?: {
      user_confirmation: boolean
      sales_notification: boolean
    }
    error?: string
    details?: string
  }
  
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    details?: string
    count?: number
  }
  
  
class BusinessClaimApi {
    // Use the existing request method but for public endpoints (no auth)
    private async publicRequest(endpoint: string, options: RequestInit = {}) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gladgrade-api-360532994710.us-east4.run.app'
      const url = `${baseUrl}/api${endpoint}`
  
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      }
  
      // console.log(`🌐 Public API Request: ${options.method || "GET"} ${url}`)
      
      const response = await fetch(url, config)
      const data = await response.json()
  
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
  
      return data
    }
  
    async getIndustryCategories() {
      return this.publicRequest("/portal/sales/businessclaim_categories")
    }
  
    async submitBusinessClaim(formData: FormData) {
      return this.publicRequest("/portal/sales/businessclaim_submit", {
        method: "POST",
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      })
    }
  }
  
  // Export singleton instance
  export const businessClaimApi = new BusinessClaimApi()

  // Export types and utilities
  export default businessClaimApi