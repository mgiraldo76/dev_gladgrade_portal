// File: components/services/ServicesClientView.tsx
// Path: /components/services/ServicesClientView.tsx

"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { ServiceCard } from "./ServiceCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle, Package, ShoppingCart, AlertCircle, Star } from "lucide-react"
import { toast } from "sonner"
import type { Service, ServiceCategory, UserPermissions, ClientService } from "@/types/services"

interface ServicesClientViewProps {
  currentServices: ClientService[]
  availableServices: Service[]
  categories: ServiceCategory[]
  userPermissions: UserPermissions
  businessId: number
  onRefresh: () => void
}

export function ServicesClientView({
  currentServices,
  availableServices,
  categories,
  userPermissions,
  businessId,
  onRefresh
}: ServicesClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [purchaseService, setPurchaseService] = useState<Service | null>(null)
  const [purchaseNotes, setPurchaseNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const canPurchase = userPermissions.can_purchase

  const filteredAvailableServices = selectedCategory === "all"
    ? availableServices
    : availableServices.filter(service => service.category_id.toString() === selectedCategory)

  const handlePurchaseService = async () => {
    if (!purchaseService) return

    try {
      setLoading(true)
      const response = await apiClient.services.purchase(businessId, {
        service_id: purchaseService.id,
        notes: purchaseNotes.trim() || undefined
      })

      if (response.success) {
        toast.success(`Successfully ${purchaseService.currently_subscribed ? 'updated' : 'purchased'} ${purchaseService.name}`)
        setPurchaseService(null)
        setPurchaseNotes("")
        onRefresh()
      } else {
        toast.error(response.error || "Failed to process service purchase")
      }
    } catch (error) {
      console.error("Error purchasing service:", error)
      toast.error("Failed to process service purchase")
    } finally {
      setLoading(false)
    }
  }

  const groupedCurrentServices = categories.map(category => ({
    ...category,
    services: currentServices.filter(service => 
      availableServices.find(s => s.name === service.name)?.category_id === category.id
    )
  })).filter(category => category.services.length > 0)

  const groupedAvailableServices = categories.map(category => ({
    ...category,
    services: availableServices.filter(service => service.category_id === category.id)
  }))

  const calculateMonthlyTotal = () => {
    return currentServices.reduce((total, service) => {
      if (service.is_recurring && service.billing_cycle === 'monthly') {
        const monthlyFee = Number(service.monthly_fee) || 0
        return total + monthlyFee
      }
      return total
    }, 0)
  }

  return (
    <div className="space-y-6">
      {!canPurchase && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Only client administrators can purchase new services. Contact your account administrator to upgrade your services.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">
            <Package className="h-4 w-4 mr-2" />
            My Services ({currentServices.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Available Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Services Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Your Active Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentServices.length}</div>
                  <div className="text-sm text-gray-600">Active Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${calculateMonthlyTotal().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentServices.filter(s => s.service_type === 'premium' || s.service_type === 'enterprise').length}
                  </div>
                  <div className="text-sm text-gray-600">Premium Services</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Services by Category */}
          {currentServices.length > 0 ? (
            <div className="space-y-8">
              {groupedCurrentServices.map(category => (
                <div key={category.id}>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    {category.name}
                    <Badge variant="secondary" className="ml-2">
                      {category.services.length}
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.services.map(service => (
                      <ServiceCard
                        key={service.assignment_id || service.id}
                        service={service}
                        showCommission={false}
                        isClientView={true}
                        isCurrentService={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Services</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any active services yet. Explore our available services to get started.
                </p>
                <Button onClick={() => {
                  // This would need to be implemented to switch tabs
                  // For now, just show a message
                  toast.info("Switch to the Available Services tab to browse services")
                }}>
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          {/* Available Services Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Available Services</h2>
              <p className="text-gray-600">Explore and purchase new GladGrade services</p>
            </div>
          </div>

          {/* Services Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Services ({availableServices.length})
            </Button>
            {categories.map(category => {
              const categoryServices = availableServices.filter(s => s.category_id === category.id)
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id.toString())}
                >
                  {category.name} ({categoryServices.length})
                </Button>
              )
            })}
          </div>

          {/* Available Services Grid */}
          {selectedCategory === "all" ? (
            // Grouped by category
            <div className="space-y-8">
              {groupedAvailableServices.map(category => (
                <div key={category.id}>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    {category.name}
                    <Badge variant="outline" className="ml-2">
                      {category.services.length}
                    </Badge>
                    {category.description && (
                      <span className="text-sm text-gray-600 ml-4">
                        {category.description}
                      </span>
                    )}
                  </h3>
                  {category.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.services.map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          showCommission={false}
                          isClientView={true}
                          isCurrentService={false}
                          onPurchase={canPurchase ? () => setPurchaseService(service) : undefined}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No services available in this category</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Filtered view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailableServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  showCommission={false}
                  isClientView={true}
                  isCurrentService={false}
                  onPurchase={canPurchase ? () => setPurchaseService(service) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Service Dialog */}
      {purchaseService && (
        <Dialog open={true} onOpenChange={() => setPurchaseService(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {purchaseService.currently_subscribed ? (
                  <>
                    <Star className="h-5 w-5 mr-2 text-blue-600" />
                    Update Service
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                    Purchase Service
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">{purchaseService.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {purchaseService.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <div>
                    <span className="text-lg font-bold">${purchaseService.base_price}</span>
                    {purchaseService.setup_fee > 0 && (
                      <span className="text-sm text-gray-600 ml-2">
                        + ${purchaseService.setup_fee} setup
                      </span>
                    )}
                  </div>
                  <Badge variant={purchaseService.currently_subscribed ? "default" : "secondary"}>
                    {purchaseService.currently_subscribed ? "Current" : purchaseService.billing_cycle}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Notes (optional)
                </label>
                <Textarea
                  placeholder="Add any special requirements or notes..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPurchaseService(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchaseService}
                disabled={loading}
              >
                {loading 
                  ? "Processing..." 
                  : purchaseService.currently_subscribed 
                    ? "Update Service" 
                    : `Purchase for ${purchaseService.base_price}`
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
                    