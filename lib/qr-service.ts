// File: lib/qr-service.ts (UPDATED)
// QR Service with new URL format for business profile deep linking

import QRCode from "qrcode"
import { query } from "@/lib/database"

interface QRCodeResult {
  success: boolean
  qrUrl?: string
  qrCodeDataURL?: string
  placeId?: string | null
  businessLocationId?: number | null
  error?: string
}

// Generate QR code for business profile with enhanced data fetching
export async function generateBusinessQR(clientId: number, businessName: string): Promise<QRCodeResult> {
  try {
    console.log(`📱 Generating business QR code for client ${clientId}...`)

    // Get business data with place_id and location fallback
    const businessResult = await query(
      `SELECT 
        bc.id,
        bc.business_name,
        bc.place_id as business_place_id,
        bl.id as location_id,
        bl.place_id as location_place_id,
        bl.is_primary,
        bl.address,
        bl.city,
        bl.state
       FROM business_clients bc
       LEFT JOIN business_locations bl ON bc.id = bl.business_client_id AND bl.is_primary = true
       WHERE bc.id = $1`,
      [clientId]
    )

    if (businessResult.rows.length === 0) {
      return { success: false, error: 'Business client not found' }
    }

    const business = businessResult.rows[0]
    
    // Determine which place_id to use (business_clients.place_id takes priority)
    let finalPlaceId = business.business_place_id || business.location_place_id || null
    let businessLocationId = business.location_id || null

    console.log(`🏢 Business: ${business.business_name}`)
    console.log(`📍 Using place_id: ${finalPlaceId || 'None'}`)
    console.log(`🏢 Business location ID: ${businessLocationId || 'None'}`)

    // Build the new QR URL format
    const baseUrl = 'https://app.gladgrade.com/placeDetails/'
    const params = new URLSearchParams({
      clientBusinessId: clientId.toString(),
      referral: 'businessQRScan'
    })

    // Add placeId if available
    if (finalPlaceId) {
      params.append('placeId', finalPlaceId)
    }

    // Add business location ID if available
    if (businessLocationId) {
      params.append('businessLocationId', businessLocationId.toString())
    }

    const qrUrl = `${baseUrl}?${params.toString()}`
    
    console.log(`🔗 Generated QR URL: ${qrUrl}`)

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    // Store QR code record in database
    await query(
      `INSERT INTO client_qr_codes (client_id, qr_type, qr_code_url, qr_image_path)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_id, qr_type) 
       DO UPDATE SET qr_code_url = $3, qr_image_path = $4, updated_at = CURRENT_TIMESTAMP`,
      [clientId, "business_profile", qrUrl, qrCodeDataURL]
    )

    console.log(`✅ Business QR code generated and stored for ${businessName}`)

    return { 
      success: true, 
      qrUrl, 
      qrCodeDataURL,
      placeId: finalPlaceId,
      businessLocationId
    }
  } catch (error) {
    console.error("❌ Error generating business QR code:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

// Generate QR code for menu (restaurants) - keeping existing functionality
export async function generateMenuQR(clientId: number, businessName: string): Promise<QRCodeResult> {
  try {
    console.log(`🍽️ Generating menu QR code for client ${clientId}...`)

    const qrUrl = `https://gladgrade.com/menu/${clientId}`
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    // Store QR code record
    await query(
      `INSERT INTO client_qr_codes (client_id, qr_type, qr_code_url, qr_image_path)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_id, qr_type) 
       DO UPDATE SET qr_code_url = $3, qr_image_path = $4, updated_at = CURRENT_TIMESTAMP`,
      [clientId, "menu", qrUrl, qrCodeDataURL]
    )

    console.log(`✅ Menu QR code generated for ${businessName}`)
    return { success: true, qrUrl, qrCodeDataURL }
  } catch (error) {
    console.error("❌ Error generating menu QR code:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

// Get client QR codes
export async function getClientQRCodes(clientId: number) {
  try {
    const result = await query(
      `SELECT * FROM client_qr_codes 
       WHERE client_id = $1 AND is_active = TRUE 
       ORDER BY qr_type`,
      [clientId]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error("❌ Error fetching client QR codes:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}