"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DebugData {
  employees: any[]
  departments: any[]
  recent_prospects: any[]
  ada_records: any[]
  sales_department: any[]
  total_employees: number
  total_prospects: number
  schema_info: {
    employee_name_column: string
    prospect_assignment_column: string
    client_sales_rep_column: string
  }
}

export default function DebugUserPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/current-user")
      const result = await response.json()

      if (result.success) {
        setDebugData(result.data)
      } else {
        setError(result.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Debug fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading debug data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchDebugData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No data available</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User & Employee Debug</h1>
        <Button onClick={fetchDebugData} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Ada Records */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Ada Fernandez Records</CardTitle>
          </CardHeader>
          <CardContent>
            {debugData.ada_records.length > 0 ? (
              <div className="space-y-4">
                {debugData.ada_records.map((ada, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>ID:</strong> {ada.id}
                      </div>
                      <div>
                        <strong>Name:</strong> {ada.full_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {ada.email}
                      </div>
                      <div>
                        <strong>Department:</strong> {ada.department_name}
                      </div>
                      <div>
                        <strong>Role:</strong> {ada.role}
                      </div>
                      <div>
                        <strong>Status:</strong> {ada.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-yellow-600">⚠️ No Ada records found in employees table</p>
            )}
          </CardContent>
        </Card>

        {/* All Employees */}
        <Card>
          <CardHeader>
            <CardTitle>👥 All Employees ({debugData.total_employees})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugData.employees.map((emp, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>ID:</strong> {emp.id}
                    </div>
                    <div>
                      <strong>Name:</strong> {emp.full_name}
                    </div>
                    <div>
                      <strong>Email:</strong> {emp.email}
                    </div>
                    <div>
                      <strong>Department:</strong> {emp.department_name || "None"}
                    </div>
                    <div>
                      <strong>Role:</strong> {emp.role}
                    </div>
                    <div>
                      <strong>Status:</strong> {emp.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Prospects */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Recent Prospects & Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugData.recent_prospects.map((prospect, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>ID:</strong> {prospect.id}
                    </div>
                    <div>
                      <strong>Business:</strong> {prospect.business_name}
                    </div>
                    <div>
                      <strong>Assigned To:</strong> {prospect.salesperson_name || "Unassigned"}
                    </div>
                    <div>
                      <strong>Status:</strong> {prospect.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schema Info */}
        <Card>
          <CardHeader>
            <CardTitle>🏗️ Database Schema Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <strong>Employee Name Column:</strong> {debugData.schema_info.employee_name_column}
              </div>
              <div>
                <strong>Prospect Assignment Column:</strong> {debugData.schema_info.prospect_assignment_column}
              </div>
              <div>
                <strong>Client Sales Rep Column:</strong> {debugData.schema_info.client_sales_rep_column}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
