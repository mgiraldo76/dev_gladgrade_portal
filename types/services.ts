// File: types/services.ts
// Path: /types/services.ts

export interface ServiceCategory {
    id: number
    name: string
    description?: string
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
    service_count?: number
  }
  
  export interface Service {
    id: number
    name: string
    description?: string
    category_id: number
    category_name?: string
    category_description?: string
    base_price: number
    setup_fee: number
    monthly_fee: number
    commission_rate?: number
    commission_type?: 'percentage' | 'fixed'
    commission_amount?: number
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
    created_at: string
    updated_at: string
    currently_subscribed?: boolean
  }
  
  export interface ClientService {
    id: number
    name: string
    description?: string
    service_type: string
    base_price: number
    setup_fee: number
    monthly_fee: number
    is_recurring: boolean
    billing_cycle: string
    assignment_id?: number
    assignment_status?: string
    start_date?: string
    end_date?: string
    service_active?: boolean
    category_name?: string
    currently_subscribed?: boolean
  }
  
  export interface ServiceAssignment {
    id: number
    business_client_id: number
    service_id: number
    status: 'active' | 'inactive' | 'expired'
    start_date: string
    end_date?: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  
  export interface UserPermissions {
    can_edit: boolean
    can_purchase: boolean
    user_type: 'employee' | 'client'
  }
  
  export interface ServicesResponse {
    success: boolean
    data: Service[]
    user_permissions: UserPermissions
  }
  
  export interface ServiceCategoriesResponse {
    success: boolean
    data: ServiceCategory[]
  }
  
  export interface ClientServicesResponse {
    success: boolean
    data: {
      current_services: ClientService[]
      available_services: Service[]
    }
    user_permissions: UserPermissions
  }
  
  export interface CreateServiceRequest {
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
  }
  
  export interface PurchaseServiceRequest {
    service_id: number
    notes?: string
  }