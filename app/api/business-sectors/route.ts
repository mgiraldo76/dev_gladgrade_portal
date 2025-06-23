import { NextResponse } from "next/server"
import { ggDB } from "@/lib/database-multi"

// GET /api/business-sectors - Get all business sectors from gg database
export async function GET() {
  try {
    const result = await ggDB.query("SELECT id, businessSectorName FROM businessSector ORDER BY businessSectorName ASC")

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("❌ Error fetching business sectors:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch business sectors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
