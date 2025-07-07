// File: components/qr-code-modal.tsx
// QR Code Modal Component for Business Profile QR Codes

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
      link.download = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`
      link.href = qrData.qrCodeDataURL
      link.click()
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
            <title>QR Code - ${businessName}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                text-align: center;
                background: white;
              }
              .print-container {
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
              }
              .qr-code {
                width: 250px;
                height: 250px;
                margin: 20px auto;
                display: block;
              }
              .business-info {
                margin-bottom: 20px;
              }
              .business-name {
                font-size: 24px;
                font-weight: bold;
                color: #1a1a1a;
                margin-bottom: 8px;
              }
              .business-address {
                font-size: 14px;
                color: #666;
                margin-bottom: 16px;
              }
              .instructions {
                font-size: 12px;
                color: #888;
                margin-top: 20px;
                line-height: 1.4;
              }
              .url {
                font-size: 10px;
                color: #999;
                word-break: break-all;
                margin-top: 10px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .print-container { border: 1px solid #ccc; }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${includeBranding ? `
                <div class="business-info">
                  <div class="business-name">${businessName}</div>
                  ${businessAddress ? `<div class="business-address">${businessAddress}</div>` : ''}
                </div>
              ` : ''}
              <img src="${qrData.qrCodeDataURL}" alt="QR Code" class="qr-code" />
              <div class="instructions">
                <p><strong>Scan with your phone camera</strong></p>
                <p>Download the GladGrade app to view this business profile and earn rewards!</p>
              </div>
              <div class="url">${qrData.qrUrl}</div>
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
              {/* QR Code Image */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border">
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
                    Include business name and address when printing
                  </label>
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
                
                <Button variant="outline" size="sm" onClick={downloadQR} className="flex-1 sm:flex-none">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                
                <Button variant="outline" size="sm" onClick={openUrl} className="flex-1 sm:flex-none">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={printQR} className="flex-1 sm:flex-none">
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