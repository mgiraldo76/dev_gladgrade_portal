// File: app/test-qr-email/page.tsx
// Quick test page for QR code email functionality

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestQREmailPage() {
  const [clientId, setClientId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testQREmail = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/emails/test-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: parseInt(clientId) })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test QR Code Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-2">
              Client ID to test:
            </label>
            <Input
              id="clientId"
              type="number"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
            />
          </div>

          <Button 
            onClick={testQREmail} 
            disabled={loading || !clientId}
            className="w-full"
          >
            {loading ? "Sending Test Email..." : "Send Test QR Code Email"}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className="font-semibold mb-2">
                {result.success ? "✅ Success" : "❌ Error"}
              </h3>
              <div className="text-sm space-y-1">
                <div><strong>Message:</strong> {result.message}</div>
                {result.details && <div><strong>Details:</strong> {result.details}</div>}
                {result.data && (
                  <div>
                    <strong>Data:</strong>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> This will test the QR code email functionality using a mock client ID. 
            Make sure you have:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>SMTP configuration in your .env.local file</li>
              <li>A valid client with the specified ID in your database</li>
              <li>The client has a valid email address</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}