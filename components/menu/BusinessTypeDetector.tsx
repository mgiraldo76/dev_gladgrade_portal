// Path: /components/menu/BusinessTypeDetector.tsx
// Name: Business Type Detector - Detects business type from API

"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/providers"

import { apiClient } from "@/lib/api-client" 

interface BusinessInfo {
  id: number
  name: string
  item_type: string
  button_label: string
  has_items: boolean
}

interface BusinessTypeDetectorProps {
  onBusinessTypeDetected: (info: BusinessInfo) => void
}

export function BusinessTypeDetector({ onBusinessTypeDetected }: BusinessTypeDetectorProps) {
  const { user, businessId } = useAuth()

  useEffect(() => {
    detectBusinessType()
  }, [user, businessId])

  const detectBusinessType = async () => {
    try {
      if (!businessId) {
        console.log('⚠️ No businessId available from auth context, using fallback')
        onBusinessTypeDetected({
          id: 1,
          name: "Demo Business", 
          item_type: "food",
          button_label: "Menu",
          has_items: false
        })
        return
      }

      console.log(`🔍 Detecting business type for businessId: ${businessId}`)
      const businessInfo = await apiClient.menu.getBusinessInfo(businessId)
      
      onBusinessTypeDetected({
        id: businessId,
        name: businessInfo.name,
        item_type: businessInfo.item_type,
        button_label: businessInfo.button_label,
        has_items: businessInfo.has_items
      })
    } catch (error) {
      console.error('Error detecting business type:', error)
      
      // Fallback to default using the businessId from auth
      onBusinessTypeDetected({
        id: businessId || 1,
        name: "Unknown Business",
        item_type: "food",
        button_label: "Menu",
        has_items: false
      })
    }
  }

  return null
}