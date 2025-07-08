// File: components/qr-code-modal.tsx
// Enhanced QR Code Modal Component with Email Functionality

"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  Building,
  MapPin,
  Mail,
  Loader2
} from "lucide-react"
import { useAuth } from "@/app/providers"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: number
  businessName: string
  placeId?: string
  businessAddress?: string
}

interface QRCodeData {
  qrUrl: string
  qrCodeDataURL: string
  placeId: string | null
  businessLocationId: number | null
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  businessId, 
  businessName,
  placeId,
  businessAddress 
}: QRCodeModalProps) {
  const { user } = useAuth()
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [includeBranding, setIncludeBranding] = useState(true)
  
  // NEW: Email functionality state
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && businessId) {
      generateQRCode()
      // Reset email states when modal opens
      setEmailSuccess(false)
      setEmailError(null)
    }
  }, [isOpen, businessId])

  const generateQRCode = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`🔄 Generating QR code for business ${businessId}...`)
      
      const response = await fetch(`/api/clients/${businessId}/qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to generate QR code: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setQrData(result.data)
        console.log('✅ QR code generated successfully')
      } else {
        throw new Error(result.error || 'Failed to generate QR code')
      }
    } catch (err) {
      console.error('❌ Error generating QR code:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (qrData?.qrUrl) {
      try {
        await navigator.clipboard.writeText(qrData.qrUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
    }
  }

  const openUrl = () => {
    if (qrData?.qrUrl) {
      window.open(qrData.qrUrl, '_blank')
    }
  }

  const downloadQR = () => {
    if (qrData?.qrCodeDataURL) {
      const link = document.createElement('a')
      link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code_Only.png`
      link.href = qrData.qrCodeDataURL
      link.click()
    }
  }

  const downloadFullLayout = () => {
    if (qrData?.qrCodeDataURL) {
      // Create a canvas to render the full layout
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
        
        // 1. Load and draw GladGrade logo at the very top, centered
        const logoImage = new Image()
        logoImage.onload = () => {
          // Draw logo centered at top
          const logoSize = 105 // 35px * 3 for high-res
          const logoX = (canvas.width - logoSize) / 2
          ctx.drawImage(logoImage, logoX, yPosition, logoSize, logoSize)
          
          yPosition += logoSize + 30
          
          // 2. Draw "GLADGRADE ME" title (no space)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // 3. Draw business name
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 48px Arial'
          ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
          
          yPosition += 60
          
          // 4. Load and draw QR code
          const qrImage = new Image()
          qrImage.onload = () => {
            const qrSize = 450 // Large QR code for scanning
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 30
            
            // 5. Draw business address if available
            if (businessAddress && includeBranding) {
              ctx.fillStyle = '#666666'
              ctx.font = '36px Arial'
              const addressLines = businessAddress.split(',')
              for (const line of addressLines) {
                ctx.fillText(line.trim(), canvas.width / 2, yPosition)
                yPosition += 40
              }
              yPosition += 20
            }
            
            // 6. Instructions - properly sized to fit horizontally
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, yPosition, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial' // Reduced font size to fit
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
            
            // Download the canvas as image
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
          
          qrImage.src = qrData.qrCodeDataURL
        }
        
        // Load the GladGrade logo
        logoImage.src = '/images/gladgrade-logo.png'
      }
    }
  }

  const printQR = () => {
    if (qrData?.qrCodeDataURL) {
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
                <img src="${qrData.qrCodeDataURL}" alt="QR Code" />
              </div>
              ${businessAddress && includeBranding ? `<div class="address">${businessAddress}</div>` : ''}
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
    }
  }

  // NEW: Email QR Code function
  const emailQRCode = async () => {
    if (!qrData) {
      setEmailError("QR code not generated yet")
      return
    }

    setEmailLoading(true)
    setEmailError(null)
    setEmailSuccess(false)

    try {
      console.log(`📧 Sending QR code email for business ${businessId}...`)

      // Generate full layout QR code data first
      const fullLayoutData = await generateFullLayoutForEmail()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add user authentication headers
      if (user?.email) {
        headers['x-user-email'] = user.email
      }

      // Send the full layout QR code data to the API
      const requestBody = {
        qrCodeDataURL: fullLayoutData || qrData.qrCodeDataURL // Fallback to basic QR if full layout fails
      }

      const response = await fetch(`/api/clients/${businessId}/send-qr-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to send email: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setEmailSuccess(true)
        console.log('✅ QR code email sent successfully')
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setEmailSuccess(false)
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to send QR code email')
      }
    } catch (err) {
      console.error('❌ Error sending QR code email:', err)
      setEmailError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setEmailLoading(false)
    }
  }

  // Generate full layout QR code for email (same logic as downloadFullLayout)
  const generateFullLayoutForEmail = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!qrData?.qrCodeDataURL) {
        resolve(null)
        return
      }

      // Create a canvas to render the full layout
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
        
        // 1. Load and draw GladGrade logo at the very top, centered
        const logoImage = new Image()
        logoImage.onload = () => {
          // Draw logo centered at top
          const logoSize = 105 // 35px * 3 for high-res
          const logoX = (canvas.width - logoSize) / 2
          ctx.drawImage(logoImage, logoX, yPosition, logoSize, logoSize)
          
          yPosition += logoSize + 30
          
          // 2. Draw "GLADGRADE ME" title (no space)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // 3. Draw business name
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 48px Arial'
          ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
          
          yPosition += 60
          
          // 4. Load and draw QR code
          const qrImage = new Image()
          qrImage.onload = () => {
            const qrSize = 450 // Large QR code for scanning
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 30
            
            // 5. Draw business address if available
            if (businessAddress && includeBranding) {
              ctx.fillStyle = '#666666'
              ctx.font = '36px Arial'
              const addressLines = businessAddress.split(',')
              for (const line of addressLines) {
                ctx.fillText(line.trim(), canvas.width / 2, yPosition)
                yPosition += 40
              }
              yPosition += 20
            }
            
            // 6. Instructions - properly sized to fit horizontally
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(60, yPosition, canvas.width - 120, 70)
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition, canvas.width - 120, 70)
            
            ctx.fillStyle = '#666666'
            ctx.font = '26px Arial' // Reduced font size to fit
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
            
            // Return the canvas as data URL
            resolve(canvas.toDataURL('image/png'))
          }
          
          qrImage.src = qrData.qrCodeDataURL
        }
        
        // Try to load the GladGrade logo, fallback if not available
        logoImage.onerror = () => {
          // Skip logo and continue with the rest
          yPosition = 60
          
          // 2. Draw "GLADGRADE ME" title (no space)
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f97316'
          ctx.font = 'bold 54px Arial'
          ctx.fillText('GLADGRADE ME', canvas.width / 2, yPosition)
          
          yPosition += 40
          
          // Continue with the rest of the layout...
          const qrImage = new Image()
          qrImage.onload = () => {
            // Same QR code drawing logic as above
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 48px Arial'
            ctx.fillText(businessName.toUpperCase(), canvas.width / 2, yPosition)
            
            yPosition += 60
            
            const qrSize = 450
            const qrX = (canvas.width - qrSize) / 2
            ctx.drawImage(qrImage, qrX, yPosition, qrSize, qrSize)
            
            yPosition += qrSize + 90
            
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
            
            // Return the canvas as data URL
            resolve(canvas.toDataURL('image/png'))
          }
          qrImage.src = qrData.qrCodeDataURL
        }
        
        // Load the GladGrade logo
        logoImage.src = '/images/gladgrade-logo.png'
      } else {
        resolve(null)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code for {businessName}
          </DialogTitle>
          <DialogDescription>
            Generate and manage QR codes for your business profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Info Card */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">{businessName}</h3>
                  {businessAddress && (
                    <div className="text-sm text-orange-700 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {businessAddress}
                    </div>
                  )}
                  {qrData?.placeId && (
                    <Badge variant="outline" className="text-xs mt-2">
                      Place ID: {qrData.placeId}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Generating QR code...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <div className="text-red-600 text-sm mb-2">❌ {error}</div>
              <Button variant="outline" size="sm" onClick={generateQRCode}>
                Try Again
              </Button>
            </div>
          )}

          {qrData && (
            <div className="space-y-4">
              {/* QR Code Preview */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-orange-500">
                  <img 
                    src={qrData.qrCodeDataURL} 
                    alt="Business QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">QR Code URL:</div>
                <div className="text-xs font-mono break-all text-gray-700">
                  {qrData.qrUrl}
                </div>
              </div>

              {/* Print Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeBranding"
                    checked={includeBranding}
                    onChange={(e) => setIncludeBranding(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeBranding" className="text-sm">
                    Include business name and address on printed QR code
                  </label>
                </div>
                <div className="text-xs text-gray-500 ml-6">
                  Note: "GLAD GRADE ME" branding will always appear on printed QR codes
                </div>
              </div>

              {/* NEW: Email Status Messages */}
              {emailSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">QR code email sent successfully!</span>
                  </div>
                </div>
              )}

              {emailError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-700 text-sm">
                    ❌ Error sending email: {emailError}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {qrData && (
            <>
              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={copyUrl} className="flex-1 sm:flex-none">
                  {copied ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </>
                  )}
                </Button>
                
                <Button variant="outline" size="sm" onClick={openUrl} className="flex-1 sm:flex-none">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>

              {/* Download Options */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={downloadQR} className="flex-1 sm:flex-none">
                  <Download className="h-3 w-3 mr-1" />
                  QR Only
                </Button>
                
                <Button variant="outline" size="sm" onClick={downloadFullLayout} className="flex-1 sm:flex-none">
                  <Download className="h-3 w-3 mr-1" />
                  Full Layout
                </Button>
              </div>

              {/* Print and Email Options */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={emailQRCode} 
                  disabled={emailLoading}
                  className="flex-1 sm:flex-none"
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3 mr-1" />
                      Email to Client
                    </>
                  )}
                </Button>
                
                <Button onClick={printQR} className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600">
                  <Printer className="h-3 w-3 mr-1" />
                  Print QR Code
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}