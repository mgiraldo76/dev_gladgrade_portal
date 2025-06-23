import { type NextRequest, NextResponse } from "next/server"
import { ggDB } from "@/lib/database-multi"

// GET /api/moderation - Get content items for moderation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("type") || "all"
    const status = searchParams.get("status") || "pending"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    console.log(`🔍 Fetching moderation items: type=${contentType}, status=${status}, page=${page}`)

    const offset = (page - 1) * limit

    // Map status names to IDs
    const statusMap: { [key: string]: number } = {
      pending: 1,
      approved: 2,
      flagged: 3,
      deleted: 4,
      rejected: 5,
    }

    const statusId = status === "all" ? null : statusMap[status] || 1

    // Build the query directly - using proper schema.table syntax
    let items: any[] = []

    if (contentType === "all" || contentType === "image") {
      const imageQuery = `
        SELECT 
          'image' as content_type,
          i.id,
          i.imageurl as content,
          i.datecreated as created_at,
          COALESCE(i.moderation_status_id, 1) as moderation_status_id,
          i.moderated_by_employee_id,
          i.moderation_notes,
          i.moderated_at,
          COALESCE(u.firstname || ' ' || u.lastname, 'Unknown User') as user_name,
          COALESCE(b.businessname, 'Unknown Business') as business_name,
          (SELECT placeId FROM consumerRatings WHERE id = i.consumerRatingId LIMIT 1) as placeid,
          NULL as message_category_id
        FROM imageURLs i
        LEFT JOIN users u ON i.userid = u.id
        LEFT JOIN consumerRatings cr ON i.consumerRatingId = cr.id
        LEFT JOIN businesses b ON cr.placeId = b.placeid
        WHERE ($1::int IS NULL OR COALESCE(i.moderation_status_id, 1) = $1)
        AND ($2::text = '' OR i.imageurl ILIKE $2 OR u.firstname ILIKE $2 OR u.lastname ILIKE $2 OR b.businessname ILIKE $2)
        ORDER BY i.datecreated DESC
        LIMIT $3 OFFSET $4
      `

      const searchPattern = search ? `%${search}%` : ""
      const imageResult = await ggDB.query(imageQuery, [statusId, searchPattern, limit, offset])
      items = items.concat(imageResult.rows)
    }

    if (contentType === "all" || contentType === "review") {
      const reviewQuery = `
        SELECT 
          'review' as content_type,
          r.id,
          r.review as content,
          r.datecreated as created_at,
          COALESCE(r.moderation_status_id, 1) as moderation_status_id,
          r.moderated_by_employee_id,
          r.moderation_notes,
          r.moderated_at,
          COALESCE(u.firstname || ' ' || u.lastname, 'Unknown User') as user_name,
          COALESCE(b.businessname, 'Unknown Business') as business_name,
          r.placeid,
          NULL as message_category_id
        FROM consumerReviews r
        LEFT JOIN users u ON r.userid = u.id
        LEFT JOIN businesses b ON r.placeid = b.placeid
        WHERE ($1::int IS NULL OR COALESCE(r.moderation_status_id, 1) = $1)
        AND ($2::text = '' OR r.review ILIKE $2 OR u.firstname ILIKE $2 OR u.lastname ILIKE $2 OR b.businessname ILIKE $2)
        ORDER BY r.datecreated DESC
        LIMIT $3 OFFSET $4
      `

      const searchPattern = search ? `%${search}%` : ""
      const reviewResult = await ggDB.query(reviewQuery, [statusId, searchPattern, limit, offset])
      items = items.concat(reviewResult.rows)
    }

    if (contentType === "all" || contentType === "ad") {
      const adQuery = `
        SELECT 
          'ad' as content_type,
          a.id,
          a.imageurl as content,
          a.datecreated as created_at,
          COALESCE(a.moderation_status_id, 1) as moderation_status_id,
          a.moderated_by_employee_id,
          a.moderation_notes,
          a.moderated_at,
          COALESCE(u.firstname || ' ' || u.lastname, 'Unknown User') as user_name,
          COALESCE(b.businessname, 'Unknown Business') as business_name,
          b.placeid,
          NULL as message_category_id
        FROM ads a
        LEFT JOIN users u ON a.userid = u.id
        LEFT JOIN businesses b ON a.businessid = b.id
        WHERE ($1::int IS NULL OR COALESCE(a.moderation_status_id, 1) = $1)
        AND ($2::text = '' OR a.imageurl ILIKE $2 OR u.firstname ILIKE $2 OR u.lastname ILIKE $2 OR b.businessname ILIKE $2)
        ORDER BY a.datecreated DESC
        LIMIT $3 OFFSET $4
      `

      const searchPattern = search ? `%${search}%` : ""
      const adResult = await ggDB.query(adQuery, [statusId, searchPattern, limit, offset])
      items = items.concat(adResult.rows)
    }

    if (contentType === "all" || contentType === "communication") {
      const commQuery = `
        SELECT 
          'communication' as content_type,
          c.id,
          COALESCE(c.message_from_client, c.message_from_user, 'No message content') as content,
          c.created_at,
          COALESCE(c.moderation_status_id, 1) as moderation_status_id,
          c.moderated_by_employee_id,
          c.moderation_notes,
          c.moderated_at,
          CASE 
            WHEN c.message_from_client IS NOT NULL THEN COALESCE(client_u.firstname || ' ' || client_u.lastname, 'Unknown Client')
            ELSE COALESCE(user_u.firstname || ' ' || user_u.lastname, 'Unknown User')
          END as user_name,
          COALESCE(b.businessname, 'Unknown Business') as business_name,
          b.placeid,
          c.message_category_id
        FROM client_user_communications c
        LEFT JOIN users client_u ON c.client_id = client_u.id
        LEFT JOIN users user_u ON c.user_id = user_u.id
        LEFT JOIN businesses b ON c.business_id = b.id
        WHERE ($1::int IS NULL OR COALESCE(c.moderation_status_id, 1) = $1)
        AND ($2::text = '' OR c.message_from_client ILIKE $2 OR c.message_from_user ILIKE $2)
        ORDER BY c.created_at DESC
        LIMIT $3 OFFSET $4
      `

      const searchPattern = search ? `%${search}%` : ""
      const commResult = await ggDB.query(commQuery, [statusId, searchPattern, limit, offset])
      items = items.concat(commResult.rows)
    }

    // Sort all items by created_at
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Add status names
    const statusNames: { [key: number]: string } = {
      1: "pending",
      2: "approved",
      3: "flagged",
      4: "deleted",
      5: "rejected",
    }

    items = items.map((item) => ({
      ...item,
      moderation_status: statusNames[item.moderation_status_id] || "pending",
    }))

    // Get total count for pagination
    let totalCount = 0
    if (contentType === "all") {
      const countQueries = [
        `SELECT COUNT(*) as count FROM imageURLs WHERE ($1::int IS NULL OR COALESCE(moderation_status_id, 1) = $1)`,
        `SELECT COUNT(*) as count FROM consumerReviews WHERE ($1::int IS NULL OR COALESCE(moderation_status_id, 1) = $1)`,
        `SELECT COUNT(*) as count FROM ads WHERE ($1::int IS NULL OR COALESCE(moderation_status_id, 1) = $1)`,
        `SELECT COUNT(*) as count FROM client_user_communications WHERE ($1::int IS NULL OR COALESCE(moderation_status_id, 1) = $1)`,
      ]

      for (const query of countQueries) {
        const result = await ggDB.query(query, [statusId])
        totalCount += Number.parseInt(result.rows[0]?.count || "0")
      }
    } else {
      let tableName = ""
      switch (contentType) {
        case "image":
          tableName = "imageURLs"
          break
        case "review":
          tableName = "consumerReviews"
          break
        case "ad":
          tableName = "ads"
          break
        case "communication":
          tableName = "client_user_communications"
          break
      }

      if (tableName) {
        const countResult = await ggDB.query(
          `SELECT COUNT(*) as count FROM ${tableName} WHERE ($1::int IS NULL OR COALESCE(moderation_status_id, 1) = $1)`,
          [statusId],
        )
        totalCount = Number.parseInt(countResult.rows[0]?.count || "0")
      }
    }

    console.log(`✅ Found ${items.length} moderation items (${totalCount} total)`)

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error: unknown) {
    console.error("❌ Error fetching moderation items:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch moderation items",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// POST /api/moderation - Moderate content items (individual or bulk)
export async function POST(request: NextRequest) {
  try {
    const {
      items, // Array of {content_type, id, action, notes}
      action, // approve, reject, flag, delete
      notes,
      moderator_id,
    } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Items array is required" }, { status: 400 })
    }

    if (!action || !["approve", "reject", "flag", "delete"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Valid action is required (approve, reject, flag, delete)" },
        { status: 400 },
      )
    }

    console.log(`🔨 Moderating ${items.length} items with action: ${action}`)

    const statusMap: { [key: string]: number } = {
      approve: 2,
      reject: 5,
      flag: 3,
      delete: 4,
    }

    const newStatusId = statusMap[action]
    const moderatedAt = new Date().toISOString()

    const client = await ggDB.getClient()

    try {
      await client.query("BEGIN")

      const results = []

      for (const item of items) {
        const { content_type, id } = item
        const itemNotes = item.notes || notes || ""

        let tableName = ""
        switch (content_type) {
          case "image":
            tableName = "imageURLs"
            break
          case "review":
            tableName = "consumerReviews"
            break
          case "ad":
            tableName = "ads"
            break
          case "communication":
            tableName = "client_user_communications"
            break
          default:
            throw new Error(`Invalid content type: ${content_type}`)
        }

        // Update moderation status
        const updateQuery = `
          UPDATE ${tableName}
          SET 
            moderation_status_id = $1,
            moderated_by_employee_id = $2,
            moderation_notes = $3,
            moderated_at = $4
          WHERE id = $5
          RETURNING id
        `

        const updateResult = await client.query(updateQuery, [
          newStatusId,
          moderator_id || null,
          itemNotes,
          moderatedAt,
          id,
        ])

        if (updateResult.rows.length > 0) {
          results.push({
            content_type,
            id,
            action,
            success: true,
          })
        } else {
          results.push({
            content_type,
            id,
            action,
            success: false,
            error: "Item not found",
          })
        }
      }

      await client.query("COMMIT")

      const successCount = results.filter((r) => r.success).length
      console.log(`✅ Successfully moderated ${successCount}/${items.length} items`)

      return NextResponse.json({
        success: true,
        message: `Successfully ${action}ed ${successCount} items`,
        results,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error: unknown) {
    console.error("❌ Error moderating content:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to moderate content",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
