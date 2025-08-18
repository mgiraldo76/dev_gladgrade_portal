// File: components/services/ServicesAdminView.tsx
// Path: /components/services/ServicesAdminView.tsx

"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { ServiceCard } from "@/components/services/ServiceCard"
import { ServiceForm } from "@/components/services/ServiceForm"
import { CategoryForm } from "@/components/services/CategoryForm"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Service, ServiceCategory, UserPermissions } from "@/types/services"

interface ServicesAdminViewProps {
  services: Service[]
  categories: ServiceCategory[]
  userPermissions: UserPermissions
  onRefresh: () => void
}

export function ServicesAdminView({ 
  services, 
  categories, 
  userPermissions, 
  onRefresh 
}: ServicesAdminViewProps) {
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const canEdit = userPermissions.can_edit

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => service.category_id.toString() === selectedCategory)

  const handleCreateService = () => {
    setEditingService(null)
    setShowServiceForm(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setShowServiceForm(true)
  }

  const handleDeleteService = async (service: Service) => {
    if (!window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.services.delete(service.id)
      
      if (response.success) {
        toast.success("Service deleted successfully")
        onRefresh()
      } else {
        toast.error(response.error || "Failed to delete service")
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Failed to delete service")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleServiceFormSuccess = () => {
    setShowServiceForm(false)
    setEditingService(null)
    onRefresh()
  }

  const handleCategoryFormSuccess = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    onRefresh()
  }

  const groupedServices = categories.map(category => ({
    ...category,
    services: services.filter(service => service.category_id === category.id)
  }))

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                You have read-only access to services. Only Super Admin and CCO can edit services.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Services Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Service Management</h2>
              <p className="text-gray-600">Manage all GladGrade services and pricing</p>
            </div>
            {canEdit && (
              <Button onClick={handleCreateService}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            )}
          </div>

          {/* Services Filter */}
          <div className="flex space-x-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Services ({services.length})
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name} ({services.filter(s => s.category_id === category.id).length})
              </Button>
            ))}
          </div>

          {/* Services Grid */}
          {selectedCategory === "all" ? (
            // Grouped by category
            <div className="space-y-8">
              {groupedServices.map(category => (
                <div key={category.id}>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    {category.name}
                    <Badge variant="secondary" className="ml-2">
                      {category.services.length}
                    </Badge>
                  </h3>
                  {category.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.services.map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          showCommission={canEdit}
                          onEdit={canEdit ? () => handleEditService(service) : undefined}
                          onDelete={canEdit ? () => handleDeleteService(service) : undefined}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No services in this category</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Filtered view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  showCommission={canEdit}
                  onEdit={canEdit ? () => handleEditService(service) : undefined}
                  onDelete={canEdit ? () => handleDeleteService(service) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Categories Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Category Management</h2>
              <p className="text-gray-600">Organize services into categories</p>
            </div>
            {canEdit && (
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description || "No description"}
                      </p>
                    </div>
                    {canEdit && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {category.service_count || 0} services
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Form Modal */}
      {showServiceForm && (
        <ServiceForm
          service={editingService}
          categories={categories}
          onSuccess={handleServiceFormSuccess}
          onCancel={() => setShowServiceForm(false)}
        />
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onSuccess={handleCategoryFormSuccess}
          onCancel={() => setShowCategoryForm(false)}
        />
      )}
    </div>
  )
}