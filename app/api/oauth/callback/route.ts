import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.json({
      success: false,
      error: `OAuth error: ${error}`,
      description: searchParams.get("error_description"),
    })
  }

  if (!code) {
    return NextResponse.json({
      success: false,
      error: "No authorization code received",
    })
  }

  // Determine the correct redirect URI (same logic as setup)
  const getRedirectUri = () => {
    if (process.env.NODE_ENV === "production") {
      return "https://portal.gladgrade.com/api/oauth/callback"
    } else if (process.env.NEXT_PUBLIC_ENV === "development") {
      return "https://dev.portal.gladgrade.com/api/oauth/callback"
    } else {
      return "http://localhost:3000/api/oauth/callback"
    }
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SMTP_OAUTH_CLIENT_ID!,
        client_secret: process.env.SMTP_OAUTH_CLIENT_SECRET!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: getRedirectUri(),
        scope: "https://outlook.office365.com/SMTP.Send offline_access",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Failed to exchange code for tokens",
        details: tokens,
      })
    }

    // Return the tokens (in production, you'd save these securely)
    return NextResponse.json({
      success: true,
      message: "OAuth setup successful!",
      environment: process.env.NODE_ENV,
      redirect_uri: getRedirectUri(),
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
      next_steps: [
        "Add these environment variables to your .env.local:",
        `SMTP_OAUTH_ACCESS_TOKEN=${tokens.access_token}`,
        `SMTP_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`,
        "Restart your application to use OAuth2 authentication",
      ],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to process OAuth callback",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
