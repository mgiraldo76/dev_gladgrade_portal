// File: app/business-benefits/page.tsx
// Path: app/business-benefits/page.tsx

"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  Users, 
  Target, 
  CheckCircle,
  Award,
  Zap,
  Building2,
  ArrowRight,
  Quote
} from "lucide-react"

export default function BusinessBenefitsPage() {
  const router = useRouter()

  const stats = [
    { label: "Improved Customer Retention", value: "89%", description: "of businesses see improvement within 90 days" },
    { label: "Average GCSG Score Improvement", value: "35pts", description: "in the first year" },
    { label: "Increase in Positive Reviews", value: "67%", description: "across all review platforms" },
    { label: "Average ROI", value: "340%", description: "within 12 months" }
  ]

  const features = [
    {
      icon: Award,
      title: "Build Your GCSG Score",
      description: "Establish credibility with our Global Customer Satisfaction Grade - a standardized metric that customers trust when choosing businesses.",
      benefits: ["Industry-standard scoring", "Customer trust indicator", "Competitive advantage"]
    },
    {
      icon: MessageSquare,
      title: "Real-Time Feedback Management",
      description: "Collect, monitor, and respond to customer feedback across all channels in real-time.",
      benefits: ["Multi-channel collection", "Instant notifications", "Professional response tools"]
    },
    {
      icon: Shield,
      title: "Reputation Excellence",
      description: "Monitor online reviews across platforms with professional response management and crisis prevention.",
      benefits: ["Review monitoring", "Crisis prevention", "Brand protection"]
    },
    {
      icon: BarChart3,
      title: "Data-Driven Growth",
      description: "Turn customer insights into actionable improvements with detailed analytics and performance tracking.",
      benefits: ["Customer journey insights", "Performance benchmarking", "ROI tracking"]
    }
  ]

  const testimonials = [
    {
      quote: "Since implementing GladGrade, our customer satisfaction scores improved by 40% and we've seen a direct correlation to increased revenue.",
      company: "Local Restaurant Chain",
      location: "Miami, FL",
      improvement: "40% satisfaction increase"
    },
    {
      quote: "GladGrade helped us identify key pain points in our customer experience. The insights were invaluable for our growth strategy.",
      company: "Tech Service Provider",
      location: "Orlando, FL",
      improvement: "3x faster issue resolution"
    },
    {
      quote: "The GCSG score has become our north star metric. It's helped us focus on what really matters - customer satisfaction.",
      company: "Retail Chain",
      location: "Tampa, FL",
      improvement: "67% review improvement"
    }
  ]

  const processSteps = [
    {
      step: "1",
      title: "Assess",
      description: "Understand your current customer satisfaction baseline with comprehensive analysis",
      icon: Target
    },
    {
      step: "2", 
      title: "Improve",
      description: "Implement targeted improvements based on real customer data and insights",
      icon: TrendingUp
    },
    {
      step: "3",
      title: "Grow", 
      description: "Watch customer loyalty and revenue increase with measurable results",
      icon: Zap
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffbc59]/5 via-white to-[#ffbc59]/10">
      
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
            <Logo size="md" />
            <Button
              onClick={() => router.push('/claim-business')}
              className="bg-[#ffbc59] hover:bg-[#e6a84d] text-gray-900"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#ffbc59]/10 rounded-full">
              <Building2 className="h-12 w-12 text-[#ffbc59]" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Customer Feedback into 
            <span className="text-[#ffbc59]"> Business Growth</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Turn every customer interaction into measurable success with our comprehensive reputation management platform. 
            Build trust, improve satisfaction, and grow your business with data-driven insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/claim-business')}
              className="bg-[#ffbc59] hover:bg-[#e6a84d] text-gray-900 px-8 py-4 text-lg"
            >
              Claim Your Business Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-200 rounded-full">
                  <Zap className="h-8 w-8 text-blue-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Powerful</h3>
              <p className="text-blue-800">Real-time customer satisfaction tracking with our proprietary GCSG score</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-200 rounded-full">
                  <BarChart3 className="h-8 w-8 text-green-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Comprehensive</h3>
              <p className="text-green-800">Multi-channel feedback collection and reputation management</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-200 rounded-full">
                  <TrendingUp className="h-8 w-8 text-purple-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">Growth-Focused</h3>
              <p className="text-purple-800">Turn insights into actionable improvements that drive revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Proven Results Across Industries
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-[#ffbc59] mb-2">{stat.value}</div>
                <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Take Control of Your Customer Experience
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#ffbc59]/10 rounded-lg">
                      <feature.icon className="h-8 w-8 text-[#ffbc59]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-[#ffbc59]" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="bg-gradient-to-r from-[#ffbc59]/5 to-[#ffbc59]/10 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Start Building Customer Loyalty Today
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of businesses using GladGrade to create exceptional customer experiences in three simple steps.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-[#ffbc59] rounded-full flex items-center justify-center text-gray-900 font-bold text-xl mb-2">
                      {step.step}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <step.icon className="h-6 w-6 text-[#ffbc59]" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Clients Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <Quote className="h-8 w-8 text-[#ffbc59]" />
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{testimonial.company}</div>
                    <div className="text-sm text-gray-600">{testimonial.location}</div>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {testimonial.improvement}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* GCSG Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-[#ffbc59] to-[#e6a84d] text-white mb-16">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full">
                <Award className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              The Global Customer Satisfaction Grade (GCSG)
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              A standardized, industry-agnostic metric that provides customers with a reliable way to compare 
              businesses based on actual customer satisfaction data. Build trust and credibility with a score 
              that customers recognize and value.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">300-850</div>
                <div className="text-sm opacity-80">Score Range</div>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">Real-Time</div>
                <div className="text-sm opacity-80">Updates</div>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold mb-2">Industry</div>
                <div className="text-sm opacity-80">Standard</div>
              </div>
            </div>
            <Button 
              size="lg"
              className="mt-8 bg-white text-[#ffbc59] hover:bg-gray-100"
              onClick={() => window.open('https://gladgrade.com/global-customer-satisfaction-grade-gcsg/', '_blank')}
            >
              Learn More About GCSG
            </Button>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using GladGrade to improve customer satisfaction and drive growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg"
                onClick={() => router.push('/claim-business')}
                className="bg-[#ffbc59] hover:bg-[#e6a84d] text-gray-900 px-8 py-4 text-lg"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#ffbc59]" />
                <span>Free Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#ffbc59]" />
                <span>24-72hr Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#ffbc59]" />
                <span>Expert Support</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Logo size="lg" className="mb-4" />
          <p className="text-gray-400 mb-6">
            Transforming customer feedback into business growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-400">
            <span>© {new Date().getFullYear()} GladGrade Holding Corporation</span>
            <span>•</span>
            <a href="mailto:sales.support@gladgrade.com" className="hover:text-white transition-colors">
              sales.support@gladgrade.com
            </a>
            
          </div>
        </div>
      </div>
    </div>
  )
}