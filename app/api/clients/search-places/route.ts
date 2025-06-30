
// app/api/clients/search-places/route.ts
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const location = searchParams.get("location") || "Miami, FL"

  if (!query) {
    return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
  }

  try {
    console.log(`🔍 Searching Google Places for: ${query} near ${location}`)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.log("⚠️ Google Places API key not configured, returning enhanced mock data")

      // ✅ ENHANCED: Mock data with address_components including subpremise
      const mockResults = [
        {
          place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
          name: query,
          formatted_address: `123 Main St Suite 450, Miami, FL 33132, USA`,
          business_status: "OPERATIONAL",
          rating: 4.2,
          user_ratings_total: 156,
          types: ["restaurant", "food", "establishment"],
          geometry: {
            location: { lat: 25.7617, lng: -80.1918 },
          },
          // ✅ NEW: Address components including subpremise for testing
          address_components: [
            {
              long_name: "123",
              short_name: "123",
              types: ["street_number"]
            },
            {
              long_name: "Main Street",
              short_name: "Main St",
              types: ["route"]
            },
            {
              long_name: "Suite 450",
              short_name: "Suite 450",
              types: ["subpremise"]
            },
            {
              long_name: "Miami",
              short_name: "Miami",
              types: ["locality", "political"]
            },
            {
              long_name: "Florida",
              short_name: "FL",
              types: ["administrative_area_level_1", "political"]
            },
            {
              long_name: "United States",
              short_name: "US",
              types: ["country", "political"]
            },
            {
              long_name: "33132",
              short_name: "33132",
              types: ["postal_code"]
            }
          ]
        },
      ]

      return NextResponse.json({
        success: true,
        data: mockResults,
        source: "mock_data",
      })
    }

    // ✅ ENHANCED: Get search results first
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&key=${apiKey}`
    )

    const searchData = await searchResponse.json()

    if (searchData.status !== "OK") {
      throw new Error(`Google Places API error: ${searchData.status}`)
    }

    // ✅ ENHANCED: Get detailed place information with address_components
    const enhancedResults = await Promise.all(
      searchData.results.slice(0, 10).map(async (place: any) => {
        try {
          // Get place details with address_components
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=address_components&key=${apiKey}`
          )
          
          const detailsData = await detailsResponse.json()
          
          if (detailsData.status === "OK" && detailsData.result.address_components) {
            return {
              ...place,
              address_components: detailsData.result.address_components
            }
          }
        } catch (error) {
          console.error("Failed to get place details for", place.place_id, error)
        }
        
        // Return original place if details fail
        return place
      })
    )

    console.log(`✅ Found ${enhancedResults.length} places with enhanced address data`)

    return NextResponse.json({
      success: true,
      data: enhancedResults,
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