import { NextResponse } from "next/server"
import { getEmployeeByAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    console.log("🧪 Starting direct auth test...")

    // Test Miguel
    console.log("🔍 Testing Miguel Giraldo...")
    const miguelResult = await getEmployeeByAuth(undefined, "miguel.giraldo@gladgrade.com")
    console.log("📊 Miguel result:", miguelResult)

    // Test Ada
    console.log("🔍 Testing Ada Fernandez...")
    const adaResult = await getEmployeeByAuth(undefined, "aditafernandez.af@gmail.com")
    console.log("📊 Ada result:", adaResult)

    // Test Patrick
    console.log("🔍 Testing Patrick Doliny...")
    const patrickResult = await getEmployeeByAuth(undefined, "patrick.doliny@gladgrade.com")
    console.log("📊 Patrick result:", patrickResult)

    return NextResponse.json({
      success: true,
      test_results: {
        miguel: {
          email: "miguel.giraldo@gladgrade.com",
          found: !!miguelResult,
          result: miguelResult,
        },
        ada: {
          email: "aditafernandez.af@gmail.com",
          found: !!adaResult,
          result: adaResult,
        },
        patrick: {
          email: "patrick.doliny@gladgrade.com",
          found: !!patrickResult,
          result: patrickResult,
        },
      },
      message: "Direct auth test completed - check server console for detailed logs",
    })
  } catch (error) {
    console.error("❌ Direct auth test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Direct auth test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
