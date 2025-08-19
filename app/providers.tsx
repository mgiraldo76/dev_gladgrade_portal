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
  permissions: string[]
  loading: boolean
  isFirebaseConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  clientRole: null,
  businessId: null,
  permissions: [],
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
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false)

  // In the useEffect where you handle auth state changes, update the permissions logic:
  useEffect(() => {
    console.log("🚀 AuthProvider useEffect running...")

    // Check if Firebase is properly configured
    const hasValidConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    )

    console.log("🔧 Firebase config status:", hasValidConfig)
    setIsFirebaseConfigured(hasValidConfig)

    if (!hasValidConfig) {
      console.log("⚠️ Firebase not configured, setting loading to false")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔄 Auth state changed:", firebaseUser ? `User: ${firebaseUser.email}` : "No user")

      if (firebaseUser) {
        setUser(firebaseUser)
        console.log("🎯 Getting user role...")

        try {
          // Get the ID token to access custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult()
          const claims = idTokenResult.claims

          console.log("🏷️ Custom claim role:", claims.role)
          console.log("🔐 Custom claim permissions:", claims.permissions)

          // Set role based on custom claims
          if (claims.role) {
            setRole(claims.role as UserRole)
            console.log("✅ Final role set:", claims.role)
          } else {
            // Fallback to email-based role determination
            const emailRole = getUserRoleFromEmail(firebaseUser.email || "")
            setRole(emailRole)
            console.log("✅ Final role set (from email):", emailRole)
          }

          // Set permissions from custom claims
          if (claims.permissions && Array.isArray(claims.permissions)) {
            setPermissions(claims.permissions)
            console.log("✅ Permissions set:", claims.permissions)
          } else {
            setPermissions([])
            console.log("ℹ️ No permissions found in custom claims")
          }

          // Handle client-specific data
          if (claims.role === "client") {
            if (claims.businessId && typeof claims.businessId === 'string') {
              setBusinessId(parseInt(claims.businessId))
              console.log("🏢 Client businessId extracted:", claims.businessId)
            } else if (claims.businessId && typeof claims.businessId === 'number') {
              setBusinessId(claims.businessId)
              console.log("🏢 Client businessId extracted (number):", claims.businessId)
            } else {
              console.log("⚠️ No valid businessId found in claims")
              setBusinessId(null)
            }
            
            if (claims.user_role && typeof claims.user_role === 'string') {
              setClientRole(claims.user_role as ClientRole)
              console.log("👤 Client role extracted:", claims.user_role)
            } else {
              console.log("⚠️ No valid user_role found in claims")
              setClientRole(null)
            }
          } else {
            setClientRole(null)
            setBusinessId(null)
            console.log("🏢 Non-client user, cleared client data")
          }

        } catch (error) {
          console.error("❌ Error getting custom claims:", error)
          const emailRole = getUserRoleFromEmail(firebaseUser.email || "")
          setRole(emailRole)
          setPermissions([])
        }
      } else {
        console.log("👤 No user, setting role and businessId to null")
        setUser(null)
        setRole(null)
        setClientRole(null)
        setBusinessId(null)
        setPermissions([])
      }

      console.log("⏰ Setting loading to false")
      setLoading(false)
    })

    return () => {
      console.log("🧹 Cleaning up auth listener")
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        clientRole,
        businessId,
        permissions,
        loading,
        isFirebaseConfigured,
      }}
    >
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