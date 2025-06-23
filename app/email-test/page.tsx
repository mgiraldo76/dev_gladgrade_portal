"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmailTestPage() {
  const [email, setEmail] = useState("miguel.giraldo@gladgrade.com")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestEmail = async () => {
    console.log("🔄 Sending test email to:", email)
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      console.log("📧 Email test result:", data)
      setResult(data)
    } catch (error) {
      console.error("❌ Email test error:", error)
      setResult({ success: false, error: "Failed to send test email" })
    } finally {
      setLoading(false)
    }
  }

  const isValidEmail = email && email.includes("@") && email.includes(".")
  const buttonDisabled = loading || !isValidEmail

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>📧 Email Test</CardTitle>
          <CardDescription>Send a test email to verify SMTP configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address:
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="text-sm text-gray-600">
            Button status: {buttonDisabled ? "Disabled" : "Enabled"}
            <br />
            Email valid: {isValidEmail ? "Yes" : "No"}
            <br />
            Loading: {loading ? "Yes" : "No"}
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={buttonDisabled}
            className="w-full"
            variant={buttonDisabled ? "secondary" : "default"}
          >
            {loading ? "Sending..." : "Send Test Email"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <h4 className="font-semibold">{result.success ? "✅ Success!" : "❌ Failed"}</h4>
              <pre className="text-sm mt-2 whitespace-pre-wrap overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-4">
            <strong>Debug Info:</strong>
            <br />
            Email: {email}
            <br />
            Valid: {isValidEmail.toString()}
            <br />
            Disabled: {buttonDisabled.toString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
