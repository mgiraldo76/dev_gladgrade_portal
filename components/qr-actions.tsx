// File: components/qr-actions.tsx
// QR Actions Component - Reusable QR Code action buttons

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Printer, 
  Loader2,
  QrCode,
  FileImage,
  Layout
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface QRActionsProps {
  businessId: number
  businessName: string
  businessAddress?: string
  className?: string
  variant?: "default" | "compact"
}

interface QRCodeData {
  qrUrl: string
  qrCodeDataURL: string
  placeId: string | null
  businessLocationId: number | null
}

export function QRActions({ 
  businessId, 
  businessName, 
  businessAddress,
  className = "",
  variant = "default"
}: QRActionsProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [loadingStates, setLoadingStates] = useState({
    fullLayout: false,
    qrOnly: false,
    print: false
  })
  const [error, setError] = useState<string | null>(null)

  const setLoading = (action: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }))
  }

  const generateQRIfNeeded = async (): Promise<QRCodeData | null> => {
    if (qrData) return qrData

    try {
      console.log(`🔄 Generating QR code for business ${businessId}...`)
      
      const result = await apiClient.generateClientQRCode(businessId)
      
      if (result.success) {
        setQrData(result.data)
        setError(null)
        console.log('✅ QR code generated successfully')
        return result.data
      } else {
        throw new Error(result.error || 'Failed to generate QR code')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Error generating QR code:', errorMsg)
      setError(errorMsg)
      return null
    }
  }

  const downloadQROnly = async () => {
    setLoading('qrOnly', true)
    try {
      const data = await generateQRIfNeeded()
      if (!data) return

      const link = document.createElement('a')
      link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`
      link.href = data.qrCodeDataURL
      link.click()
    } catch (err) {
      console.error('Error downloading QR only:', err)
    } finally {
      setLoading('qrOnly', false)
    }
  }

  const downloadFullLayout = async () => {
    setLoading('fullLayout', true)
    try {
      const data = await generateQRIfNeeded()
      if (!data) return

      // Create canvas for full layout
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size for print quality (300 DPI equivalent)
      canvas.width = 1050 // 3.5 inches at 300 DPI
      canvas.height = 1350 // 4.5 inches at 300 DPI
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw border
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 6
        ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
        
        let yPosition = 60
        
        // Load and draw GladGrade logo
        const logoImage = new Image()
        logoImage.onload = () => {
          // Draw logo centered at top
          const logoSize = 105
          const logoX = (canvas.width - logoSize) / 2
          ctx.drawImage(logoImage, logoX, yPosition, logoSize, logoSize)
          
          yPosition += logoSize + 30
          
          // Draw "GLADGRADE ME" title
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // Draw business name
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 48px Arial'
          ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
          
          yPosition += 60
          
          // Load and draw QR code
          const qrImage = new Image()
          qrImage.onload = () => {
            const qrSize = 450
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 30
            
            // Draw business address if available
            if (businessAddress) {
              ctx.fillStyle = '#666666'
              ctx.font = '36px Arial'
              const addressLines = businessAddress.split(',')
              for (const line of addressLines) {
                ctx.fillText(line.trim(), canvas.width / 2, yPosition)
                yPosition += 40
              }
              yPosition += 20
            }
            
            // Instructions
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, yPosition, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial'
            ctx.fillText('1. Open Camera • 2. Scan Code • 3. Open/Download App • 4. Grade this Business', canvas.width / 2, yPosition + 45)
            
            yPosition += 90
            
            // Footer
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(100, yPosition)
            ctx.lineTo(canvas.width - 100, yPosition)
            ctx.stroke()
            
            ctx.fillStyle = '#999999'
            ctx.font = '24px Arial'
            ctx.fillText('Powered by GladGrade • www.gladgrade.com', canvas.width / 2, yPosition + 35)
            
            // Download the canvas
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_GladGrade_Full_Layout.png`
                link.href = url
                link.click()
                URL.revokeObjectURL(url)
              }
            }, 'image/png')
          }
          
          qrImage.src = data.qrCodeDataURL
        }
        
        // Fallback if logo fails to load
        logoImage.onerror = () => {
          // Continue without logo
          yPosition = 60
          
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          // Continue with rest of layout...
          const qrImage = new Image()
          qrImage.onload = () => {
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 48px Arial'
            ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition + 40)
            
            const qrSize = 450
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition + 100, qrSize, qrSize)
            
            // Instructions and footer...
            let instructionY = yPosition + 100 + qrSize + 90
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, instructionY, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, instructionY, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial'
            ctx.fillText('1. Open Camera • 2. Scan Code • 3. Open/Download App • 4. Grade this Business', canvas.width / 2, instructionY + 45)
            
            instructionY += 90
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(100, instructionY)
            ctx.lineTo(canvas.width - 100, instructionY)
            ctx.stroke()
            
            ctx.fillStyle = '#999999'
            ctx.font = '24px Arial'
            ctx.fillText('Powered by GladGrade • www.gladgrade.com', canvas.width / 2, instructionY + 35)
            
            // Download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_GladGrade_Full_Layout.png`
                link.href = url
                link.click()
                URL.revokeObjectURL(url)
              }
            }, 'image/png')
          }
          qrImage.src = data.qrCodeDataURL
        }
        
        logoImage.src = '/images/gladgrade-logo.png'
      }
    } catch (err) {
      console.error('Error downloading full layout:', err)
    } finally {
      setLoading('fullLayout', false)
    }
  }

  const printQRCode = async () => {
    setLoading('print', true)
    try {
      const data = await generateQRIfNeeded()
      if (!data) return

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>GladGrade QR Code - ${businessName}</title>
            <style>
              body {
                margin: 0;
                padding: 10px;
                font-family: 'Arial', sans-serif;
                text-align: center;
                background: white;
                color: #1a1a1a;
              }
              .print-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px;
                border: 3px solid #f97316;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 20px;
              }
              .title {
                font-size: 28px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 10px;
              }
              .business-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 30px;
                text-transform: uppercase;
              }
              .qr-code {
                margin: 30px 0;
              }
              .qr-code img {
                width: 300px;
                height: 300px;
                border: 2px solid #e5e7eb;
              }
              .address {
                font-size: 18px;
                color: #666;
                margin: 20px 0;
              }
              .instructions {
                background-color: #f8fafc;
                border: 2px solid #e2e8f0;
                padding: 15px;
                margin: 20px 0;
                font-size: 16px;
                color: #666;
              }
              .footer {
                border-top: 2px solid #e5e7eb;
                padding-top: 15px;
                margin-top: 30px;
                font-size: 14px;
                color: #999;
              }
              @media print {
                body { print-color-adjust: exact; }
                .print-container { border: 3px solid #f97316 !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="logo">GladGrade</div>
              <div class="title">GLADGRADE ME</div>
              <div class="business-name">${businessName}</div>
              <div class="qr-code">
                <img src="${data.qrCodeDataURL}" alt="QR Code" />
              </div>
              ${businessAddress ? `<div class="address">${businessAddress}</div>` : ''}
              <div class="instructions">
                1. Open Camera • 2. Scan Code • 3. Open/Download App • 4. Grade this Business
              </div>
              <div class="footer">
                Powered by GladGrade • www.gladgrade.com
              </div>
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (err) {
      console.error('Error printing QR code:', err)
    } finally {
      setLoading('print', false)
    }
  }

  const anyLoading = Object.values(loadingStates).some(loading => loading)

  if (variant === "compact") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadFullLayout}
          disabled={anyLoading}
          className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
        >
          {loadingStates.fullLayout ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Layout className="h-3 w-3" />
          )}
          Full
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={downloadQROnly}
          disabled={anyLoading}
          className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          {loadingStates.qrOnly ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileImage className="h-3 w-3" />
          )}
          QR Only
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={printQRCode}
          disabled={anyLoading}
          className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
        >
          {loadingStates.print ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Printer className="h-3 w-3" />
          )}
          Print
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-700 text-sm">
            ❌ Error: {error}
          </div>
          <div className="text-red-600 text-xs mt-1">
            Please contact your administrator if this problem persists.
          </div>
        </div>
      )}
      
      <div className="grid gap-3">
        <Button
          onClick={downloadFullLayout}
          disabled={anyLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 justify-start px-4"
        >
          {loadingStates.fullLayout ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Layout className="h-4 w-4" />
          )}
          <div className="text-left">
            <div className="font-medium">Download Full Layout</div>
            <div className="text-xs opacity-90">Complete QR code with branding</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={downloadQROnly}
          disabled={anyLoading}
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 flex items-center gap-2 justify-start px-4"
        >
          {loadingStates.qrOnly ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileImage className="h-4 w-4" />
          )}
          <div className="text-left">
            <div className="font-medium">Download QR Only</div>
            <div className="text-xs opacity-70">Just the QR code image</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={printQRCode}
          disabled={anyLoading}
          className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center gap-2 justify-start px-4"
        >
          {loadingStates.print ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          <div className="text-left">
            <div className="font-medium">Print QR Code</div>
            <div className="text-xs opacity-70">Print full layout with instructions</div>
          </div>
        </Button>
      </div>
    </div>
  )
}