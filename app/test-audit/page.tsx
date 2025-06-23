"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Users, FileText, Database } from "lucide-react"

interface TestResult {
  success: boolean
  data: any
  error: string | null
}

interface TestResults {
  [key: string]: TestResult
}

interface TestCardProps {
  title: string
  testName: string
  endpoint: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  onRunTest: (testName: string, endpoint: string) => void
  loading: string | null
  result?: TestResult
}

const TestCard = ({
  title,
  testName,
  endpoint,
  icon: Icon,
  description,
  onRunTest,
  loading,
  result,
}: TestCardProps) => (
  <Card className="border-blue-200">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        {title}
      </CardTitle>
      <p className="text-sm text-gray-600">{description}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button onClick={() => onRunTest(testName, endpoint)} disabled={loading === testName} className="w-full">
        {loading === testName ? "Testing..." : "Run Test"}
      </Button>

      {result && (
        <div
          className={`p-3 rounded-md ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.success ? "Test Passed" : "Test Failed"}
            </span>
          </div>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      )}
    </CardContent>
  </Card>
)

export default function TestAuditPage() {
  const [results, setResults] = useState<TestResults>({})
  const [loading, setLoading] = useState<string | null>(null)

  const runTest = async (testName: string, endpoint: string) => {
    setLoading(testName)
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      setResults((prev) => ({
        ...prev,
        [testName]: {
          success: response.ok && data.success !== false,
          data,
          error: null,
        },
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setResults((prev) => ({
        ...prev,
        [testName]: {
          success: false,
          data: null,
          error: errorMessage,
        },
      }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">System Testing Dashboard</h1>
          <p className="text-gray-600">Test all components after audit system setup</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TestCard
          title="Employee Database"
          testName="employees"
          endpoint="/debug-user"
          icon={Users}
          description="Check if only real employees remain (Ada, Miguel, Patrick, Jacob)"
          onRunTest={runTest}
          loading={loading}
          result={results.employees}
        />

        <TestCard
          title="Audit Logs"
          testName="audit"
          endpoint="/api/audit/recent"
          icon={FileText}
          description="Verify audit logging system is working"
          onRunTest={runTest}
          loading={loading}
          result={results.audit}
        />

        <TestCard
          title="Sales Prospects"
          testName="prospects"
          endpoint="/api/sales/prospects"
          icon={Database}
          description="Check prospect data and assignments"
          onRunTest={runTest}
          loading={loading}
          result={results.prospects}
        />

        <TestCard
          title="Database Health"
          testName="health"
          endpoint="/api/health"
          icon={CheckCircle}
          description="Overall system health check"
          onRunTest={runTest}
          loading={loading}
          result={results.health}
        />
      </div>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Next Steps After Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              ✅ <strong>If all tests pass:</strong> Go to /dashboard/sales and create a new prospect
            </p>
            <p>
              🔄 <strong>Test prospect creation:</strong> It should assign to Ada Fernandez automatically
            </p>
            <p>
              📝 <strong>Check audit logs:</strong> All actions should be logged with details
            </p>
            <p>
              🎯 <strong>Test conversion:</strong> Convert a prospect and verify email uses Ada's real name
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.open("/dashboard/sales", "_blank")} variant="outline">
              Open Sales Dashboard
            </Button>
            <Button onClick={() => window.open("/debug-user", "_blank")} variant="outline">
              View Employee Debug
            </Button>
            <Button onClick={() => runTest("all", "/api/health")} disabled={loading !== null}>
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
