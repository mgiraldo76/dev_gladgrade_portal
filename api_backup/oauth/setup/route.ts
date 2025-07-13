import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.SMTP_OAUTH_CLIENT_ID

  if (!clientId) {
    return NextResponse.json({
      success: false,
      error: "OAuth Client ID not configured",
      setup_required: true,
    })
  }

  // Force localhost for local development
  const redirectUri = "http://localhost:3000/api/oauth/callback"

  // Try using /common/ instead of /organizations/ and simpler scope
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Mail.Send offline_access",
    response_mode: "query",
    state: "oauth_flow",
  })

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`

  return NextResponse.json({
    success: true,
    auth_url: authUrl,
    redirect_uri: redirectUri,
    environment: "local",
    client_id: clientId,
    account_to_use: "miguel.giraldo@gladgrade.com (admin account)",
    instructions: [
      "1. Visit the auth_url to authorize the application",
      "2. Sign in with miguel.giraldo@gladgrade.com (admin account)",
      "3. Grant permissions for Mail.Send",
      "4. You'll be redirected back to localhost:3000",
      "5. The system will exchange this for refresh tokens automatically",
    ],
    debug_info: {
      using_endpoint: "/common/ instead of /organizations/",
      scope_format: "simplified to Mail.Send offline_access",
    },
  })
}
