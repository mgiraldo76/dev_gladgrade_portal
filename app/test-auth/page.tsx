"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TestResult {
  success: boolean
  method: string
  input: {
    email?: string
    firebase_uid?: string
  }
  result?: {
    id: number
    name: string
    email: string
    role: string
    department_name?: string
  }
  found: boolean
  error?: string
}

interface ProspectResult {
  success: boolean
  data?: any
  message?: string
  debug?: any
  error?: string
}

export default function TestAuthPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [prospectResult, setProspectResult] = useState<ProspectResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [method, setMethod] = useState("email")
  const [businessName, setBusinessName] = useState("")

  // Test employees from your database
  const testEmployees = [
    { name: "Ada Fernandez", email: "aditafernandez.af@gmail.com", role: "employee" },
    { name: "Miguel Giraldo", email: "miguel.giraldo@gladgrade.com", role: "super_admin" },
    { name: "Patrick Doliny", email: "patrick.doliny@gladgrade.com", role: "admin" },
  ]

  const testUserDetection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/test-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          method,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        method,
        input: { email },
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const testProspectCreation = async (testUserEmail: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/sales/prospects/test-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName || `Test Business for ${testUserEmail}`,
          test_user_email: testUserEmail,
        }),
      })

      const result = await response.json()
      setProspectResult(result)
    } catch (error) {
      setProspectResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const quickTest = (employeeEmail: string) => {
    setEmail(employeeEmail)
    setMethod("email")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Authentication Testing</h1>
        <p className="text-gray-600 mt-2">Test user detection and prospect ownership logic</p>
      </div>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>Test with known employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testEmployees.map((employee) => (
              <div key={employee.email} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.role}</p>
                <p className="text-xs text-gray-500 mb-3">{employee.email}</p>
                <div className="space-y-2">
                  <Button onClick={() => quickTest(employee.email)} variant="outline" size="sm" className="w-full">
                    Set Email
                  </Button>
                  <Button
                    onClick={() => testProspectCreation(employee.email)}
                    size="sm"
                    className="w-full"
                    disabled={loading}
                  >
                    Test Prospect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Test Form */}
      <Card>
        <CardHeader>
          <CardTitle>Manual User Detection Test</CardTitle>
          <CardDescription>Test user lookup by email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter employee email"
            />
          </div>

          <div>
            <Label htmlFor="method">Test Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Lookup</SelectItem>
                <SelectItem value="firebase_uid">Firebase UID</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={testUserDetection} disabled={loading || !email}>
            {loading ? "Testing..." : "Test User Detection"}
          </Button>
        </CardContent>
      </Card>

      {/* Prospect Creation Test */}
      <Card>
        <CardHeader>
          <CardTitle>Prospect Creation Test</CardTitle>
          <CardDescription>Test prospect ownership assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Test Business Name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>User Detection Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {prospectResult && (
        <Card>
          <CardHeader>
            <CardTitle>Prospect Creation Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(prospectResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>✅ Database:</strong> 3 active employees (Ada, Miguel, Patrick)
            </p>
            <p>
              <strong>✅ User Detection:</strong> Working via email lookup
            </p>
            <p>
              <strong>✅ Prospect Assignment:</strong> Creator gets ownership
            </p>
            <p>
              <strong>⚠️ Authentication:</strong> Need to integrate with Firebase Auth
            </p>
            <p>
              <strong>🔄 Next Step:</strong> Connect real user sessions to API calls
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
