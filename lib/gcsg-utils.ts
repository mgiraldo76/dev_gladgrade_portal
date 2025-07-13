// lib/gcsg-utils.ts - GCSG lookup utility with 4-hour caching and Firebase proxy

import { getAuth } from 'firebase/auth'

interface GCSGCacheEntry {
  score: number | null
  timestamp: number
  placeId: string
}

interface GCSGResponse {
  score: number | null
  cached: boolean
  error?: string
}

// In-memory cache for GCSG scores (4 hour TTL)
const gcsgCache = new Map<string, GCSGCacheEntry>()
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

/**
 * Get Firebase ID token for current user
 */
async function getFirebaseToken(): Promise<string | null> {
  try {
    const auth = getAuth()
    const user = auth.currentUser
    
    if (!user) {
      console.warn('⚠️ No authenticated user for GCSG request')
      return null
    }
    
    const token = await user.getIdToken()
    console.log('🔑 Firebase token obtained for GCSG request')
    return token
  } catch (error) {
    console.error('❌ Error getting Firebase token:', error)
    return null
  }
}

/**
 * Fetches GCSG score for a given placeId with 4-hour caching
 * @param placeId - Google Places ID
 * @returns Promise<GCSGResponse>
 */
export async function getGCSGScore(placeId: string): Promise<GCSGResponse> {
  if (!placeId || placeId.trim() === '') {
    return { score: null, cached: false, error: 'No place ID provided' }
  }

  const cacheKey = placeId.trim()
  const now = Date.now()

  // Check cache first
  const cached = gcsgCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`📋 GCSG cache hit for place ID: ${placeId}`)
    return { 
      score: cached.score, 
      cached: true 
    }
  }

  // Cache miss or expired - fetch from API via proxy
  try {
    console.log(`🌐 Fetching GCSG score for place ID: ${placeId}`)
    
    // Get Firebase token
    const token = await getFirebaseToken()
    if (!token) {
      return { 
        score: null, 
        cached: false, 
        error: 'Authentication required' 
      }
    }
    
    // Call proxy instead of external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/gcsg-score?placeId=${encodeURIComponent(placeId)}&indexed=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Pass Firebase token to proxy
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    )

    if (!response.ok) {
      console.warn(`⚠️ GCSG API returned ${response.status} for place ID: ${placeId}`)
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        return { 
          score: null, 
          cached: false, 
          error: 'Authentication failed - please refresh the page' 
        }
      }
      
      // Cache null result to avoid repeated failed requests
      gcsgCache.set(cacheKey, {
        score: null,
        timestamp: now,
        placeId
      })
      return { 
        score: null, 
        cached: false, 
        error: `API returned ${response.status}` 
      }
    }

    const data = await response.json()
    const score = typeof data.averageRating === 'number' ? data.averageRating : null

    // Cache the result
    gcsgCache.set(cacheKey, {
      score,
      timestamp: now,
      placeId
    })

    console.log(`✅ GCSG score fetched and cached: ${score} for place ID: ${placeId}`)
    
    return { 
      score, 
      cached: false 
    }

  } catch (error) {
    console.error(`❌ Error fetching GCSG score for place ID ${placeId}:`, error)
    
    // Cache null result to avoid repeated failed requests for a shorter time
    gcsgCache.set(cacheKey, {
      score: null,
      timestamp: now,
      placeId
    })

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Handle timeout specifically
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return { 
        score: null, 
        cached: false, 
        error: 'Request timeout - please try again' 
      }
    }

    return { 
      score: null, 
      cached: false, 
      error: errorMessage
    }
  }
}

/**
 * Fetches GCSG scores for multiple place IDs in parallel
 * @param placeIds - Array of Google Places IDs
 * @returns Promise<Map<string, GCSGResponse>>
 */
export async function getMultipleGCSGScores(placeIds: string[]): Promise<Map<string, GCSGResponse>> {
  const validPlaceIds = placeIds.filter(id => id && id.trim() !== '')
  
  if (validPlaceIds.length === 0) {
    return new Map()
  }

  console.log(`🔍 Fetching GCSG scores for ${validPlaceIds.length} place IDs`)

  // Fetch all scores in parallel
  const scorePromises = validPlaceIds.map(async (placeId) => {
    const result = await getGCSGScore(placeId)
    return [placeId, result] as [string, GCSGResponse]
  })

  const results = await Promise.all(scorePromises)
  return new Map(results)
}

/**
 * Clears expired entries from the cache
 */
export function cleanupGCSGCache(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of gcsgCache.entries()) {
    if ((now - entry.timestamp) >= CACHE_TTL) {
      gcsgCache.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired GCSG cache entries`)
  }
}

/**
 * Gets cache statistics
 */
export function getGCSGCacheStats(): { size: number; entries: GCSGCacheEntry[] } {
  return {
    size: gcsgCache.size,
    entries: Array.from(gcsgCache.values())
  }
}