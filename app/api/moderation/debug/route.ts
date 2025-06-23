import { type NextRequest, NextResponse } from "next/server"
import { ggDB, corpDB } from "@/lib/database-multi"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug: Checking moderation data...")

    // Check if moderation_statuses table exists in corp database
    const statusCheck = await corpDB.query(`
      SELECT * FROM moderation_statuses ORDER BY id;
    `)
    console.log("📊 Moderation statuses:", statusCheck.rows)

    // Check if moderation fields exist in tables
    const imageCheck = await ggDB.query(`
      SELECT 
        COUNT(*) as total_images,
        COUNT(moderation_status_id) as with_moderation_status,
        moderation_status_id,
        COUNT(*) as count_by_status
      FROM imageURLs 
      GROUP BY moderation_status_id
      ORDER BY moderation_status_id;
    `)
    console.log("🖼️ Images moderation status:", imageCheck.rows)

    const reviewCheck = await ggDB.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(moderation_status_id) as with_moderation_status,
        moderation_status_id,
        COUNT(*) as count_by_status
      FROM consumerReviews 
      GROUP BY moderation_status_id
      ORDER BY moderation_status_id;
    `)
    console.log("📝 Reviews moderation status:", reviewCheck.rows)

    const adCheck = await ggDB.query(`
      SELECT 
        COUNT(*) as total_ads,
        COUNT(moderation_status_id) as with_moderation_status,
        moderation_status_id,
        COUNT(*) as count_by_status
      FROM ads 
      GROUP BY moderation_status_id
      ORDER BY moderation_status_id;
    `)
    console.log("📢 Ads moderation status:", adCheck.rows)

    // Get sample data from each table
    const sampleImages = await ggDB.query(`
      SELECT id, imageurl, datecreated, moderation_status_id FROM imageURLs LIMIT 3;
    `)
    console.log("📋 Sample images:", sampleImages.rows)

    const sampleReviews = await ggDB.query(`
      SELECT id, review, datecreated, moderation_status_id FROM consumerReviews LIMIT 3;
    `)
    console.log("📋 Sample reviews:", sampleReviews.rows)

    // Check table structures
    const imageStructure = await ggDB.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'imageurls'
      AND column_name LIKE '%moderation%'
      ORDER BY column_name;
    `)
    console.log("🏗️ Image table moderation columns:", imageStructure.rows)

    return NextResponse.json({
      success: true,
      debug: {
        moderation_statuses: statusCheck.rows,
        image_stats: imageCheck.rows,
        review_stats: reviewCheck.rows,
        ad_stats: adCheck.rows,
        sample_images: sampleImages.rows,
        sample_reviews: sampleReviews.rows,
        image_columns: imageStructure.rows,
      },
    })
  } catch (error: unknown) {
    console.error("❌ Debug error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
