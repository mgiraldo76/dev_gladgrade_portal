// File: types/mobile-admin.ts
// Path: types/mobile-admin.ts

export interface MobileDashboardOverview {
    totalUsers: number
    recentUsers: number
    activeUsers: number
    totalLogs: number
    errorCount: number
    growthRate: number
    lastUpdated: string
  }
  
  export interface UserRegistrationTrend {
    date: string
    registrations: number
  }
  
  export interface DailyActiveUser {
    date: string
    active_users: number
  }
  
  export interface HourlyActivity {
    hour: number
    activity_count: number
  }
  
  export interface TopActivity {
    event_type: string
    event_category: string
    count: number
  }
  
  export interface UserAnalytics {
    registrationTrends: UserRegistrationTrend[]
    dailyActiveUsers: DailyActiveUser[]
    hourlyActivity: HourlyActivity[]
    topActivities: TopActivity[]
    period: string
  }
  
  export interface DeviceBreakdown {
    device: string
    usage_count: number
    unique_users: number
  }
  
  export interface PlatformBreakdown {
    platform: string
    usage_count: number
    unique_users: number
  }
  
  export interface AppVersion {
    app_version: string
    usage_count: number
    unique_users: number
  }
  
  export interface DeviceAnalytics {
    deviceBreakdown: DeviceBreakdown[]
    platformBreakdown: PlatformBreakdown[]
    appVersions: AppVersion[]
    period: string
  }
  
  export interface ErrorBreakdown {
    category: string
    count: number
    unique_users: number
    latest_error: string
  }
  
  export interface PlatformError {
    platform: string
    count: number
  }
  
  export interface ErrorTrend {
    date: string
    count: number
  }
  
  export interface CriticalError {
    error_message: string
    event_type: string
    platform: string
    occurred_at: string
    frequency: number
  }
  
  export interface ErrorAnalytics {
    errorBreakdown: ErrorBreakdown[]
    platformErrors: PlatformError[]
    errorTrends: ErrorTrend[]
    criticalErrors: CriticalError[]
    totalErrors: number
    period: string
  }
  
  export interface UserDetail {
    id: number
    email: string
    firstName: string
    lastName: string
    dateCreated: string
    lastLoginAt?: string
    isGuest: boolean
    last_activity?: string
    latest_platform?: string
    total_activities?: number
    activity_status: 'Active' | 'Recent' | 'Inactive'
  }
  
  export interface UserDetailsResponse {
    users: UserDetail[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  
  export interface UserDetailsFilters {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
    dateFrom?: string
    dateTo?: string
    platform?: string
  }
  
  export interface ExportOptions {
    type?: 'users' | 'errors' | 'activities' | 'all'
    format?: 'json' | 'csv'
    days?: number
  }
  
  export interface ExportResponse {
    success: boolean
    downloadUrl?: string
    headers?: Record<string, string>
    data?: any
  }