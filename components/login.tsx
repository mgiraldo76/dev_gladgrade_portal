// File: components/login.tsx
// Path: components/login.tsx

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/services/firebase"
import { useAuth } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { AlertCircle, Building2, Star, TrendingUp, Shield } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { isFirebaseConfigured } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured. Please check your environment variables.")
      return
    }

    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleClaimBusiness = () => {
    router.push("/claim-business")
  }

  const handleLearnMore = () => {
    router.push("/business-benefits")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffbc59] via-[#e6a84d] to-[#f0d491] p-4">


      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-stretch">
        
        {/* Login Card */}
        <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm flex flex-col">
          <CardHeader className="space-y-4 flex flex-col items-center pb-8">
            <Logo size="xl" className="drop-shadow-lg" />
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-dark">Welcome to GladGrade Portal</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your business dashboard and manage customer satisfaction
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {!isFirebaseConfigured && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Demo Mode Active</p>
                  <p className="text-xs mt-1">Firebase not configured. Update your .env file to enable authentication.</p>
                </div>
              </div>
            )}
  
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
  
            {isFirebaseConfigured ? (
              <>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-dark font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-dark font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#ffbc59] hover:bg-[#e6a84d] text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                
              </>
            ) : ''}
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} GladGrade Holding Corporation</p>
          </CardFooter>
        </Card>
  
        {/* Business Claim Section - UPDATED DESIGN */}
        <Card className="w-full shadow-xl border-0 bg-gradient-to-br from-[#ffbc59]/10 to-[#ffbc59]/20 backdrop-blur-sm flex flex-col">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#ffbc59]/20 rounded-full">
                <Building2 className="h-8 w-8 text-[#ffbc59]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Claim Your Business Here
            </CardTitle>
            <CardDescription className="text-gray-700 text-base">
              Join thousands of businesses using GladGrade to improve customer satisfaction and grow revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            
            {/* Key Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Build Your GCSG Score</h4>
                  <p className="text-sm text-gray-600">Establish credibility with our Global Customer Satisfaction Grade</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Data-Driven Growth</h4>
                  <p className="text-sm text-gray-600">Turn customer insights into actionable improvements</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Reputation Management</h4>
                  <p className="text-sm text-gray-600">Monitor and respond to feedback across all platforms</p>
                </div>
              </div>
            </div>
  
            {/* Stats */}
            <div className="bg-white/80 rounded-lg p-4 space-y-3">
              <h5 className="font-semibold text-gray-900 text-center">Proven Results</h5>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#ffbc59]">89%</div>
                  <div className="text-xs text-gray-600">Improved retention</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#ffbc59]">340%</div>
                  <div className="text-xs text-gray-600">Average ROI</div>
                </div>
              </div>
            </div>
  
            {/* Action Buttons - UPDATED WITH CORRECT GLADGRADE COLOR */}
            <div className="space-y-3">
              <Button 
                onClick={handleClaimBusiness}
                className="w-full h-12 bg-[#ffbc59] hover:bg-[#e6a84d] text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Claim Your Business Now
              </Button>
              
              <Button 
                onClick={handleLearnMore}
                variant="outline"
                className="w-full h-10 border-[#ffbc59] text-[#ffbc59] hover:bg-[#ffbc59] hover:text-gray-900 transition-all bg-white/50 backdrop-blur-sm"
              >
                Learn More About GladGrade
              </Button>
            </div>
  
            {/* Trust Indicators */}
            <div className="text-center pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600 mb-2">Trusted by businesses nationwide</p>
              <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
                <span>✓ Free Setup</span>
                <span>✓ 24-72hr Verification</span>
                <span>✓ Expert Support</span>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}