"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface TestResults {
  database: Record<string, { exists: boolean; count?: number; error?: string }>
  email: { configured: boolean; host?: string; user?: string; status?: string; error?: string } | null
  qr: { available: boolean; test_generated?: boolean; error?: string } | null
}

interface Recommendation {
  type: string
  action: string
  description: string
  command: string
}

export default function SetupPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [emailTesting, setEmailTesting] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/sales/test")
      const data = await response.json()

      if (data.success) {
        setTestResults(data.results)
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const testEmail = async () => {
    setEmailTesting(true)
    try {
      const response = await fetch("/api/sales/test", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert("Test email sent successfully!")
      } else {
        alert(`Email test failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Error testing email:", error)
      alert("Email test failed")
    } finally {
      setEmailTesting(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline Setup</h1>
          <p className="text-muted-foreground">Verify your GladGrade sales pipeline configuration</p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run Tests
        </Button>
      </div>

      {testResults && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Database Tables
                {Object.values(testResults.database).every((t) => t.exists) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>Sales pipeline database schema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(testResults.database).map(([table, info]) => (
                <div key={table} className="flex items-center justify-between">
                  <span className="text-sm">{table}</span>
                  <div className="flex items-center gap-2">
                    {info.exists && <Badge variant="secondary">{info.count}</Badge>}
                    {getStatusIcon(info.exists)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Email System
                {testResults.email?.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>SMTP configuration and welcome emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {testResults.email?.configured ? (
                <>
                  <div className="text-sm">
                    <strong>Host:</strong> {testResults.email.host}
                  </div>
                  <div className="text-sm">
                    <strong>User:</strong> {testResults.email.user}
                  </div>
                  <div className="text-sm text-green-600">{testResults.email.status}</div>
                  <Button size="sm" onClick={testEmail} disabled={emailTesting} className="w-full mt-2">
                    {emailTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Test Email
                  </Button>
                </>
              ) : (
                <div className="text-sm text-red-600">{testResults.email?.error || "Not configured"}</div>
              )}
            </CardContent>
          </Card>

          {/* QR Code System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                QR Codes
                {testResults.qr?.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>QR code generation for clients</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.qr?.available ? (
                <div className="text-sm text-green-600">QR code generation is working</div>
              ) : (
                <div className="text-sm text-red-600">{testResults.qr?.error || "Not available"}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Setup Recommendations
            </CardTitle>
            <CardDescription>Follow these steps to complete your setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={rec.type === "success" ? "default" : "destructive"}>{rec.type}</Badge>
                  <h4 className="font-semibold">{rec.action}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                <code className="text-xs bg-muted p-2 rounded block">{rec.command}</code>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common setup and testing actions</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <a href="/dashboard/sales">Sales Dashboard</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/sales/test" target="_blank" rel="noreferrer">
              View Test Results
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/emails/process" target="_blank" rel="noreferrer">
              Process Emails
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard/users">Manage Users</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
