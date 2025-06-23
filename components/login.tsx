"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured. Please check your environment variables.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    // For demo purposes, simulate a successful login
    router.push("/dashboard")
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-200 hover:bg-gray-50"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="w-full h-11 bg-primary hover:bg-primary-dark text-dark font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={handleDemoLogin}
            >
              Continue in Demo Mode
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} GladGrade Holding Corporation</p>
        </CardFooter>
      </Card>
    </div>
  )
}
