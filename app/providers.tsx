// File: app/providers.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/services/firebase"
import { ThemeProvider } from "@/components/theme-provider"

type UserRole = "super_admin" | "admin" | "moderator" | "employee" | "client" | null
type ClientRole = "client_admin" | "client_moderator" | "client_user" | "client_viewer" | null

interface AuthContextType {
  user: User | null
  role: UserRole
  clientRole: ClientRole
  businessId: number | null
  loading: boolean
  isFirebaseConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  clientRole: null,
  businessId: null,
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

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [clientRole, setClientRole] = useState<ClientRole>(null)
  const [businessId, setBusinessId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false)

  useEffect(() => {
    console.log("🚀 AuthProvider useEffect running...")

    // Check if Firebase is properly configured
    const hasValidConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    )

    console.log("🔧 Firebase configured:", hasValidConfig)
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
            let userBusinessId: number | null = null
            let userClientRole: ClientRole = null

            console.log("🏷️ Custom claim role:", userRole)

            // Extract businessId for client users
            if (userRole === "client" && token.claims.businessId) {
              userBusinessId = parseInt(token.claims.businessId as string)
              console.log("🏢 Client businessId extracted:", userBusinessId)
              
              // Extract client role
              if (token.claims.user_role) {
                userClientRole = token.claims.user_role as ClientRole
                console.log("👤 Client role extracted:", userClientRole)
              }
            }

            // If no custom claim exists, determine role from email domain
            if (!userRole) {
              userRole = getUserRoleFromEmail(user.email)
              console.log(`🔐 Role assigned based on email domain: ${user.email} → ${userRole}`)
            }

            setRole(userRole)
            setClientRole(userClientRole)
            setBusinessId(userBusinessId)
            console.log("✅ Final role set:", userRole)
            console.log("✅ Final clientRole set:", userClientRole)
            console.log("✅ Final businessId set:", userBusinessId)
          } catch (error) {
            console.error("❌ Error getting user role:", error)
            // Fallback to email-based role assignment
            const fallbackRole = getUserRoleFromEmail(user.email)
            setRole(fallbackRole)
            setClientRole(null)
            setBusinessId(null)
            console.log(`🔄 Fallback role assigned: ${user.email} → ${fallbackRole}`)
          }
        } else {
          console.log("👤 No user, setting role and businessId to null")
          setRole(null)
          setClientRole(null)
          setBusinessId(null)
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

  return (
    <AuthContext.Provider value={{ user, role, clientRole, businessId, loading, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

// Main Providers component
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}