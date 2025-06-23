import QRCode from "qrcode"
import { query } from "@/lib/database"

// Generate QR code for business profile
export async function generateBusinessQR(clientId: number, businessName: string) {
  try {
    console.log(`📱 Generating business QR code for client ${clientId}...`)

    const qrUrl = `https://gladgrade.com/business/${clientId}`
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
      [clientId, "business_profile", qrUrl, qrCodeDataURL],
    )

    console.log(`✅ Business QR code generated for ${businessName}`)
    return { success: true, qrUrl, qrCodeDataURL }
  } catch (error) {
    console.error("❌ Error generating business QR code:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Generate QR code for menu (restaurants)
export async function generateMenuQR(clientId: number, businessName: string) {
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
      [clientId, "menu", qrUrl, qrCodeDataURL],
    )

    console.log(`✅ Menu QR code generated for ${businessName}`)
    return { success: true, qrUrl, qrCodeDataURL }
  } catch (error) {
    console.error("❌ Error generating menu QR code:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Get client QR codes
export async function getClientQRCodes(clientId: number) {
  try {
    const result = await query(
      `SELECT * FROM client_qr_codes 
       WHERE client_id = $1 AND is_active = TRUE 
       ORDER BY qr_type`,
      [clientId],
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error("❌ Error fetching client QR codes:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
