// File: components/services/ServiceCard.tsx
// Path: /components/services/ServiceCard.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ShoppingCart, CheckCircle, DollarSign, Repeat, Clock } from "lucide-react"
import type { Service, ClientService } from "@/types/services"

interface ServiceCardProps {
  service: Service | ClientService
  showCommission?: boolean
  isClientView?: boolean
  isCurrentService?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onPurchase?: () => void
}

export function ServiceCard({
  service,
  showCommission = false,
  isClientView = false,
  isCurrentService = false,
  onEdit,
  onDelete,
  onPurchase
}: ServiceCardProps) {
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'premium': return 'bg-blue-100 text-blue-800'
      case 'addon': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBillingCycleIcon = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return <Repeat className="h-3 w-3" />
      case 'quarterly': return <Repeat className="h-3 w-3" />
      case 'yearly': return <Repeat className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const formatBillingCycle = (cycle: string) => {
    switch (cycle) {
      case 'one_time': return 'One-time'
      case 'monthly': return 'Monthly'
      case 'quarterly': return 'Quarterly'
      case 'yearly': return 'Yearly'
      default: return cycle
    }
  }

  const isCurrentlySubscribed = 'currently_subscribed' in service && service.currently_subscribed

  return (
    <Card className={`relative ${isCurrentService ? 'border-green-200 bg-green-50/50' : ''} ${isCurrentlySubscribed ? 'border-blue-200 bg-blue-50/50' : ''}`}>
      {isCurrentService && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-green-600 text-white rounded-full p-1">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      )}
      
      {isCurrentlySubscribed && !isCurrentService && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-blue-600">Subscribed</Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
            {service.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>
          {!isClientView && (onEdit || onDelete) && (
            <div className="flex space-x-1 ml-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Type & Category */}
        <div className="flex justify-between items-center">
          <Badge className={getServiceTypeColor(service.service_type || 'standard')}>
            {(service.service_type || 'standard').charAt(0).toUpperCase() + (service.service_type || 'standard').slice(1)}
          </Badge>
          {(service as Service).category_name && (
            <span className="text-xs text-gray-500">
              {(service as Service).category_name}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Price
            </span>
            <span className="font-bold text-lg">${service.base_price}</span>
          </div>
          
          {service.setup_fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Setup Fee</span>
              <span>${service.setup_fee}</span>
            </div>
          )}
          
          {service.is_recurring && service.monthly_fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center">
                {getBillingCycleIcon(service.billing_cycle)}
                <span className="ml-1">{formatBillingCycle(service.billing_cycle)}</span>
              </span>
              <span>${service.monthly_fee}</span>
            </div>
          )}
        </div>

        {/* Commission (Admin View Only) */}
        {showCommission && 'commission_rate' in service && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Commission</span>
              <span className="font-medium">
                {service.commission_type === 'percentage' 
                  ? `${service.commission_rate}%`
                  : `$${service.commission_amount}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Current Service Details */}
        {isCurrentService && 'start_date' in service && (
          <div className="border-t pt-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <Badge variant="default" className="text-xs">
                {(service as ClientService).assignment_status}
              </Badge>
            </div>
            {(service as ClientService).start_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Started</span>
                <span>{new Date((service as ClientService).start_date!).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Featured Badge */}
        {'is_featured' in service && service.is_featured && (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            ⭐ Featured
          </Badge>
        )}

        {/* Actions */}
        {isClientView && !isCurrentService && onPurchase && (
          <Button 
            onClick={onPurchase} 
            className="w-full"
            variant={isCurrentlySubscribed ? "outline" : "default"}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isCurrentlySubscribed ? "Update Service" : "Purchase"}
          </Button>
        )}

        {!isClientView && !onEdit && !onDelete && (
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              {'is_active' in service 
                ? (service.is_active ? "Active" : "Inactive")
                : "Available"
              }
            </span>
            {'requires_approval' in service && service.requires_approval && (
              <span>Requires Approval</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}