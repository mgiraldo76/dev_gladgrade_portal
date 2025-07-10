// File: components/review-details-modal.tsx
// Path: components/review-details-modal.tsx
// FIXED: Survey Data loading with proper question text lookup + Enhanced Images Tab

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Star,
  User,
  Calendar,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  Eye,
  EyeOff,
  Send,
  Save,
  Building,
  Phone,
  Mail,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
  Heart,
  ThumbsUp,
  Reply,
  ExternalLink,
  X,
  Shield,
  Receipt,
  Camera,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { getAuth } from 'firebase/auth'

// Type definitions for API responses
interface SurveyAnswer {
  id: string | number
  surveyQuestionId?: string | number
  surveyquestionid?: string | number
  answer: string
  question?: string
  userId?: string | number
  dateCreated?: string
}

interface SurveyQuestion {
  id: string | number
  question?: string
  questiontext?: string
  questionText?: string
  businessTypeId?: number
  isActive?: boolean
}

// Enhanced image interface
interface ReviewImage {
  id: string
  imageURL: string
  orderByNumber: number
  dateCreated: string
  imageType?: string
  imageTypeId?: number
}

interface ReviewDetails {
  // Basic review info
  id: string
  review: string
  ratingValue: number
  reviewCreatedDate: string
  isPrivate: boolean
  hasImages: boolean
  imageCount: number
  
  // User info
  author: string
  userId?: string
  userEmail?: string
  userPhone?: string
  
  // Business/Location info
  placeName: string
  placeId: string
  placeAddress: string
  subcategory: string
  
  // Rating details
  ratingId: string
  businessTypeId?: number
  
  // Images
  images?: Array<ReviewImage>
  
  // Survey answers
  surveyAnswers?: Array<{
    id: string
    question: string
    answer: string
    surveyQuestionId: string
  }>
  
  // Existing replies
  replies?: Array<{
    id: string
    message: string
    fromBusiness: boolean
    authorName: string
    dateCreated: string
  }>
}

interface ReviewDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reviewId: string | null
  onReviewUpdated?: () => void
}

