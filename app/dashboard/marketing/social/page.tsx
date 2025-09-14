// app/dashboard/marketing/social/page.tsx
// Path: /app/dashboard/marketing/social/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Play, 
  Share2, 
  Trash2, 
  Settings, 
  Plus,
  Video,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Eye,
  BarChart3,
  Users,
  Link,
  Image as ImageIcon,
  FileVideo,
  FileText,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  TestTube,
  CheckCircle2,
  Info
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { 
  SocialMediaPlatform, 
  SocialMediaPost, 
  PostsOverviewResponse, 
  CreatePostForm,
  PlatformContent,
  PLATFORM_CONFIGS
} from "@/types/social-media"

export default function SocialMediaManagement() {
  const [activeTab, setActiveTab] = useState("posts")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isAccountsOpen, setIsAccountsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [posts, setPosts] = useState<PostsOverviewResponse[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  
  // Form states for Create Post
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null)
  const [platformErrors, setPlatformErrors] = useState<Record<number, string[]>>({})
  const [hasValidationErrors, setHasValidationErrors] = useState(false)
  
  // Account management states
  const [isConnectingAccount, setIsConnectingAccount] = useState(false)
  const [testingConnection, setTestingConnection] = useState<Record<number, boolean>>({})
  const [connectionResults, setConnectionResults] = useState<Record<number, { success: boolean; message: string }>>({})
  const [showCredentials, setShowCredentials] = useState<Record<number, boolean>>({})
  
  const [newAccount, setNewAccount] = useState({
    platform_id: 0,
    account_name: "",
    account_username: "",
  })
  const [newPost, setNewPost] = useState<CreatePostForm>({
    title: "",
    video_file: null as any,
    use_same_description: true,
    default_description: "",
    platform_content: []
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [platformsRes, accountsRes, postsRes] = await Promise.all([
        apiClient.socialMedia.getPlatforms(),
        apiClient.socialMedia.getAccounts(),
        apiClient.socialMedia.getPosts({ limit: 10 })
      ]) as [
        { success: boolean; platforms: SocialMediaPlatform[] },
        { success: boolean; accounts: any[] },
        { success: boolean; posts: PostsOverviewResponse[] }
      ]

      if (platformsRes.success) setPlatforms(platformsRes.platforms)
      if (accountsRes.success) setAccounts(accountsRes.accounts)
      if (postsRes.success) setPosts(postsRes.posts)

      // Initialize platform content for form
      if (platformsRes.success) {
        setNewPost(prev => ({
          ...prev,
          platform_content: platformsRes.platforms.map((platform: SocialMediaPlatform) => ({
            platform_id: platform.id,
            enabled: true,
            custom_description: "",
            hashtags: "",
            mentions: ""
          }))
        }))
      }

    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.error("Failed to load social media data")
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const result = await apiClient.socialMedia.getAnalytics(30) as {
        success: boolean;
        analytics: any;
      }
      if (result.success) {
        setAnalytics(result.analytics)
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }

  // =============================================================================
  // VALIDATION FUNCTIONS
  // =============================================================================

  const validateFileForPlatform = (file: File, platform: SocialMediaPlatform): string[] => {
    const errors: string[] = []
    const config = PLATFORM_CONFIGS[platform.name]
    
    if (!config) return errors

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    // Check file type support
    if (isVideo && !config.video_requirements.formats.includes(file.name.split('.').pop()?.toLowerCase() || '')) {
      errors.push(`Video format not supported. Supported: ${config.video_requirements.formats.join(', ')}`)
    }
    
    // Check file size
    const maxSizeMB = isVideo ? config.video_requirements.max_size_mb : 10 // 10MB limit for images
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`File too large. Maximum: ${maxSizeMB}MB`)
    }
    
    // For images, check basic requirements
    if (isImage && config.video_requirements.max_size_mb < 100) {
      errors.push(`Platform may not support image posts`)
    }
    
    return errors
  }

  const validatePlatformContent = (platformId: number, description: string): string[] => {
    const errors: string[] = []
    const platform = platforms.find(p => p.id === platformId)
    const config = platform ? PLATFORM_CONFIGS[platform.name] : null
    
    if (!config) return errors
    
    if (description.length > config.character_limit) {
      errors.push(`Description too long. Maximum: ${config.character_limit} characters`)
    }
    
    return errors
  }

  const validateAllPlatforms = (): boolean => {
    const newErrors: Record<number, string[]> = {}
    let hasErrors = false
    
    const enabledPlatforms = newPost.platform_content.filter(p => p.enabled)
    
    for (const platformContent of enabledPlatforms) {
      const platform = platforms.find(p => p.id === platformContent.platform_id)
      if (!platform) continue
      
      let allErrors: string[] = []
      
      // Validate file if present
      if (selectedFile) {
        const fileErrors = validateFileForPlatform(selectedFile, platform)
        allErrors = [...allErrors, ...fileErrors]
      }
      
      // Validate content
      const description = newPost.use_same_description 
        ? newPost.default_description || ''
        : platformContent.custom_description || ''
      
      const contentErrors = validatePlatformContent(platform.id, description)
      allErrors = [...allErrors, ...contentErrors]
      
      if (allErrors.length > 0) {
        newErrors[platform.id] = allErrors
        hasErrors = true
      }
    }
    
    setPlatformErrors(newErrors)
    setHasValidationErrors(hasErrors)
    return !hasErrors
  }

  // =============================================================================
  // CREATE POST HANDLERS
  // =============================================================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    let detectedType: 'image' | 'video' | null = null
    if (file.type.startsWith('image/')) {
      detectedType = 'image'
    } else if (file.type.startsWith('video/')) {
      detectedType = 'video'
    }
    
    setSelectedFile(file)
    setFileType(detectedType)
    setNewPost(prev => ({ ...prev, video_file: file }))
    
    setPlatformErrors({})
    setTimeout(() => validateAllPlatforms(), 100)
  }

  const handleDescriptionChange = (description: string) => {
    setNewPost(prev => ({ ...prev, default_description: description }))
    
    if (newPost.use_same_description) {
      setNewPost(prev => ({
        ...prev,
        platform_content: prev.platform_content.map(platform => ({
          ...platform,
          custom_description: description
        }))
      }))
    }
    
    setTimeout(() => validateAllPlatforms(), 100)
  }

  const handlePlatformToggle = (platformId: number, enabled: boolean) => {
    setNewPost(prev => ({
      ...prev,
      platform_content: prev.platform_content.map(platform =>
        platform.platform_id === platformId 
          ? { ...platform, enabled }
          : platform
      )
    }))
    
    setTimeout(() => validateAllPlatforms(), 100)
  }

  const handlePlatformContentChange = (platformId: number, field: string, value: string) => {
    setNewPost(prev => ({
      ...prev,
      platform_content: prev.platform_content.map(platform =>
        platform.platform_id === platformId 
          ? { ...platform, [field]: value }
          : platform
      )
    }))
    
    setTimeout(() => validateAllPlatforms(), 100)
  }

  const handleCreatePost = async () => {
    const enabledPlatforms = newPost.platform_content.filter(p => p.enabled)
    if (enabledPlatforms.length === 0) {
      toast.error("Please select at least one platform")
      return
    }
    
    if (!validateAllPlatforms()) {
      toast.error("Please fix all validation errors before creating the post")
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Use the enhanced API client method
      const result = await apiClient.socialMedia.createPostEnhanced({
        title: newPost.title,
        media_file: selectedFile, // Can be image, video, or null
        use_same_description: newPost.use_same_description,
        default_description: newPost.default_description,
        platform_content: enabledPlatforms
      }) as { success: boolean; message?: string; post_id?: number }

      if (result.success) {
        toast.success("Post created successfully!")
        setIsCreatePostOpen(false)
        resetForm()
        loadInitialData()
      } else {
        toast.error(result.message || "Failed to create post")
      }

    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setNewPost({
      title: "",
      video_file: null as any,
      use_same_description: true,
      default_description: "",
      platform_content: platforms.map(platform => ({
        platform_id: platform.id,
        enabled: true,
        custom_description: "",
        hashtags: "",
        mentions: ""
      }))
    })
    setSelectedFile(null)
    setFileType(null)
    setPlatformErrors({})
    setHasValidationErrors(false)
  }

  // =============================================================================
  // ACCOUNT MANAGEMENT HANDLERS
  // =============================================================================

  const handleConnectAccount = async (platform: SocialMediaPlatform) => {
    setNewAccount({
      platform_id: platform.id,
      account_name: "",
      account_username: "",
    })
    setIsConnectingAccount(true)
  }

  const handleSubmitConnection = async () => {
    if (!newAccount.account_name.trim()) {
      toast.error("Please enter an account name")
      return
    }

    try {
      const result = await apiClient.socialMedia.connectAccount({
        platform_id: newAccount.platform_id,
        account_name: newAccount.account_name.trim(),
        account_username: newAccount.account_username.trim() || undefined,
      }) as { success: boolean; message?: string; account_id?: number }

      if (result.success) {
        toast.success("Account connected successfully!")
        setIsConnectingAccount(false)
        setNewAccount({ platform_id: 0, account_name: "", account_username: "" })
        loadInitialData()
      } else {
        toast.error(result.message || "Failed to connect account")
      }

    } catch (error) {
      console.error("Error connecting account:", error)
      toast.error("Failed to connect account")
    }
  }

  const handleDisconnectAccount = async (accountId: number, platformName: string) => {
    if (!confirm(`Are you sure you want to disconnect the ${platformName} account?`)) {
      return
    }

    try {
      const result = await apiClient.socialMedia.disconnectAccount(accountId) as { 
        success: boolean; 
        message?: string 
      }

      if (result.success) {
        toast.success("Account disconnected successfully")
        loadInitialData()
      } else {
        toast.error("Failed to disconnect account")
      }

    } catch (error) {
      console.error("Error disconnecting account:", error)
      toast.error("Failed to disconnect account")
    }
  }

  const handleTestConnection = async (accountId: number, platformName: string) => {
    setTestingConnection(prev => ({ ...prev, [accountId]: true }))
    
    try {
      const result = await apiClient.socialMedia.testConnection(accountId) as { 
        success: boolean; 
        message: string 
      }
      
      setConnectionResults(prev => ({ 
        ...prev, 
        [accountId]: { 
          success: result.success, 
          message: result.message 
        } 
      }))
      
      if (result.success) {
        toast.success(`${platformName} connection successful!`)
      } else {
        toast.error(`${platformName} connection failed: ${result.message}`)
      }
      
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionResults(prev => ({ 
        ...prev, 
        [accountId]: { 
          success: false, 
          message: 'Connection test failed' 
        } 
      }))
      toast.error(`Failed to test ${platformName} connection`)
    } finally {
      setTestingConnection(prev => ({ ...prev, [accountId]: false }))
    }
  }

  // =============================================================================
  // POST MANAGEMENT HANDLERS
  // =============================================================================

  const handlePublishPost = async (postId: number) => {
    try {
      const result = await apiClient.socialMedia.publishPost(postId) as { 
        success: boolean; 
        message?: string; 
        results?: Array<{ success: boolean }> 
      }
      
      if (result.success) {
        const successCount = result.results?.filter((r: any) => r.success).length || 0
        const totalCount = result.results?.length || 0
        toast.success(`Published to ${successCount}/${totalCount} platforms`)
        loadInitialData()
      } else {
        toast.error(result.message || "Failed to publish post")
      }

    } catch (error) {
      console.error("Error publishing post:", error)
      toast.error("Failed to publish post")
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post? This will remove it from all platforms.")) {
      return
    }

    try {
      const result = await apiClient.socialMedia.deletePost(postId) as { 
        success: boolean; 
        message?: string 
      }
      
      if (result.success) {
        toast.success("Post deleted successfully")
        loadInitialData()
      } else {
        toast.error("Failed to delete post")
      }

    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Failed to delete post")
    }
  }

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>
      case 'publishing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Publishing</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'draft':
        return <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPlatformIcon = (iconClass: string, brandColor: string) => {
    return (
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: brandColor }}
      >
        {iconClass?.split('-').pop()?.charAt(0).toUpperCase()}
      </div>
    )
  }

  const getCredentialFields = (platformName: string) => {
    switch (platformName) {
      case 'x':
        return [
          { key: 'consumer_key', label: 'Consumer Key', required: true },
          { key: 'consumer_secret', label: 'Consumer Secret', required: true },
          { key: 'access_token', label: 'Access Token', required: true },
          { key: 'access_token_secret', label: 'Access Token Secret', required: true }
        ]
      case 'linkedin':
        return [
          { key: 'client_id', label: 'Client ID', required: true },
          { key: 'client_secret', label: 'Client Secret', required: true },
          { key: 'access_token', label: 'Access Token', required: true }
        ]
      case 'youtube':
        return [
          { key: 'client_id', label: 'Client ID', required: true },
          { key: 'client_secret', label: 'Client Secret', required: true },
          { key: 'refresh_token', label: 'Refresh Token', required: true }
        ]
      case 'facebook':
        return [
          { key: 'app_id', label: 'App ID', required: true },
          { key: 'app_secret', label: 'App Secret', required: true },
          { key: 'access_token', label: 'Page Access Token', required: true }
        ]
      case 'instagram':
        return [
          { key: 'app_id', label: 'App ID', required: true },
          { key: 'app_secret', label: 'App Secret', required: true },
          { key: 'access_token', label: 'Access Token', required: true }
        ]
      case 'tiktok':
        return [
          { key: 'client_key', label: 'Client Key', required: true },
          { key: 'client_secret', label: 'Client Secret', required: true },
          { key: 'access_token', label: 'Access Token', required: true }
        ]
      default:
        return [
          { key: 'api_key', label: 'API Key', required: true },
          { key: 'api_secret', label: 'API Secret', required: true }
        ]
    }
  }

  const getConnectionStatusBadge = (account: any, accountId: number) => {
    const testResult = connectionResults[accountId]
    const isTesting = testingConnection[accountId]
    
    if (isTesting) {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Testing...
        </Badge>
      )
    }
    
    if (testResult) {
      return testResult.success ? (
        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      ) : (
        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    
    if (account?.is_connected) {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      )
    }
    
    return (
      <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Not Connected
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading social media management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Social Media Management</h1>
          <p className="text-muted-foreground">Create, publish, and manage content across all social platforms</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAccountsOpen(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Accounts
          </Button>
          <Button onClick={() => setIsCreatePostOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Platform Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {platforms.map((platform) => {
          const account = accounts.find(acc => acc.platform_id === platform.id)
          const isConnected = account?.is_connected || false
          
          return (
            <Card key={platform.id} className={`${isConnected ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {getPlatformIcon(platform.icon_class, platform.brand_color)}
                </div>
                <p className="font-medium text-sm">{platform.display_name}</p>
                <Badge 
                  variant={isConnected ? "default" : "secondary"} 
                  className={`text-xs mt-2 ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`}
                >
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2" onClick={loadAnalytics}>
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Create your first social media post to get started</p>
                <Button onClick={() => setIsCreatePostOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">
                              {post.title || post.video_filename}
                            </h3>
                            {getStatusBadge(post.overall_status)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Users className="h-4 w-4" />
                            <span>{post.full_name || post.email}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            {post.published_at && (
                              <>
                                <span>•</span>
                                <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>

                          {/* Platform Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {Object.entries(post.platform_statuses).map(([platformName, status]: [string, any]) => (
                              <Badge
                                key={platformName}
                                variant="outline"
                                className={`text-xs ${
                                  status.status === 'published' ? 'border-green-500 text-green-700' :
                                  status.status === 'failed' ? 'border-red-500 text-red-700' :
                                  'border-orange-500 text-orange-700'
                                }`}
                              >
                                {platformName}: {status.status}
                              </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground">
                              {post.published_count}/{post.total_platforms} platforms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.overall_status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishPost(post.id)}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_posts || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.published_posts || 0}</div>
                  <p className="text-xs text-muted-foreground">Successfully published</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{analytics.failed_posts || 0}</div>
                  <p className="text-xs text-muted-foreground">Publication failures</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.active_employees || 0}</div>
                  <p className="text-xs text-muted-foreground">Employees posting</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Click the Analytics tab to load data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Social Media Post</DialogTitle>
            <DialogDescription>
              Create content for multiple social platforms. Upload media (optional) and customize content for each platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Media Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Media Upload (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {!selectedFile ? (
                  <div className="text-center">
                    <div className="flex justify-center space-x-4 mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Upload Media or Create Text-Only Post</h3>
                    <p className="text-muted-foreground mb-4">
                      Support: Images (JPG, PNG, GIF), Videos (MP4, MOV, AVI) or create text-only posts
                    </p>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {fileType === 'image' ? (
                        <ImageIcon className="h-12 w-12 text-green-500" />
                      ) : fileType === 'video' ? (
                        <FileVideo className="h-12 w-12 text-blue-500" />
                      ) : (
                        <FileText className="h-12 w-12 text-gray-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium mb-2">{selectedFile.name}</h3>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Type: {fileType?.toUpperCase() || 'Unknown'}</p>
                      <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setSelectedFile(null)
                      setFileType(null)
                      setNewPost(prev => ({ ...prev, video_file: null as any }))
                      setPlatformErrors({})
                    }}>
                      Remove File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title (Optional)</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for your post"
                />
              </div>

              {/* Use Same Description Toggle */}
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Switch
                  id="use_same_description"
                  checked={newPost.use_same_description}
                  onCheckedChange={(checked) => {
                    setNewPost(prev => ({ ...prev, use_same_description: checked }))
                    if (checked) {
                      setNewPost(prev => ({
                        ...prev,
                        platform_content: prev.platform_content.map(platform => ({
                          ...platform,
                          custom_description: prev.default_description || ''
                        }))
                      }))
                    }
                    setTimeout(() => validateAllPlatforms(), 100)
                  }}
                />
                <Label htmlFor="use_same_description" className="font-medium">
                  Use same description for all platforms
                </Label>
              </div>

              {/* Default Description */}
              {newPost.use_same_description && (
                <div className="space-y-2">
                  <Label htmlFor="default_description">Default Description</Label>
                  <Textarea
                    id="default_description"
                    value={newPost.default_description || ''}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Write a description that works for all platforms..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This description will be used for all enabled platforms
                  </p>
                </div>
              )}
            </div>

            {/* Validation Errors Summary */}
            {hasValidationErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the validation errors below before creating the post.
                </AlertDescription>
              </Alert>
            )}

            {/* Platform Specific Content */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Platform Settings</Label>
              
              <div className="space-y-4">
                {platforms.map((platform) => {
                  const platformContent = newPost.platform_content.find(p => p.platform_id === platform.id)
                  const account = accounts.find(acc => acc.platform_id === platform.id)
                  const isConnected = account?.is_connected || false
                  const config = PLATFORM_CONFIGS[platform.name] || {}
                  const errors = platformErrors[platform.id] || []
                  const hasErrors = errors.length > 0
                  
                  return (
                    <Card key={platform.id} className={`${
                      platformContent?.enabled 
                        ? hasErrors 
                          ? 'border-red-200 bg-red-50/30' 
                          : 'border-blue-200 bg-blue-50/30'
                        : 'border-muted'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getPlatformIcon(platform.icon_class, platform.brand_color)}
                            <div>
                              <CardTitle className="text-base">{platform.display_name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {config.character_limit ? `Max ${config.character_limit} characters` : 'No limit'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isConnected && (
                              <Badge variant="outline" className="text-xs">Not Connected</Badge>
                            )}
                            <Checkbox
                              checked={platformContent?.enabled || false}
                              onCheckedChange={(checked) => handlePlatformToggle(platform.id, !!checked)}
                              disabled={!isConnected}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Platform Errors */}
                      {platformContent?.enabled && hasErrors && (
                        <CardContent className="pt-0 pb-3">
                          <Alert variant="destructive" className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                {errors.map((error, index) => (
                                  <div key={index} className="text-sm">{error}</div>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      )}
                      
                      {platformContent?.enabled && !newPost.use_same_description && (
                        <CardContent className="pt-0 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Custom Description</Label>
                            <Textarea
                              value={platformContent.custom_description || ""}
                              onChange={(e) => handlePlatformContentChange(platform.id, 'custom_description', e.target.value)}
                              placeholder={config.description_placeholder || `Custom description for ${platform.display_name}...`}
                              rows={2}
                            />
                            {config.character_limit && (
                              <p className="text-xs text-muted-foreground text-right">
                                {(platformContent.custom_description || '').length}/{config.character_limit}
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Hashtags</Label>
                              <Input
                                value={platformContent.hashtags || ""}
                                onChange={(e) => handlePlatformContentChange(platform.id, 'hashtags', e.target.value)}
                                placeholder="#business #marketing"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm">Mentions</Label>
                              <Input
                                value={platformContent.mentions || ""}
                                onChange={(e) => handlePlatformContentChange(platform.id, 'mentions', e.target.value)}
                                placeholder="@username @company"
                              />
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreatePostOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePost} 
              disabled={isUploading || hasValidationErrors}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Accounts Dialog */}
      <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Social Media Accounts</DialogTitle>
            <DialogDescription>
              Connect and manage your social media platform accounts. Configure API credentials and test connections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {platforms.map((platform) => {
              const account = accounts.find(acc => acc.platform_id === platform.id)
              const isConnected = account?.is_connected || false
              const credentialFields = getCredentialFields(platform.name)
              const showCreds = showCredentials[account?.id] || false
              
              return (
                <Card key={platform.id} className={`${isConnected ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPlatformIcon(platform.icon_class, platform.brand_color)}
                        <div>
                          <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                          {account ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                {account.account_name} {account.account_username && `(@${account.account_username})`}
                              </p>
                              {account.last_auth_check && (
                                <p className="text-xs text-muted-foreground">
                                  Last checked: {new Date(account.last_auth_check).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No account connected</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getConnectionStatusBadge(account, account?.id)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Connection Test Results */}
                    {connectionResults[account?.id] && (
                      <Alert variant={connectionResults[account.id].success ? "default" : "destructive"}>
                        {connectionResults[account.id].success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          {connectionResults[account.id].message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Account Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {account ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(account.id, platform.display_name)}
                            disabled={testingConnection[account.id]}
                          >
                            {testingConnection[account.id] ? (
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4 mr-1" />
                            )}
                            Test Connection
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCredentials(prev => ({ 
                              ...prev, 
                              [account.id]: !showCreds 
                            }))}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            {showCreds ? 'Hide' : 'Show'} Credentials
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisconnectAccount(account.id, platform.display_name)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnectAccount(platform)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Connect Account
                        </Button>
                      )}
                    </div>
                    
                    {/* API Credentials Section */}
                    {account && showCreds && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="h-4 w-4" />
                          <h4 className="font-medium">API Credentials</h4>
                          <Badge variant="outline" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Stored in .env
                          </Badge>
                        </div>
                        
                        <Alert className="mb-4">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            API credentials are stored securely in your environment configuration. 
                            Update your .env file with the following variables for {platform.display_name}:
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-3">
                          {credentialFields.map((field) => {
                            const envVarName = `${platform.name.toUpperCase()}_${field.key.toUpperCase()}`
                            
                            return (
                              <div key={field.key} className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  {field.label}
                                  {field.required && <span className="text-red-500">*</span>}
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={envVarName}
                                    readOnly
                                    className="font-mono text-xs bg-muted"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(envVarName)
                                      toast.success("Environment variable name copied!")
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Add this to your .env file: <code className="bg-muted px-1 rounded">{envVarName}=your_value_here</code>
                                </p>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Platform-specific setup instructions */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Setup Instructions for {platform.display_name}
                          </h5>
                          <div className="text-sm text-blue-700 space-y-1">
                            {platform.name === 'x' && (
                              <div>
                                <p>1. Go to <a href="https://developer.twitter.com" target="_blank" className="underline">Twitter Developer Portal</a></p>
                                <p>2. Create a new app and generate API keys</p>
                                <p>3. Enable OAuth 1.0a with read/write permissions</p>
                                <p>4. Add the keys to your .env file</p>
                              </div>
                            )}
                            {platform.name === 'linkedin' && (
                              <div>
                                <p>1. Go to <a href="https://www.linkedin.com/developers/" target="_blank" className="underline">LinkedIn Developers</a></p>
                                <p>2. Create a new app with Marketing Developer Platform access</p>
                                <p>3. Request r_liteprofile, r_organization_social, w_member_social permissions</p>
                                <p>4. Add the credentials to your .env file</p>
                              </div>
                            )}
                            {platform.name === 'youtube' && (
                              <div>
                                <p>1. Go to <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a></p>
                                <p>2. Enable YouTube Data API v3</p>
                                <p>3. Create OAuth 2.0 credentials</p>
                                <p>4. Add the credentials to your .env file</p>
                              </div>
                            )}
                            {platform.name === 'facebook' && (
                              <div>
                                <p>1. Go to <a href="https://developers.facebook.com" target="_blank" className="underline">Facebook Developers</a></p>
                                <p>2. Create a business app with Pages API access</p>
                                <p>3. Generate a Page Access Token</p>
                                <p>4. Add the credentials to your .env file</p>
                              </div>
                            )}
                            {platform.name === 'instagram' && (
                              <div>
                                <p>1. Use Facebook Business app (Instagram uses Facebook API)</p>
                                <p>2. Add Instagram Basic Display or Instagram Graph API</p>
                                <p>3. Connect your Instagram Business account</p>
                                <p>4. Add the credentials to your .env file</p>
                              </div>
                            )}
                            {platform.name === 'tiktok' && (
                              <div>
                                <p>1. Apply for <a href="https://developers.tiktok.com" target="_blank" className="underline">TikTok for Business</a></p>
                                <p>2. Wait for API access approval (can take weeks)</p>
                                <p>3. Create app and get marketing API access</p>
                                <p>4. Add the credentials to your .env file</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Account Status Details */}
                    {account && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Account Status</Label>
                          <p className="font-medium">{account.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Connection Status</Label>
                          <p className="font-medium">{account.is_connected ? 'Connected' : 'Disconnected'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Created</Label>
                          <p className="font-medium">{new Date(account.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Last Updated</Label>
                          <p className="font-medium">{new Date(account.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Credentials are managed via environment variables for security</span>
            </div>
            <Button variant="outline" onClick={() => {
              setIsAccountsOpen(false)
              setShowCredentials({})
              setConnectionResults({})
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Account Dialog */}
      <Dialog open={isConnectingAccount} onOpenChange={setIsConnectingAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Social Media Account</DialogTitle>
            <DialogDescription>
              {newAccount.platform_id && (
                <>Connect your {platforms.find(p => p.id === newAccount.platform_id)?.display_name} account</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={newAccount.account_name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="e.g., GladGrade Business"
                required
              />
              <p className="text-xs text-muted-foreground">
                Display name for this account in the system
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_username">Username/Handle (Optional)</Label>
              <Input
                id="account_username"
                value={newAccount.account_username}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_username: e.target.value }))}
                placeholder="@gladgrade"
              />
              <p className="text-xs text-muted-foreground">
                Your account username or handle (without @)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">API Setup Required</p>
                  <p className="text-blue-700">
                    After connecting, you'll need to configure API credentials in your .env file. 
                    Check the setup guide for detailed instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectingAccount(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitConnection}
              disabled={!newAccount.account_name.trim()}
            >
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}