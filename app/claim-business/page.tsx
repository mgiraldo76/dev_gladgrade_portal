// File: app/claim-business/page.tsx
// Path: app/claim-business/page.tsx

"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/logo"
import { ArrowLeft, Upload, Building2, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface IndustryCategory {
  id: number
  name: string
  description?: string
  icon?: string
}

interface UploadedFile {
  file: File
  preview?: string
  uploading?: boolean
  error?: string
}

export default function ClaimBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<IndustryCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [formStartTime] = useState(Date.now())
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    admin_phone: "",
    website: "",
    business_address: "",
    industry_category_id: "",
    fein: "",
    dun_bradstreet_id: ""
  })

  // Load industry categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // console.log("🔐 Authenticating for categories...")
        
        // Sign in with dummy account
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const { auth } = await import('@/services/firebase')
        
        if (!auth) {
          throw new Error('Firebase not configured')
        }

        await signInWithEmailAndPassword(
          auth, 
          'public_business_claim@gladgrade.com',
          'thisisbusinessclaimpublicuserpassw0rd!'
        )
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://gladgrade-api-360532994710.us-east4.run.app'}/api/portal/sales/businessclaim_categories`,
          {
            headers: {
              'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
            }
          }
        )
        const data = await response.json()
        
        if (data.success) {
          setCategories(data.data)
        } else {
          console.error("Failed to load categories:", data.error)
        }
        
        // Sign out after loading categories
        await auth.signOut()
        
      } catch (error) {
        console.error("Error loading categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("") // Clear errors when user starts typing
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    const newFiles: UploadedFile[] = []
    
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Allowed: PDF, JPG, PNG, DOC, DOCX`)
        return
      }
      
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size: 10MB`)
        return
      }
      
      newFiles.push({ file })
    })
    
    if (uploadedFiles.length + newFiles.length > 10) {
      setError("Maximum 10 files allowed")
      return
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.business_name.trim()) errors.push("Business name is required")
    if (!formData.business_address.trim()) errors.push("Business address is required")
    if (!formData.contact_email.trim()) errors.push("Email address is required")
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.contact_email && !emailRegex.test(formData.contact_email)) {
      errors.push("Please enter a valid email address")
    }
    
    // Phone validation (if provided)
    if (formData.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push("Please enter a valid phone number")
      }
    }
    
    // Website validation (if provided)
    if (formData.website && !formData.website.startsWith('http')) {
      setFormData(prev => ({
        ...prev,
        website: `https://${formData.website}`
      }))
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
  
    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "))
      setLoading(false)
      return
    }
  
    try {
      // console.log("🔐 Authenticating with dummy business claim account...")
      
      // Sign in with dummy account for business claim access
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/services/firebase')
      
      if (!auth) {
        throw new Error('Firebase not configured')
      }
  
      await signInWithEmailAndPassword(
        auth, 
        'public_business_claim@gladgrade.com',
        'thisisbusinessclaimpublicuserpassw0rd!'
      )
      
      // console.log("✅ Authenticated with dummy account")
  
      // Prepare form data for submission
      const submitData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value)
      })
      
      // Add metadata
      submitData.append('form_start_time', formStartTime.toString())
      
      // Add files
      uploadedFiles.forEach(uploadedFile => {
        submitData.append('documents', uploadedFile.file)
      })
  
      // console.log("🚀 Submitting business claim...")
  
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://gladgrade-api-360532994710.us-east4.run.app'}/api/portal/sales/businessclaim_submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
            // Note: Don't set Content-Type for FormData - let browser set it
          },
          body: submitData
        }
      )
  
      const result = await response.json()
  
      if (result.success) {
        // console.log("✅ Business claim submitted successfully:", result)
        
        // Sign out dummy account
        await auth.signOut()
        // console.log("🔐 Signed out dummy account")
        
        setSuccess(true)
        
        // Show success message and redirect after delay
        setTimeout(() => {
          router.push('/')
        }, 5000)
      } else {
        console.error("❌ Business claim submission failed:", result)
        setError(result.error || "Failed to submit business claim")
        
        // Sign out dummy account even on failure
        try {
          await auth.signOut()
        } catch (signOutError) {
          console.error("Error signing out:", signOutError)
        }
      }
    } catch (error) {
      console.error("❌ Error submitting business claim:", error)
      setError("Network error. Please try again.")
      
      // Sign out dummy account on error
      try {
        const { auth } = await import('@/services/firebase')
        if (auth?.currentUser) {
          await auth.signOut()
        }
      } catch (signOutError) {
        console.error("Error signing out:", signOutError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0 bg-white">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Business Claim Submitted!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Thank you for claiming your business with GladGrade. We've received your information and will verify it within 24-72 hours.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Our team will verify your business information</li>
                <li>• We may contact you for additional details</li>
                <li>• Once approved, you'll receive login credentials</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Questions? Contact us at <strong>sales.support@gladgrade.com</strong> or call <strong>(800) 258-1352</strong>
            </p>
            
            <Button 
              onClick={() => router.push('/')}
              className="bg-primary hover:bg-primary-dark"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
          <Logo size="md" />
        </div>

        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Claim Your Business
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Join GladGrade to improve customer satisfaction and grow your business
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Business Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Business Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-sm font-medium">
                      Business Name *
                    </Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Enter your business name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry_category_id" className="text-sm font-medium">
                      Industry Category
                    </Label>
                    <Select
                      value={formData.industry_category_id}
                      onValueChange={(value) => handleInputChange('industry_category_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address" className="text-sm font-medium">
                    Business Address *
                  </Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="Enter your complete business address"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Contact Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name" className="text-sm font-medium">
                      Contact Name
                    </Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-sm font-medium">
                      Email Address *
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Business Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin_phone" className="text-sm font-medium">
                      Admin Phone (if different)
                    </Label>
                    <Input
                      id="admin_phone"
                      type="tel"
                      value={formData.admin_phone}
                      onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </div>
              </div>

              {/* Verification Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Business Verification (Optional)
                </h3>
                <p className="text-sm text-gray-600">
                  Providing this information will help speed up the verification process.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fein" className="text-sm font-medium">
                      Federal EIN (FEIN)
                    </Label>
                    <Input
                      id="fein"
                      value={formData.fein}
                      onChange={(e) => handleInputChange('fein', e.target.value)}
                      placeholder="12-3456789"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dun_bradstreet_id" className="text-sm font-medium">
                      Dun & Bradstreet ID
                    </Label>
                    <Input
                      id="dun_bradstreet_id"
                      value={formData.dun_bradstreet_id}
                      onChange={(e) => handleInputChange('dun_bradstreet_id', e.target.value)}
                      placeholder="123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Supporting Documents (Optional)
                </h3>
                <p className="text-sm text-gray-600">
                  Upload documents to verify business ownership (business license, tax documents, utility bills, etc.)
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Click to upload files
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG, DOC, DOCX up to 10MB each
                      </span>
                    </div>
                  </Label>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((uploadedFile, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-gray-200 rounded">
                              <Upload className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedFile.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Submit */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll verify your business information within 24-72 hours</li>
                    <li>• You'll receive a confirmation email with next steps</li>
                    <li>• Our team may contact you for additional verification</li>
                    <li>• Once approved, you'll receive login credentials</li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-12 h-12 bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Business Claim"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}