// Image display component with error handling
function ImageThumbnail({ 
  image, 
  onClick, 
  showModeration = false,
  reviewId 
}: { 
  image: ReviewImage
  onClick: () => void
  showModeration?: boolean
  reviewId: string
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleModerationClick = () => {
    // Open Content Moderation in new window, filtering by this image
    const moderationUrl = `/dashboard/moderation?type=image&search=${image.id}`
    window.open(moderationUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative group border rounded-lg overflow-hidden bg-muted/30">
      {/* Image container */}
      <div 
        className="aspect-square cursor-pointer relative overflow-hidden"
        onClick={onClick}
      >
        {!imageError ? (
          <img
            src={image.imageURL}
            alt={`Review image ${image.orderByNumber || 'untitled'}`}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            } hover:scale-105 transition-transform duration-200`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <span className="text-xs text-center px-2">Error loading image</span>
            <a 
              href={image.imageURL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 break-all px-2 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              View URL
            </a>
          </div>
        )}

        {/* Loading spinner */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Moderation link for staff */}
      {showModeration && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="secondary"
            size="sm"
            className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-md"
            onClick={(e) => {
              e.stopPropagation()
              handleModerationClick()
            }}
            title="Open in Content Moderation"
          >
            <Shield className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Image lightbox modal
function ImageLightbox({ 
  image, 
  isOpen, 
  onClose 
}: { 
  image: ReviewImage | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm">
              Review Image {image.orderByNumber ? `#${image.orderByNumber}` : ''}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex items-center justify-center max-h-[calc(90vh-100px)] overflow-hidden">
          <img
            src={image.imageURL}
            alt={`Review image ${image.orderByNumber || 'untitled'}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Ensure proper export
export default ReviewDetailsModal

export function ReviewDetailsModal({ 
  isOpen, 
  onClose, 
  reviewId, 
  onReviewUpdated 
}: ReviewDetailsModalProps) {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewDetails, setReviewDetails] = useState<ReviewDetails | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [tempPrivacyStatus, setTempPrivacyStatus] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ReviewImage | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  // Determine access level
  const isClientUser = role === 'client'
  const canModerate = ['super_admin', 'admin', 'employee', 'moderator'].includes(role || '')
  const canEditPrivacy = canModerate // Only admins can edit privacy
  
  // Load review details when modal opens
  useEffect(() => {
    if (isOpen && reviewId) {
      console.log('🔄 Loading review details for ID:', reviewId)
      console.log('📨 Modal props changed:', { isOpen, reviewId })
      loadReviewDetails()
    }
  }, [isOpen, reviewId])

  // FIXED: Enhanced loadReviewDetails function with proper survey data handling
  const loadReviewDetails = async () => {
    if (!reviewId) return

    console.log('📥 loadReviewDetails called with reviewId:', reviewId)
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add Firebase auth token
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      console.log('🔍 Loading review details for reviewId:', reviewId)

      // Load review by review ID
      const reviewResponse = await fetch(`/api/gcloud-proxy/consumerReviews/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reviewIds: [reviewId],
          includePrivate: true
        })
      })

      if (!reviewResponse.ok) {
        console.error('Review API response not OK:', reviewResponse.status)
        throw new Error('Failed to load review details')
      }

      const reviewData = await reviewResponse.json()
      console.log('📋 Review API Response:', reviewData)
      
      const review = reviewData.data?.[0]

      if (!review) {
        console.error('No review found in response')
        throw new Error('Review not found')
      }

      console.log('✅ Found review:', review)

      // Load images for this review
      let images = []
      try {
        const imagesResponse = await fetch(`/api/gcloud-proxy/reviews/all-images/${review.id}`, {
          headers
        })
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          images = imagesData.data || []
          console.log('🖼️ Loaded images:', images)
        }
      } catch (error) {
        console.warn('Could not load images:', error)
      }

      // FIXED: Enhanced survey data loading with question text lookup
      let surveyAnswers = []
      try {
        console.log('📊 Loading survey answers for reviewId:', reviewId)
        
        const surveyResponse = await fetch(`/api/gcloud-proxy/reviews/survey-answers/${reviewId}`, {
          method: 'GET',
          headers
        })
        
        if (surveyResponse.ok) {
          const surveyData = await surveyResponse.json()
          surveyAnswers = (surveyData.data || []).map((answer: SurveyAnswer) => ({
            id: answer.id?.toString() || '',
            question: answer.question || 'Question text not available',
            answer: answer.answer || '',
            surveyQuestionId: answer.surveyQuestionId?.toString() || ''
          }))
          
          console.log(`✅ Loaded ${surveyAnswers.length} survey answers with questions`)
          console.log('📊 Survey answers:', surveyAnswers)
        } else {
          console.warn('Failed to fetch survey answers:', surveyResponse.status)
        }
      } catch (error) {
        console.warn('Could not load survey answers:', error)
      }

      // Format review details with proper field mappings
      const details: ReviewDetails = {
        id: review.id?.toString() || '',
        review: review.review || '',
        ratingValue: parseInt(review.ratingvalue, 10) || parseInt(review.ratingValue, 10) || 0,
        reviewCreatedDate: review.datecreated || '',
        isPrivate: Boolean(review.isprivate),
        hasImages: Boolean(review.hasimages),
        imageCount: images.length,
        
        author: review.displayname || review.firstname || 'Anonymous',
        userId: review.userid?.toString(),
        
        placeName: review.placename || review.placeName || 'Unknown Location',
        placeId: review.placeid || review.placeId || '',
        placeAddress: review.placeaddress || review.placeAddress || '',
        subcategory: review.subcategory || '',
        
        ratingId: review.consumerratingid?.toString() || '',
        
        images,
        surveyAnswers, // Now properly populated with question text
        replies: []
      }

      console.log('✅ Formatted review details:', details)
      console.log('📊 Survey answers with questions:', details.surveyAnswers)
      setReviewDetails(details)
      setTempPrivacyStatus(details.isPrivate)
      
    } catch (error) {
      console.error('❌ Error loading review details:', error)
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Privacy update with proper error handling and debugging
  const handleSavePrivacyStatus = async () => {
    if (!reviewDetails || !canEditPrivacy) return
    
    setSaving(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add Firebase auth token
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
        
        // DEBUGGING: Check the token claims
        const tokenResult = await currentUser.getIdTokenResult()
        console.log('🔑 Current user token claims:', tokenResult.claims)
        console.log('🔑 User email:', currentUser.email)
        console.log('🔑 User role from providers:', role)
      }

      console.log('💾 Saving privacy status:', {
        reviewId: reviewDetails.id,
        currentPrivacy: reviewDetails.isPrivate,
        newPrivacy: tempPrivacyStatus,
        userRole: role,
        userEmail: user?.email
      })

      // FIXED: Send the correct request body format
      const requestBody = {
        consumerReviewId: parseInt(reviewDetails.id), // Ensure it's a number
        isPrivate: tempPrivacyStatus
      }

      console.log('📤 Request body:', requestBody)

      const response = await fetch(`/api/gcloud-proxy/review/consumerReview/update`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody)
      })

      console.log('📡 Privacy update response status:', response.status)

      // IMPROVED: Better error handling with detailed logging
      if (!response.ok) {
        const responseText = await response.text()
        console.error('❌ Privacy update failed:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: responseText
        })

        let errorMessage = 'Failed to update privacy status'
        
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
          console.error('❌ Parsed error:', errorData)
        } catch (parseError) {
          console.error('❌ Could not parse error response:', responseText)
        }

        // Show specific error messages to help debug
        if (response.status === 403) {
          errorMessage = `Access denied. Your role (${role}) may not have permission to edit reviews. Please contact an administrator.`
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please refresh the page and try again.'
        } else if (response.status === 404) {
          errorMessage = 'Review not found or you do not have permission to edit it.'
        }

        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('✅ Privacy update successful:', responseData)

      // Update local state
      setReviewDetails(prev => prev ? { ...prev, isPrivate: tempPrivacyStatus } : null)
      
      // Notify parent component to refresh the reviews list
      if (onReviewUpdated) {
        onReviewUpdated()
      }

      console.log('✅ Privacy status updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating privacy status:', error)
      
      // Reset to original value on error
      setTempPrivacyStatus(reviewDetails.isPrivate)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update privacy status. Please try again.'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !reviewDetails) return
    
    setSendingReply(true)
    try {
      // TODO: Implement reply functionality
      console.log('Sending reply:', replyMessage)
      console.log('To review:', reviewDetails.id)
      
      setReplyMessage("")
      
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingReply(false)
    }
  }

  const handleImageClick = (image: ReviewImage) => {
    setSelectedImage(image)
    setLightboxOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'text-green-600 dark:text-green-400'
    if (rating >= 7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRatingBadgeVariant = (rating: number) => {
    if (rating >= 9) return 'default'
    if (rating >= 7) return 'secondary'
    return 'destructive'
  }

  if (!isOpen) return null

  // Separate images by type for the Images tab
  const reviewImages = reviewDetails?.images?.filter((img: ReviewImage) => 
    img.imageTypeId === 1 || img.imageType === 'Review Photo'
  ) || []
  
  const receiptImages = reviewDetails?.images?.filter((img: ReviewImage) => 
    img.imageTypeId === 2 || img.imageType === 'Receipt'
  ) || []

  const hasReviewImages = reviewImages.length > 0
  const hasReceiptImages = receiptImages.length > 0
  const hasAnyImages = hasReviewImages || hasReceiptImages
  const canViewReceipts = canModerate

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Review Details
          </DialogTitle>
          <DialogDescription>
            Complete review information and customer interaction tools
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading review details...</span>
          </div>
        ) : reviewDetails ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="survey">Survey Data</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Review Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRatingBadgeVariant(reviewDetails.ratingValue)}>
                        <Star className="h-3 w-3 mr-1" />
                        {reviewDetails.ratingValue}/10
                      </Badge>
                      {reviewDetails.isPrivate && (
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {!reviewDetails.isPrivate && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(reviewDetails.reviewCreatedDate)}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{reviewDetails.placeName}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{reviewDetails.placeAddress}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Review Text */}
                    <div>
                      <Label className="font-medium">Customer Review:</Label>
                      <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                        <p className="text-foreground leading-relaxed">{reviewDetails.review}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">Customer:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{reviewDetails.author}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="font-medium">Category:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{reviewDetails.subcategory || 'General'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Controls - Admin Only */}
                    {canEditPrivacy && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Label className="font-medium">Privacy Settings</Label>
                            <p className="text-sm text-muted-foreground">
                              Control whether this review is visible to the public
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="privacy-toggle"
                                checked={tempPrivacyStatus}
                                onCheckedChange={setTempPrivacyStatus}
                                disabled={saving}
                              />
                              <Label htmlFor="privacy-toggle" className="text-sm">
                                {tempPrivacyStatus ? 'Private' : 'Public'}
                              </Label>
                            </div>
                            {tempPrivacyStatus !== reviewDetails.isPrivate && (
                              <Button 
                                size="sm" 
                                onClick={handleSavePrivacyStatus}
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Survey Data Tab - FIXED */}
            <TabsContent value="survey" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Responses</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Additional questions the customer answered about their experience
                  </p>
                </CardHeader>
                <CardContent>
                  {reviewDetails.surveyAnswers && reviewDetails.surveyAnswers.length > 0 ? (
                    <div className="space-y-4">
                      {reviewDetails.surveyAnswers.map((answer, index) => (
                        <div key={answer.id} className="border rounded-lg p-4">
                          <Label className="font-medium text-sm">
                            Q{index + 1}: {answer.question}
                          </Label>
                          <p className="mt-2 text-foreground">{answer.answer}</p>
                          {answer.surveyQuestionId && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Question ID: {answer.surveyQuestionId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No survey responses available for this review</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* UPDATED: Enhanced Images Tab */}
            <TabsContent value="images" className="space-y-6">
              {hasAnyImages ? (
                <>
                  {/* Review Photos Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Review Images
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Photos uploaded by the customer with their review
                      </p>
                    </CardHeader>
                    <CardContent>
                      {hasReviewImages ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {reviewImages.map((image) => (
                            <ImageThumbnail
                              key={image.id}
                              image={image}
                              onClick={() => handleImageClick(image)}
                              showModeration={canModerate}
                              reviewId={reviewDetails.id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No review photos attached</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Receipt Images Section - Only for GladGrade staff */}
                  {hasReceiptImages && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            <CardTitle>Receipt Images</CardTitle>
                            <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                              <Eye className="h-3 w-3 mr-1" />
                              Staff Only
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receipt images uploaded by the customer (internal use only)
                        </p>
                      </CardHeader>
                      <CardContent>
                        {canViewReceipts ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {receiptImages.map((image) => (
                              <ImageThumbnail
                                key={image.id}
                                image={image}
                                onClick={() => handleImageClick(image)}
                                showModeration={canModerate}
                                reviewId={reviewDetails.id}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>You don't have clearance to view certain image types in this portal.</p>
                            <p className="text-sm mt-2">Check with your system administrator.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Moderation Link for Staff */}
                  {canModerate && hasAnyImages && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">Content Moderation</p>
                              <p className="text-sm text-muted-foreground">
                                Review and moderate all images for this review
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const moderationUrl = `/dashboard/moderation?type=image&search=${reviewDetails.id}`
                              window.open(moderationUrl, '_blank', 'noopener,noreferrer')
                            }}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Moderation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : null}
            </TabsContent>

            {/* Communication Tab */}
            <TabsContent value="communication" className="space-y-4">
              {/* Existing Replies */}
              {reviewDetails.replies && reviewDetails.replies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Previous Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviewDetails.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            {reply.fromBusiness ? (
                              <Building className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                            ) : (
                              <User className="h-8 w-8 p-1.5 bg-muted text-muted-foreground rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{reply.authorName}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(reply.dateCreated)}
                              </span>
                              {reply.fromBusiness && (
                                <Badge variant="outline" className="text-xs">Business</Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{reply.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reply Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Response</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Reply to this customer review
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your response to the customer..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || sendingReply}
                      >
                        {sendingReply ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load review details</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>

        {/* Image Lightbox */}
        <ImageLightbox
          image={selectedImage}
          isOpen={lightboxOpen}
          onClose={() => {
            setLightboxOpen(false)
            setSelectedImage(null)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}