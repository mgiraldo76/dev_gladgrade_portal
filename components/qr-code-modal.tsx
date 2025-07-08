// components/qr-code-modal.tsx
// Enhanced QR Code Modal Component with Professional GladGrade Branding

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
  MapPin
} from "lucide-react"

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
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [includeBranding, setIncludeBranding] = useState(true)

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && businessId) {
      generateQRCode()
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
          
          // 3. Draw "Grade & Earn Points*" tagline
          ctx.font = '30px Arial'
          ctx.fillStyle = '#666666'
          ctx.fillText('Grade & Earn Points*', canvas.width / 2, yPosition)
          
          // Draw separator line
          yPosition += 30
          ctx.strokeStyle = '#f97316'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(100, yPosition)
          ctx.lineTo(canvas.width - 100, yPosition)
          ctx.stroke()
          
          yPosition += 40
          
          // Draw business info if enabled
          if (includeBranding) {
            // Business background
            ctx.fillStyle = '#fef3e8'
            ctx.fillRect(60, yPosition - 20, canvas.width - 120, 80)
            ctx.strokeStyle = '#fed7aa'
            ctx.lineWidth = 2
            ctx.strokeRect(60, yPosition - 20, canvas.width - 120, 80)
            
            // Business name
            ctx.fillStyle = '#1a1a1a'
            ctx.font = 'bold 48px Arial'
            ctx.fillText(businessName, canvas.width / 2, yPosition + 20)
            
            // Business address
            if (businessAddress) {
              ctx.font = '33px Arial'
              ctx.fillStyle = '#666666'
              ctx.fillText(businessAddress, canvas.width / 2, yPosition + 55)
            }
            
            yPosition += 100
          }
          
          // Load and draw QR code
          const qrImage = new Image()
          qrImage.onload = () => {
            // Draw QR code with border
            const qrSize = 540
            const qrX = (canvas.width - qrSize) / 2
            const qrY = yPosition
            
            // QR code background and border
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48)
            ctx.strokeStyle = '#f97316'
            ctx.lineWidth = 6
            ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48)
            
            // Draw QR code
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
            
            yPosition += qrSize + 60
            
            // 4. Draw CTA section with proper vertical alignment
            const ctaHeight = 120
            const gradient = ctx.createLinearGradient(0, yPosition, 0, yPosition + ctaHeight)
            gradient.addColorStop(0, '#f97316')
            gradient.addColorStop(1, '#ea580c')
            
            ctx.fillStyle = gradient
            ctx.fillRect(60, yPosition, canvas.width - 120, ctaHeight)
            
            // Draw phone icon (moved down from top border)
            ctx.fillStyle = '#ffffff'
            ctx.font = '36px Arial'
            ctx.fillText('📱', 120, yPosition + 45) // Moved icon down and to the left
            
            // CTA text - properly centered vertically
            ctx.font = 'bold 48px Arial'
            ctx.fillText('Scan to Grade & Review', canvas.width / 2, yPosition + 45) // First line centered
            ctx.font = '33px Arial'
            ctx.fillText('Share your experience and earn rewards!', canvas.width / 2, yPosition + 85) // Second line centered
            
            yPosition += 140
            
            // 5. Instructions - properly sized to fit horizontally
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
                max-width: 420px;
                margin: 0 auto;
                padding: 15px;
                border: 2px solid #f97316;
                border-radius: 12px;
                background: white;
              }
              
              /* Compact GladGrade Header */
              .gladgrade-header {
                margin-bottom: 15px;
                padding-bottom: 12px;
                border-bottom: 1px solid #f97316;
                text-align: center;
              }
              .gg-logo {
                width: 35px;
                height: 35px;
                background-image: url('/images/gladgrade-logo.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                border-radius: 8px;
                margin: 0 auto 8px auto;
                display: block;
              }
              .glad-grade-text {
                font-size: 18px;
                font-weight: 900;
                color: #f97316;
                letter-spacing: 0.5px;
                line-height: 1;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .tagline {
                font-size: 10px;
                color: #666;
                font-weight: 500;
                line-height: 1;
                margin-top: 4px;
              }
              
              /* Compact Business Info */
              .business-section {
                margin-bottom: 12px;
                padding: 8px 12px;
                background: #fef3e8;
                border-radius: 8px;
                border: 1px solid #fed7aa;
              }
              .business-name {
                font-size: 16px;
                font-weight: bold;
                color: #1a1a1a;
                margin-bottom: 4px;
              }
              .business-address {
                font-size: 11px;
                color: #666;
                line-height: 1.3;
              }
              
              /* Compact QR Code */
              .qr-section {
                margin: 15px 0;
              }
              .qr-code {
                width: 180px;
                height: 180px;
                margin: 0 auto;
                display: block;
                border: 2px solid #f97316;
                border-radius: 8px;
                padding: 8px;
                background: white;
              }
              
              /* Compact CTA */
              .cta-section {
                margin: 12px 0;
                padding: 12px;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                border-radius: 8px;
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 60px;
              }
              .cta-main {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .phone-icon {
                font-size: 14px;
              }
              .cta-sub {
                font-size: 11px;
                opacity: 0.95;
              }
              
              /* Compact Instructions */
              .instructions {
                margin-top: 12px;
                padding: 8px 12px;
                background: #f8fafc;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
              }
              .instructions-text {
                font-size: 9px;
                color: #666;
                line-height: 1.4;
                text-align: center;
                word-spacing: -1px;
                letter-spacing: -0.2px;
              }
              
              /* Compact Footer */
              .footer {
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid #e5e7eb;
                font-size: 8px;
                color: #999;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  padding: 5px; 
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                .print-container { 
                  border: 1px solid #f97316;
                  page-break-inside: avoid;
                }
                .cta-section {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <!-- Compact GladGrade Header with Centered Logo -->
              <div class="gladgrade-header">
                <div class="gg-logo"></div>
                <div class="glad-grade-text">GLADGRADE ME</div>
                <div class="tagline">Rate • Review • Reward</div>
              </div>
              
              <!-- Business Information - Conditional -->
              ${includeBranding ? `
                <div class="business-section">
                  <div class="business-name">${businessName}</div>
                  ${businessAddress ? `<div class="business-address">${businessAddress}</div>` : ''}
                </div>
              ` : ''}
              
              <!-- QR Code -->
              <div class="qr-section">
                <img src="${qrData.qrCodeDataURL}" alt="GladGrade QR Code" class="qr-code" />
              </div>
              
              <!-- Call to Action -->
              <div class="cta-section">
                <div class="cta-main">📱 Scan to Rate & Review</div>
                <div class="cta-sub">Share your experience and earn rewards!</div>
              </div>
              
              <!-- Instructions -->
              <div class="instructions">
                <div class="instructions-text">
                  1. Open your phone's camera • 2. Point at QR code • 3. Tap notification • 4. Rate & earn rewards!
                </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <div>Powered by GladGrade • www.gladgrade.com</div>
              </div>
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const openUrl = () => {
    if (qrData?.qrUrl) {
      window.open(qrData.qrUrl, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Business QR Code
          </DialogTitle>
          <DialogDescription>
            Generate and print QR code for {businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Business Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{businessName}</div>
                  {businessAddress && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
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

              <div className="flex gap-2 w-full sm:w-auto">
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