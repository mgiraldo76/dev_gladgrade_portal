import { NextResponse } from "next/server"
import { ggDB } from "@/lib/database-multi"

export async function GET() {
  try {
    const result = await ggDB.query(`
      SELECT bt.id AS businesstypeid, bt.businesstype, s.businesssectorname 
      FROM businesstypes bt 
      LEFT JOIN businesssector s ON s.id = bt.businesssectorid 
      ORDER BY bt.businesstype
    `)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch business types" },
      { status: 500 }
    )
  }
}