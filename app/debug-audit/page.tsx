"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuditPage() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testDirectAuditInsert = async () => {
    setLoading("audit")
    try {
      const response = await fetch("/api/debug/test-audit-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setResults((prev: Record<string, any>) => ({ ...prev, audit: data }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setResults((prev: Record<string, any>) => ({ ...prev, audit: { error: errorMessage } }))
    } finally {
      setLoading(null)
    }
  }

  const testSimpleProspectCreation = async () => {
    setLoading("prospect")
    try {
      const response = await fetch("/api/debug/test-prospect-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setResults((prev: Record<string, any>) => ({ ...prev, prospect: data }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setResults((prev: Record<string, any>) => ({ ...prev, prospect: { error: errorMessage } }))
    } finally {
      setLoading(null)
    }
  }

  const testOriginalProspectCreation = async () => {
    setLoading("original")
    try {
      const response = await fetch("/api/sales/prospects/test-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": "miguel.giraldo@gladgrade.com",
        },
      })
      const data = await response.json()
      setResults((prev: Record<string, any>) => ({ ...prev, original: data }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setResults((prev: Record<string, any>) => ({ ...prev, original: { error: errorMessage } }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Debug Audit Logging Issue</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Test 1: Direct Audit Insert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Tests if we can insert directly into audit_logs table with action_type='CREATE'
            </p>
            <Button onClick={testDirectAuditInsert} disabled={loading === "audit"}>
              {loading === "audit" ? "Testing..." : "Test Direct Audit Insert"}
            </Button>
            {results.audit && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(results.audit, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 2: Simple Prospect Creation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">Tests prospect creation WITHOUT any audit logging</p>
            <Button onClick={testSimpleProspectCreation} disabled={loading === "prospect"}>
              {loading === "prospect" ? "Testing..." : "Test Simple Prospect Creation"}
            </Button>
            {results.prospect && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(results.prospect, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test 3: Original Prospect Creation (Failing)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">Tests the original prospect creation that's failing</p>
            <Button onClick={testOriginalProspectCreation} disabled={loading === "original"}>
              {loading === "original" ? "Testing..." : "Test Original Prospect Creation"}
            </Button>
            {results.original && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(results.original, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Diagnosis Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>If Test 1 succeeds:</strong> Audit table constraint is fine
            </p>
            <p>
              <strong>If Test 2 succeeds:</strong> Prospect creation works without audit logging
            </p>
            <p>
              <strong>If Test 3 fails:</strong> Issue is in the audit logger code
            </p>
            <p>
              <strong>Expected outcome:</strong> Tests 1 & 2 succeed, Test 3 fails - then we know it's the audit logger
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
