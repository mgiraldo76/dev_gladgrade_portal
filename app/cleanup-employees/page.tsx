"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, CheckCircle, Users } from "lucide-react"

export default function CleanupEmployeesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to remove all default sample employees? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/employees/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Cleanup failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Employee Cleanup</h1>
          <p className="text-gray-600">Remove default sample employees from the database</p>
        </div>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Warning: Destructive Operation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="font-semibold text-red-800 mb-2">This will permanently remove:</h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              <li>Sarah Johnson (sarah@gladgrade.com)</li>
              <li>Mike Chen (mike@gladgrade.com)</li>
              <li>Lisa Rodriguez (lisa@gladgrade.com)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-800 mb-2">This will also:</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Reassign their prospects to Ada Fernandez</li>
              <li>Reassign their commissions to Ada Fernandez</li>
              <li>Remove their permissions and sessions</li>
              <li>Update department employee counts</li>
            </ul>
          </div>

          <Button onClick={handleCleanup} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Cleaning up...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Default Employees
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-800">Cleanup Failed</div>
                <div className="text-sm text-red-600 mt-1">{error}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Cleanup Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Employees Removed:</h3>
                <div className="space-y-1">
                  {result.data.employees_deleted.map((emp: any) => (
                    <div key={emp.id} className="text-sm bg-red-50 p-2 rounded">
                      {emp.full_name} ({emp.email})
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Remaining Employees:</h3>
                <div className="space-y-1">
                  {result.data.employees_after.map((emp: any) => (
                    <div key={emp.id} className="text-sm bg-green-50 p-2 rounded">
                      {emp.full_name} ({emp.email}) - {emp.status}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
