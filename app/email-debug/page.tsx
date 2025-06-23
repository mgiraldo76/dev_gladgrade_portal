"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EmailDebugPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testWelcomeEmail = async () => {
    if (!email || !name) {
      setResult({ success: false, error: "Email and name are required" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/emails/test-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  const checkEmailConfig = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/emails/test")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>📧 Email Debug & Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Configuration Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Check Email Configuration</h3>
            <Button onClick={checkEmailConfig} disabled={loading} className="w-full">
              {loading ? "Checking..." : "Test Email Configuration"}
            </Button>
          </div>

          <hr />

          {/* Welcome Email Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Test Welcome Email</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Test Client Name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
            </div>
            <Button onClick={testWelcomeEmail} disabled={loading || !email || !name} className="w-full">
              {loading ? "Sending..." : "Send Test Welcome Email"}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Results:</h3>
              <Alert className={result.success ? "border-green-500" : "border-red-500"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong> {result.success ? "✅ Success" : "❌ Failed"}
                    </div>
                    <div>
                      <strong>Message:</strong> {result.message || result.error}
                    </div>
                    {result.details && (
                      <div>
                        <strong>Details:</strong> {result.details}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Environment Variables Check */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">3. Environment Variables Status:</h3>
            <div className="text-sm space-y-1">
              <div>SMTP_HOST: {process.env.NEXT_PUBLIC_ENV ? "✅ Set" : "❌ Missing"}</div>
              <div>SMTP_USER: {process.env.NEXT_PUBLIC_ENV ? "✅ Set" : "❌ Missing"}</div>
              <div>SMTP_PASSWORD: {process.env.NEXT_PUBLIC_ENV ? "✅ Set" : "❌ Missing"}</div>
              <div>SMTP_FROM: {process.env.NEXT_PUBLIC_ENV ? "✅ Set" : "❌ Missing"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
