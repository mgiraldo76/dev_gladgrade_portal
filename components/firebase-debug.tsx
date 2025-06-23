"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FirebaseDebug() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check environment variables on client side
    setEnvVars({
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "Not set",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "Not set",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not set",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "Not set",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "Not set",
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "Not set",
    })
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Firebase Configuration Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-mono">{key}:</span>
              <span className={value === "Not set" ? "text-red-500" : "text-green-500"}>
                {value === "Not set" ? "❌ Not set" : "✅ Set"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
