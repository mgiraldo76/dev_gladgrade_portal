// types/social-media.ts
// Path: /types/social-media.ts

export interface SocialMediaPlatform {
    id: number
    name: string // 'x', 'linkedin', 'youtube', 'facebook', 'instagram', 'tiktok'
    display_name: string // 'X (Twitter)', 'LinkedIn', etc.
    api_base_url?: string
    is_active: boolean
    requires_oauth: boolean
    max_video_size_mb: number
    supported_video_formats: string[]
    max_description_length: number
    max_title_length?: number
    supports_scheduling: boolean
    icon_class: string // CSS class for platform icon
    brand_color: string // Hex color code
    created_at: string
    updated_at: string
  }
  
  export interface SocialMediaPost {
    id: number
    employee_id: number
    title?: string
    video_url: string // Firebase Storage URL
    video_filename: string
    video_size_bytes: number
    video_duration_seconds?: number
    video_mime_type: string
    thumbnail_url?: string
    
    // Content flags
    use_same_description: boolean
    default_description?: string
    
    // Status
    status: PostStatus
    
    // Timestamps
    created_at: string
    updated_at: string
    published_at?: string
    deleted_at?: string
  }
  
  export interface SocialMediaPostPlatform {
    id: number
    post_id: number
    platform_id: number
    
    // Platform-specific content
    custom_description?: string
    hashtags?: string
    mentions?: string
    
    // Platform response data
    platform_post_id?: string
    platform_url?: string
    
    // Status tracking
    status: PlatformPostStatus
    error_message?: string
    retry_count: number
    
    // Platform-specific metadata
    platform_metadata?: Record<string, any>
    
    // Timestamps
    published_at?: string
    failed_at?: string
    created_at: string
    updated_at: string
    
    // Joined data
    platform?: SocialMediaPlatform
  }
  
  export interface SocialMediaAccount {
    id: number
    platform_id: number
    account_name: string
    account_username?: string
    
    // Status
    is_active: boolean
    is_connected: boolean
    last_auth_check?: string
    
    // Account metadata
    account_metadata?: Record<string, any>
    
    // Management
    created_by: number
    created_at: string
    updated_at: string
    
    // Joined data
    platform?: SocialMediaPlatform
  }
  
  export interface SocialMediaActivityLog {
    id: number
    employee_id: number
    post_id?: number
    account_id?: number
    activity_type: string
    description?: string
    metadata?: Record<string, any>
    ip_address?: string
    user_agent?: string
    created_at: string
  }
  
  // Enums
  export type PostStatus = 'draft' | 'publishing' | 'published' | 'failed' | 'deleted'
  export type PlatformPostStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'skipped'
  
  // Form interfaces
  export interface CreatePostForm {
    title?: string
    video_file: File
    use_same_description: boolean
    default_description?: string
    platform_content: PlatformContent[]
  }
  
  export interface PlatformContent {
    platform_id: number
    enabled: boolean
    custom_description?: string
    hashtags?: string
    mentions?: string
  }
  
  // API Response interfaces
  export interface PostsOverviewResponse {
    id: number
    title?: string
    video_filename: string
    overall_status: PostStatus
    created_at: string
    published_at?: string
    employee_id: number
    // Employee info from corp database employees table
    email?: string
    full_name?: string
    employee_status?: string
    platform_statuses: Record<string, {
      status: PlatformPostStatus
      platform_url?: string
      error_message?: string
    }>
    total_platforms: number
    published_count: number
    failed_count: number
  }
  
  export interface CreatePostResponse {
    success: boolean
    post_id: number
    message: string
    errors?: string[]
  }
  
  export interface PublishPostResponse {
    success: boolean
    post_id: number
    results: PlatformPublishResult[]
    message: string
  }
  
  export interface PlatformPublishResult {
    platform_name: string
    success: boolean
    platform_post_id?: string
    platform_url?: string
    error_message?: string
  }
  
  // Account management interfaces
  export interface ConnectAccountForm {
    platform_id: number
    account_name: string
    account_username?: string
  }
  
  export interface AccountCredentials {
    api_key?: string
    api_secret?: string
    access_token?: string
    refresh_token?: string
    client_id?: string
    client_secret?: string
  }
  
  // Upload progress interface
  export interface UploadProgress {
    loaded: number
    total: number
    percentage: number
    status: 'uploading' | 'processing' | 'complete' | 'error'
  }
  
  // Platform-specific configuration
  export interface PlatformConfig {
    [key: string]: {
      description_placeholder: string
      hashtag_suggestions: string[]
      character_limit: number
      video_requirements: {
        max_size_mb: number
        formats: string[]
        max_duration?: number
        aspect_ratio?: string
      }
    }
  }
  
  export const PLATFORM_CONFIGS: PlatformConfig = {
    x: {
      description_placeholder: "What's happening? Share your story...",
      hashtag_suggestions: ['#business', '#entrepreneur', '#marketing'],
      character_limit: 280,
      video_requirements: {
        max_size_mb: 512,
        formats: ['mp4'],
        max_duration: 140,
        aspect_ratio: '16:9 or 1:1'
      }
    },
    linkedin: {
      description_placeholder: "Share professional insights and updates...",
      hashtag_suggestions: ['#business', '#professional', '#industry'],
      character_limit: 3000,
      video_requirements: {
        max_size_mb: 200,
        formats: ['mp4', 'mov'],
        max_duration: 600,
        aspect_ratio: '16:9 recommended'
      }
    },
    youtube: {
      description_placeholder: "Describe your video content...",
      hashtag_suggestions: ['#tutorial', '#business', '#howto'],
      character_limit: 5000,
      video_requirements: {
        max_size_mb: 128000, // 128GB
        formats: ['mp4', 'mov', 'avi'],
        max_duration: 43200, // 12 hours
        aspect_ratio: '16:9 recommended'
      }
    },
    facebook: {
      description_placeholder: "Share what's on your mind...",
      hashtag_suggestions: ['#business', '#community', '#local'],
      character_limit: 2200,
      video_requirements: {
        max_size_mb: 4000,
        formats: ['mp4', 'mov'],
        max_duration: 7200, // 2 hours
        aspect_ratio: '16:9 or 1:1'
      }
    },
    instagram: {
      description_placeholder: "Capture the moment...",
      hashtag_suggestions: ['#business', '#visual', '#brand'],
      character_limit: 2200,
      video_requirements: {
        max_size_mb: 4000,
        formats: ['mp4', 'mov'],
        max_duration: 3600, // 1 hour
        aspect_ratio: '1:1 or 9:16'
      }
    },
    tiktok: {
      description_placeholder: "Make it fun and engaging...",
      hashtag_suggestions: ['#business', '#creative', '#trending'],
      character_limit: 2200,
      video_requirements: {
        max_size_mb: 287,
        formats: ['mp4'],
        max_duration: 180, // 3 minutes
        aspect_ratio: '9:16 vertical'
      }
    }
  }