// File: components/services/ServiceForm.tsx
// Path: /components/services/ServiceForm.tsx

"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { Service, ServiceCategory, CreateServiceRequest } from "@/types/services"

interface ServiceFormProps {
  service?: Service | null
  categories: ServiceCategory[]
  onSuccess: () => void
  onCancel: () => void
}

export function ServiceForm({ service, categories, onSuccess, onCancel }: ServiceFormProps) {
  const isEditing = !!service
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: service?.name || "",
    description: service?.description || "",
    category_id: service?.category_id || categories[0]?.id || 1,
    base_price: service?.base_price || 0,
    setup_fee: service?.setup_fee || 0,
    monthly_fee: service?.monthly_fee || 0,
    commission_rate: service?.commission_rate || 0,
    commission_type: service?.commission_type || "percentage",
    commission_amount: service?.commission_amount || 0,
    is_recurring: service?.is_recurring || false,
    billing_cycle: service?.billing_cycle || "one_time",
    available_portal: service?.available_portal !== false,
    available_mobile: service?.available_mobile !== false,
    available_gladgrade_only: service?.available_gladgrade_only || false,
    service_type: service?.service_type || "standard",
    requires_approval: service?.requires_approval || false,
    max_quantity: service?.max_quantity || 1,
    is_active: service?.is_active !== false,
    is_featured: service?.is_featured || false,
    display_order: service?.display_order || 0
  })

  const handleInputChange = (field: keyof CreateServiceRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Service name is required")
      return
    }

    try {
      setLoading(true)
      
      let response
      if (isEditing) {
        response = await apiClient.services.update(service!.id, formData)
      } else {
        response = await apiClient.services.create(formData)
      }

      if (response.success) {
        toast.success(`Service ${isEditing ? 'updated' : 'created'} successfully`)
        onSuccess()
      } else {
        toast.error(response.error || `Failed to ${isEditing ? 'update' : 'create'} service`)
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} service:`, error)
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} service`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Service: ${service?.name}` : "Create New Service"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter service name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category_id.toString()} 
                    onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the service"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_type">Service Type</Label>
                  <Select 
                    value={formData.service_type} 
                    onValueChange={(value) => handleInputChange('service_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price ($)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="setup_fee">Setup Fee ($)</Label>
                  <Input
                    id="setup_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.setup_fee}
                    onChange={(e) => handleInputChange('setup_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_fee}
                    onChange={(e) => handleInputChange('monthly_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                  <Label htmlFor="is_recurring">Recurring Service</Label>
                </div>
                
                {formData.is_recurring && (
                  <div>
                    <Label htmlFor="billing_cycle">Billing Cycle</Label>
                    <Select 
                      value={formData.billing_cycle} 
                      onValueChange={(value) => handleInputChange('billing_cycle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commission Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="commission_type">Commission Type</Label>
                  <Select 
                    value={formData.commission_type} 
                    onValueChange={(value) => handleInputChange('commission_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.commission_type === 'percentage' ? (
                  <div>
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="commission_amount">Commission Amount ($)</Label>
                    <Input
                      id="commission_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.commission_amount}
                      onChange={(e) => handleInputChange('commission_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="max_quantity">Max Quantity per Client</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    min="1"
                    value={formData.max_quantity}
                    onChange={(e) => handleInputChange('max_quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability & Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Availability Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available_portal"
                        checked={formData.available_portal}
                        onCheckedChange={(checked) => handleInputChange('available_portal', checked)}
                      />
                      <Label htmlFor="available_portal">Available in Portal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available_mobile"
                        checked={formData.available_mobile}
                        onCheckedChange={(checked) => handleInputChange('available_mobile', checked)}
                      />
                      <Label htmlFor="available_mobile">Available in Mobile App</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available_gladgrade_only"
                        checked={formData.available_gladgrade_only}
                        onCheckedChange={(checked) => handleInputChange('available_gladgrade_only', checked)}
                      />
                      <Label htmlFor="available_gladgrade_only">GladGrade Internal Only</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Service Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                      />
                      <Label htmlFor="is_featured">Featured Service</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requires_approval"
                        checked={formData.requires_approval}
                        onCheckedChange={(checked) => handleInputChange('requires_approval', checked)}
                      />
                      <Label htmlFor="requires_approval">Requires Approval</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}