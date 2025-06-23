import { type NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/database"

// GET /api/debug/conversion-data - Debug conversion data structure
export async function GET(request: NextRequest) {
  const client = await getClient()

  try {
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospect_id")

    if (!prospectId) {
      return NextResponse.json({ error: "prospect_id parameter required" }, { status: 400 })
    }

    console.log(`🔍 Debugging conversion data for prospect ${prospectId}...`)

    // Check prospects table structure
    const prospectResult = await client.query(`SELECT * FROM prospects WHERE id = $1`, [prospectId])

    // Check employees table structure
    const employeeResult = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'employees'
       ORDER BY ordinal_position`,
    )

    // Check business_clients table structure
    const clientsResult = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'business_clients'
       ORDER BY ordinal_position`,
    )

    // Try to find the relationship between prospects and employees
    let salesmanData = null
    if (prospectResult.rows.length > 0) {
      const prospect = prospectResult.rows[0]
      console.log("🔍 Prospect data:", prospect)

      // Try different possible field names for salesman relationship
      const possibleSalesmanFields = [
        "assigned_salesperson_id",
        "assigned_to",
        "salesperson_id",
        "sales_rep_id",
        "employee_id",
      ]

      for (const field of possibleSalesmanFields) {
        if (prospect[field]) {
          console.log(`🔍 Found salesman field: ${field} = ${prospect[field]}`)

          try {
            const salesmanResult = await client.query(`SELECT * FROM employees WHERE id = $1`, [prospect[field]])

            if (salesmanResult.rows.length > 0) {
              salesmanData = {
                field: field,
                employee: salesmanResult.rows[0],
              }
              break
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch employee with ${field}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        prospect: prospectResult.rows[0] || null,
        salesman: salesmanData,
        table_structures: {
          employees: employeeResult.rows,
          business_clients: clientsResult.rows,
        },
      },
    })
  } catch (error) {
    console.error("❌ Error debugging conversion data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
