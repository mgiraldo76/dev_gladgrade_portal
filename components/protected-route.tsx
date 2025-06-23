"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export default function ProtectedRoute({
  children,
  requiredRoles = ["super_admin", "admin", "client", "employee", "moderator"],
}: ProtectedRouteProps) {
  const { user, role, loading, isFirebaseConfigured } = useAuth()
  const router = useRouter()

  console.log("🛡️ ProtectedRoute check:", {
    user: user?.email,
    role,
    loading,
    isFirebaseConfigured,
    requiredRoles,
  })

  useEffect(() => {
    if (!loading) {
      console.log("🔍 ProtectedRoute evaluation...")

      if (isFirebaseConfigured) {
        // If Firebase is configured, check authentication
        if (!user) {
          console.log("❌ No user, redirecting to login")
          router.push("/")
          return
        }

        if (role && !requiredRoles.includes(role)) {
          console.log("❌ Role not authorized, redirecting to dashboard")
          router.push("/dashboard")
          return
        }

        console.log("✅ User authorized")
      } else {
        // Demo mode - allow access
        console.log("🎭 Demo mode - allowing access")
      }
    }
  }, [user, role, loading, router, requiredRoles, isFirebaseConfigured])

  // Show loading state while checking authentication
  if (loading) {
    console.log("⏳ Showing loading state")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GladGrade Portal...</p>
        </div>
      </div>
    )
  }

  // If Firebase is not configured (demo mode) or user is authenticated, render children
  if (!isFirebaseConfigured || (user && role && requiredRoles.includes(role))) {
    console.log("✅ Rendering protected content")
    return <>{children}</>
  }

  // Show loading while redirecting
  console.log("🔄 Redirecting...")
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
