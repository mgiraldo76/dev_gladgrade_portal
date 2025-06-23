"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Building, Shield, Clock, ArrowRight, Star } from "lucide-react"

export default function ClaimBusinessPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [claimResult, setClaimResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    business_address: "",
    website: "",
    industry_category_id: "",
    claim_method: "email_domain",
  })

  const industryCategories = [
    { id: 1, name: "Restaurant & Food", icon: "🍽️" },
    { id: 2, name: "Retail", icon: "🛍️" },
    { id: 3, name: "Healthcare", icon: "🏥" },
    { id: 4, name: "Education", icon: "🎓" },
    { id: 5, name: "Entertainment", icon: "🎭" },
    { id: 6, name: "Professional Services", icon: "💼" },
    { id: 7, name: "Beauty & Wellness", icon: "💅" },
    { id: 8, name: "Automotive", icon: "🚗" },
    { id: 9, name: "Hospitality", icon: "🏨" },
    { id: 10, name: "Technology", icon: "💻" },
    { id: 11, name: "Home Services", icon: "🏠" },
    { id: 12, name: "Financial Services", icon: "💰" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/clients/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setClaimResult(result)
        setStep(3) // Success step
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error submitting claim:", error)
      alert("Failed to submit claim request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && claimResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                {claimResult.auto_approved ? "Business Claim Approved!" : "Claim Request Submitted!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-green-700">{claimResult.message}</p>

              {claimResult.auto_approved && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">🎉 Instant Approval!</h3>
                  <p className="text-sm text-green-600">
                    Your business ownership was automatically verified. You can now create your account and start using
                    GladGrade.
                  </p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Next Steps:</h3>
                <ul className="space-y-2 text-left">
                  {claimResult.next_steps?.map((step: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  className="bg-primary hover:bg-primary-dark text-dark"
                  onClick={() => (window.location.href = "/")}
                >
                  Create Account
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark mb-4">Claim Your Business</h1>
          <p className="text-xl text-gray-600 mb-6">Take control of your business reputation on GladGrade</p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Star className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Monitor Reviews</h3>
              <p className="text-sm text-gray-600">Track and respond to customer feedback in real-time</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Boost GCSG Score</h3>
              <p className="text-sm text-gray-600">Improve your Global Customer Satisfaction Grade</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Building className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Advertise & Promote</h3>
              <p className="text-sm text-gray-600">Purchase ad placements to reach more customers</p>
            </div>
          </div>
        </div>

        {/* Claim Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Usually approved within 24 hours
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    placeholder="Amazing Restaurant"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Your Name *</Label>
                  <Input
                    id="contact_name"
                    placeholder="John Smith"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Business Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="owner@amazingrestaurant.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">Use your business domain email for faster verification</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (305) 555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://amazingrestaurant.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  placeholder="123 Main Street, Miami, FL 33101"
                  value={formData.business_address}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry Category</Label>
                <Select
                  value={formData.industry_category_id}
                  onValueChange={(value) => setFormData({ ...formData, industry_category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verification Method */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Verification Method</h3>
                <p className="text-sm text-blue-700 mb-3">
                  We'll verify your business ownership using your email domain and provided information.
                </p>
                <div className="text-xs text-blue-600">
                  ✅ Email domain matching
                  <br />✅ Business information verification
                  <br />✅ Automatic approval for qualified businesses
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-dark"
                disabled={loading || !formData.business_name || !formData.contact_name || !formData.contact_email}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-dark"></div>
                    Processing Claim...
                  </div>
                ) : (
                  "Submit Claim Request"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By submitting this form, you confirm that you are authorized to represent this business and agree to
                GladGrade's Terms of Service and Privacy Policy.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
