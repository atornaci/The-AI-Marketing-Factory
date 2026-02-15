// =========================================
// Social Media OAuth — Callback Route
// Receives authorization code, exchanges for
// access token, and saves to database
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface TokenResponse {
    access_token: string
    refresh_token?: string
    expires_in?: number
    open_id?: string  // TikTok
    token_type?: string
}

// Platform-specific token exchange configurations
const TOKEN_ENDPOINTS: Record<string, string> = {
    instagram: 'https://graph.facebook.com/v19.0/oauth/access_token',
    tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
    twitter: 'https://api.twitter.com/2/oauth2/token',
    youtube: 'https://oauth2.googleapis.com/token',
}

async function exchangeCodeForToken(
    platform: string,
    code: string,
    redirectUri: string
): Promise<TokenResponse> {
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`] || ''
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || ''
    const endpoint = TOKEN_ENDPOINTS[platform]

    if (!endpoint) throw new Error(`Unknown platform: ${platform}`)

    const params: Record<string, string> = {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    }

    // Twitter uses Basic auth
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    if (platform === 'twitter') {
        headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        // PKCE
        params.code_verifier = 'challenge'
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: new URLSearchParams(params),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token exchange failed: ${errorText}`)
    }

    return response.json()
}

async function getAccountInfo(
    platform: string,
    accessToken: string
): Promise<{ accountId: string; accountName: string }> {
    try {
        switch (platform) {
            case 'instagram': {
                // Get Instagram Business Account via Facebook Pages
                const pagesRes = await fetch(
                    `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
                )
                const pages = await pagesRes.json()
                const page = pages.data?.[0]
                if (page) {
                    const igRes = await fetch(
                        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{username}&access_token=${accessToken}`
                    )
                    const igData = await igRes.json()
                    const igAccount = igData.instagram_business_account
                    return {
                        accountId: igAccount?.id || page.id,
                        accountName: igAccount?.username || page.name || 'Instagram',
                    }
                }
                return { accountId: '', accountName: 'Instagram' }
            }
            case 'tiktok': {
                const res = await fetch(
                    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url',
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                )
                const data = await res.json()
                return {
                    accountId: data.data?.user?.open_id || '',
                    accountName: data.data?.user?.display_name || 'TikTok',
                }
            }
            case 'twitter': {
                const res = await fetch(
                    'https://api.twitter.com/2/users/me',
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                )
                const data = await res.json()
                return {
                    accountId: data.data?.id || '',
                    accountName: `@${data.data?.username || 'twitter'}`,
                }
            }
            case 'youtube': {
                // Get YouTube channel info via Google userinfo + YouTube API
                const userRes = await fetch(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                )
                const userData = await userRes.json()

                // Try to get channel name
                const channelRes = await fetch(
                    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                )
                const channelData = await channelRes.json()
                const channel = channelData.items?.[0]

                return {
                    accountId: channel?.id || userData.id || '',
                    accountName: channel?.snippet?.title || userData.name || 'YouTube',
                }
            }
            default:
                return { accountId: '', accountName: platform }
        }
    } catch (error) {
        console.error(`Failed to get ${platform} account info:`, error)
        return { accountId: '', accountName: platform }
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl
        const code = searchParams.get('code')
        const stateParam = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
            // User denied permission
            return NextResponse.redirect(new URL('/dashboard?oauth_error=denied', req.nextUrl.origin))
        }

        if (!code || !stateParam) {
            return NextResponse.redirect(new URL('/dashboard?oauth_error=missing_params', req.nextUrl.origin))
        }

        // Decode state
        let state: { platform: string; projectId: string; userId: string }
        try {
            state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
        } catch {
            return NextResponse.redirect(new URL('/dashboard?oauth_error=invalid_state', req.nextUrl.origin))
        }

        const { platform, projectId, userId } = state
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
        const redirectUri = `${baseUrl}/api/social/callback`

        // Exchange code for token
        const tokenData = await exchangeCodeForToken(platform, code, redirectUri)

        // Get account info
        const { accountId, accountName } = await getAccountInfo(platform, tokenData.access_token)

        // Save to database
        const supabase = await createServerSupabaseClient()

        // Upsert — update if connection already exists for this user+platform
        const { error: dbError } = await supabase
            .from('social_connections')
            .upsert(
                {
                    user_id: userId,
                    project_id: projectId,
                    platform,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token || null,
                    account_id: accountId,
                    account_name: accountName,
                    expires_at: tokenData.expires_in
                        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                        : null,
                    connected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,platform' }
            )

        if (dbError) {
            console.error('Failed to save social connection:', dbError)
            return NextResponse.redirect(
                new URL(`/project/${projectId}?oauth_error=save_failed`, req.nextUrl.origin)
            )
        }

        // Success — redirect back to project page
        return NextResponse.redirect(
            new URL(`/project/${projectId}?oauth_success=${platform}`, req.nextUrl.origin)
        )
    } catch (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(
            new URL('/dashboard?oauth_error=callback_failed', req.nextUrl.origin)
        )
    }
}
