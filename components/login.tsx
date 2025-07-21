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
import { AlertCircle } from "lucide-react"

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

  

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 flex flex-col items-center pb-8">
          <Logo size="xl" className="drop-shadow-lg" />
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-dark">Welcome to GladGrade Portal</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access your business dashboard and manage customer satisfaction
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-dark font-semibold shadow-md hover:shadow-lg transition-all"
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
    </div>
  )
}
