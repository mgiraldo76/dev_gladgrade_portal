"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/services/firebase"

type UserRole = "super_admin" | "admin" | "moderator" | "employee" | "client" | null

interface AuthContextType {
  user: User | null
  role: UserRole
  loading: boolean
  isFirebaseConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isFirebaseConfigured: false,
})

export const useAuth = () => useContext(AuthContext)

// Function to determine user role based on email
function getUserRoleFromEmail(email: string): UserRole {
  console.log("🔍 Determining role for email:", email)

  if (!email) {
    console.log("❌ No email provided, defaulting to client")
    return "client"
  }

  const lowerEmail = email.toLowerCase()

  // Super Admin - Miguel Giraldo
  if (lowerEmail === "miguel.giraldo@gladgrade.com") {
    console.log("👑 Super Admin detected!")
    return "super_admin"
  }

  // GladGrade employees - anyone with @gladgrade.com domain
  if (lowerEmail.endsWith("@gladgrade.com")) {
    console.log("🏢 GladGrade employee detected")

    if (lowerEmail.includes("admin")) {
      console.log("🛡️ Admin role assigned")
      return "admin"
    }
    if (lowerEmail.includes("moderator") || lowerEmail.includes("mod")) {
      console.log("🔍 Moderator role assigned")
      return "moderator"
    }
    if (lowerEmail.includes("support") || lowerEmail.includes("employee")) {
      console.log("👤 Employee role assigned")
      return "employee"
    }

    // Default for @gladgrade.com emails is admin
    console.log("🛡️ Default admin role for GladGrade employee")
    return "admin"
  }

  // All other domains are clients
  console.log("🏪 Client role assigned")
  return "client"
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false)

  useEffect(() => {
    console.log("🚀 Providers useEffect running...")

    // Check if Firebase is properly configured - simplified check
    const hasValidConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    )

    console.log("🔧 Firebase configured:", hasValidConfig)
    console.log("🔧 Environment check:", {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })

    setIsFirebaseConfigured(hasValidConfig)

    if (auth && hasValidConfig) {
      console.log("🔐 Setting up Firebase auth listener...")

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("🔄 Auth state changed:", user ? `User: ${user.email}` : "No user")
        setUser(user)

        if (user && user.email) {
          try {
            console.log("🎯 Getting user role...")

            // First try to get role from Firebase custom claims
            const token = await user.getIdTokenResult()
            let userRole = token.claims.role as UserRole

            console.log("🏷️ Custom claim role:", userRole)

            // If no custom claim exists, determine role from email domain
            if (!userRole) {
              userRole = getUserRoleFromEmail(user.email)
              console.log(`🔐 Role assigned based on email domain: ${user.email} → ${userRole}`)
            }

            setRole(userRole)
            console.log("✅ Final role set:", userRole)
          } catch (error) {
            console.error("❌ Error getting user role:", error)
            // Fallback to email-based role assignment
            const fallbackRole = getUserRoleFromEmail(user.email)
            setRole(fallbackRole)
            console.log(`🔄 Fallback role assigned: ${user.email} → ${fallbackRole}`)
          }
        } else {
          console.log("👤 No user, setting role to null")
          setRole(null)
        }

        console.log("⏰ Setting loading to false")
        setLoading(false)
      })

      return () => {
        console.log("🧹 Cleaning up auth listener")
        unsubscribe()
      }
    } else {
      // If Firebase is not configured, set loading to false
      console.log("❌ Firebase not configured or auth not available")
      setLoading(false)
    }
  }, [])

  console.log("🎨 Rendering Providers with:", { user: user?.email, role, loading, isFirebaseConfigured })

  return <AuthContext.Provider value={{ user, role, loading, isFirebaseConfigured }}>{children}</AuthContext.Provider>
}
