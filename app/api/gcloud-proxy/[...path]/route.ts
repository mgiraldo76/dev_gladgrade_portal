// app/api/gcloud-proxy/[...path]/route.ts
// Generic Google Cloud API proxy with Firebase token validation

import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Base URL for your Google Cloud API
const GCLOUD_API_BASE_URL = "https://gladgrade-api-360532994710.us-east4.run.app/api"

// Initialize Firebase Admin SDK (only once)
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    console.log('🔥 Firebase Admin initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error)
  }
}

/**
 * Validate Firebase ID token from Authorization header
 */
async function validateFirebaseToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Authorization header found')
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (!token) {
      console.log('❌ Empty token in Authorization header')
      return null
    }

    // Validate token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(token)
    console.log(`✅ Token validated for user: ${decodedToken.uid}`)
    
    return token // Return the original token to forward to Google Cloud API
  } catch (error) {
    console.error('❌ Token validation failed:', error)
    return null
  }
}

/**
 * Generic proxy handler for all HTTP methods
 */
async function handleRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Validate Firebase token
    const validatedToken = await validateFirebaseToken(request)
    if (!validatedToken) {
      return NextResponse.json(
        { error: 'Invalid or missing Firebase token' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    }

    const { path } = params
    
    // Reconstruct the target URL
    const targetPath = path.join('/')
    const url = new URL(request.url)
    const queryParams = url.searchParams.toString()
    const targetUrl = `${GCLOUD_API_BASE_URL}/${targetPath}${queryParams ? `?${queryParams}` : ''}`
    
    console.log(`🌐 Proxying ${request.method} request to: ${targetUrl}`)
    
    // Prepare headers with the validated Firebase token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validatedToken}`, // Forward the validated token
    }
    
    // Copy relevant headers from the original request
    const userAgent = request.headers.get('user-agent')
    if (userAgent) {
      headers['User-Agent'] = userAgent
    }
    
    // Prepare request body for POST/PUT/PATCH requests
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const requestBody = await request.json()
        body = JSON.stringify(requestBody)
        console.log(`📤 Request body:`, requestBody)
      } catch (error) {
        console.log(`📤 No JSON body or body parsing failed:`, error)
      }
    }
    
    // Make the request to Google Cloud API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    })
    
    console.log(`📥 Response status: ${response.status}`)
    
    // Get response data
    let responseData
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      responseData = await response.text()
    }
    
    // Return the response with proper CORS headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
    
  } catch (error) {
    console.error(`❌ Proxy error:`, error)
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context)
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context)
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context)
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return handleRequest(request, context)
}