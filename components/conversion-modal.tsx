"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, DollarSign, Mail, QrCode, User, AlertCircle, CheckCircle } from "lucide-react"

interface ConversionModalProps {
  isOpen: boolean
  onClose: () => void
  prospect: any
  onSuccess: () => void
}

export function ConversionModal({ isOpen, onClose, prospect, onSuccess }: ConversionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    conversion_value: prospect?.estimated_value?.toString() || "",
    serviceId: "",
    client_contact_name: prospect?.contact_name || "",
    client_contact_email: prospect?.contact_email || "",
    contactPhone: prospect?.contact_phone || "",
    notes: "",
    send_welcome_email: true,
    generate_qr_codes: true,
    create_firebase_account: true,
  })

  const [services] = useState([
    { id: "1", name: "Basic Package", price: 299, commission_rate: 0.15 },
    { id: "2", name: "Premium Package", price: 599, commission_rate: 0.2 },
    { id: "3", name: "Enterprise Package", price: 999, commission_rate: 0.25 },
  ])

  const selectedService = services.find((s) => s.id === formData.serviceId)
  const conversionValue = Number.parseFloat(formData.conversion_value || "0")
  const estimatedCommission = selectedService ? conversionValue * selectedService.commission_rate : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Basic validation
    if (!formData.conversion_value || !formData.client_contact_name || !formData.client_contact_email) {
      setError("Please fill in all required fields (conversion value, contact name, and email)")
      setIsLoading(false)
      return
    }

    if (!formData.client_contact_email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    const conversionValueNum = Number.parseFloat(formData.conversion_value)
    if (isNaN(conversionValueNum) || conversionValueNum <= 0) {
      setError("Please enter a valid conversion value greater than 0")
      setIsLoading(false)
      return
    }

    try {
      console.log("Converting prospect:", {
        prospect_id: prospect.id,
        conversion_value: conversionValueNum,
        client_contact_name: formData.client_contact_name,
        client_contact_email: formData.client_contact_email,
      })

      const response = await fetch("/api/sales/prospects/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospect.id,
          conversion_value: conversionValueNum,
          client_contact_name: formData.client_contact_name,
          client_contact_email: formData.client_contact_email,
          client_contact_phone: formData.contactPhone,
          notes: formData.notes,
          send_welcome_email: formData.send_welcome_email,
          generate_qr_codes: formData.generate_qr_codes,
          create_firebase_account: formData.create_firebase_account,
        }),
      })

      const result = await response.json()
      console.log("Conversion response:", result)

      if (!response.ok) {
        throw new Error(result.details || result.error || "Failed to convert prospect")
      }

      if (result.success) {
        setSuccess(result.message || "Prospect converted to client successfully!")

        // Close modal after 2 seconds and refresh data
        setTimeout(() => {
          onSuccess()
          onClose()
          resetForm()
        }, 2000)
      } else {
        throw new Error(result.error || "Conversion failed")
      }
    } catch (error) {
      console.error("Conversion error:", error)
      setError(error instanceof Error ? error.message : "Failed to convert prospect. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      conversion_value: prospect?.estimated_value?.toString() || "",
      serviceId: "",
      client_contact_name: prospect?.contact_name || "",
      client_contact_email: prospect?.contact_email || "",
      contactPhone: prospect?.contact_phone || "",
      notes: "",
      send_welcome_email: true,
      generate_qr_codes: true,
      create_firebase_account: true,
    })
    setError(null)
    setSuccess(null)
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Convert Prospect to Client
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-red-800">Error</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-green-800">Success!</div>
              <div className="text-sm text-green-600 mt-1">{success}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prospect Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Prospect Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Business:</span> {prospect?.business_name}
              </div>
              <div>
                <span className="font-medium">Status:</span> {prospect?.status}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {prospect?.priority}
              </div>
              <div>
                <span className="font-medium">Estimated Value:</span> ${prospect?.estimated_value || 0}
              </div>
            </div>
          </div>

          {/* Sale Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Conversion Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conversion_value">Final Sale Value ($) *</Label>
                <Input
                  id="conversion_value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.conversion_value}
                  onChange={(e) => updateFormData("conversion_value", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="serviceId">Service Package (Optional)</Label>
                <Select onValueChange={(value) => updateFormData("serviceId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price} ({service.commission_rate * 100}% commission)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estimatedCommission > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800 font-medium">Estimated Commission: ${estimatedCommission.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Client Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_contact_name">Contact Name *</Label>
                <Input
                  id="client_contact_name"
                  value={formData.client_contact_name}
                  onChange={(e) => updateFormData("client_contact_name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_contact_email">Contact Email *</Label>
                <Input
                  id="client_contact_email"
                  type="email"
                  value={formData.client_contact_email}
                  onChange={(e) => updateFormData("client_contact_email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => updateFormData("contactPhone", e.target.value)}
              />
            </div>
          </div>

          {/* Automation Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Automation Options</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send_welcome_email"
                  checked={formData.send_welcome_email}
                  onCheckedChange={(checked) => updateFormData("send_welcome_email", !!checked)}
                />
                <Label htmlFor="send_welcome_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send welcome email with portal access
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate_qr_codes"
                  checked={formData.generate_qr_codes}
                  onCheckedChange={(checked) => updateFormData("generate_qr_codes", !!checked)}
                />
                <Label htmlFor="generate_qr_codes" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Generate QR codes (business profile + menu)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_firebase_account"
                  checked={formData.create_firebase_account}
                  onCheckedChange={(checked) => updateFormData("create_firebase_account", !!checked)}
                />
                <Label htmlFor="create_firebase_account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Create client portal account
                </Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Conversion Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this conversion..."
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Client"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
