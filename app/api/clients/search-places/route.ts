import { type NextRequest, NextResponse } from "next/server"

// Google Places API integration for business claiming
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const location = searchParams.get("location") || "Miami, FL"

  if (!query) {
    return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
  }

  try {
    console.log(`🔍 Searching Google Places for: ${query} near ${location}`)

    // Note: You'll need to add GOOGLE_PLACES_API_KEY to your environment variables
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.log("⚠️ Google Places API key not configured, returning mock data")

      // Return mock data for development
      const mockResults = [
        {
          place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
          name: query,
          formatted_address: `123 Main St, ${location}`,
          business_status: "OPERATIONAL",
          rating: 4.2,
          user_ratings_total: 156,
          types: ["restaurant", "food", "establishment"],
          geometry: {
            location: { lat: 25.7617, lng: -80.1918 },
          },
          photos: [
            {
              photo_reference: "mock_photo_reference",
              height: 400,
              width: 400,
            },
          ],
        },
      ]

      return NextResponse.json({
        success: true,
        data: mockResults,
        source: "mock_data",
      })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&key=${apiKey}`,
    )

    const data = await response.json()

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    console.log(`✅ Found ${data.results.length} places`)

    return NextResponse.json({
      success: true,
      data: data.results.slice(0, 10), // Limit to 10 results
      source: "google_places",
    })
  } catch (error: unknown) {
    console.error("❌ Error searching places:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search places",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
