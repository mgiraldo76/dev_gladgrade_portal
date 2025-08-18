// File: app/dashboard/services/page.tsx
// Path: /app/dashboard/services/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers"
import { apiClient } from "@/lib/api-client"
import { ServicesAdminView } from "@/components/services/ServiceAdminView"
import { ServicesClientView } from "@/components/services/ServicesClientView"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { Service, ServiceCategory, UserPermissions, ClientService } from "@/types/services"

interface ServicesData {
  services: Service[]
  categories: ServiceCategory[]
  userPermissions: UserPermissions
  currentServices?: ClientService[]
  availableServices?: Service[]
}

export default function ServicesPage() {
  const { user, role, businessId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [servicesData, setServicesData] = useState<ServicesData | null>(null)

  const loadServicesData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await user?.getIdToken()
      if (!token) {
        throw new Error("Authentication required")
      }

      // Load services and categories
      const [servicesResponse, categoriesResponse] = await Promise.all([
        apiClient.services.getAll(),
        apiClient.services.getCategories()
      ])

      if (!servicesResponse.success || !categoriesResponse.success) {
        throw new Error("Failed to load services data")
      }

      let currentServices: ClientService[] = []
      let availableServices: Service[] = []

      // For clients, also load their current and available services
      if (role === "client" && businessId) {
        const clientServicesResponse = await apiClient.services.getClientServicesDetailed(businessId)
        if (clientServicesResponse.success) {
          currentServices = clientServicesResponse.data.current_services
          availableServices = clientServicesResponse.data.available_services
        }
      }

      setServicesData({
        services: servicesResponse.data,
        categories: categoriesResponse.data,
        userPermissions: servicesResponse.user_permissions,
        currentServices,
        availableServices: role === "client" ? availableServices : servicesResponse.data
      })
    } catch (err) {
      console.error("Error loading services:", err)
      setError(err instanceof Error ? err.message : "Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadServicesData()
    }
  }, [user, role, businessId])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!servicesData) {
    return null
  }

  const isClient = role === "client"

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isClient ? "Services Management" : "Services Administration"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isClient 
            ? "Manage your GladGrade services and explore new offerings"
            : "Manage all GladGrade services and service categories"
          }
        </p>
      </div>

      {isClient ? (
        <ServicesClientView
          currentServices={servicesData.currentServices || []}
          availableServices={servicesData.availableServices || []}
          categories={servicesData.categories}
          userPermissions={servicesData.userPermissions}
          businessId={businessId!}
          onRefresh={loadServicesData}
        />
      ) : (
        <ServicesAdminView
          services={servicesData.services}
          categories={servicesData.categories}
          userPermissions={servicesData.userPermissions}
          onRefresh={loadServicesData}
        />
      )}
    </div>
  )
}