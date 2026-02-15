// =========================================
// Social Media OAuth — Connect Route
// Generates OAuth URL for each platform
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const OAUTH_CONFIGS: Record<string, {
    authUrl: string
    scopes: string[]
    responseType: string
}> = {
    instagram: {
        authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
        scopes: [
            'instagram_basic',
            'instagram_content_publish',
            'instagram_manage_insights',
            'pages_show_list',
            'pages_read_engagement',
        ],
        responseType: 'code',
    },
    tiktok: {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        scopes: ['user.info.basic', 'video.publish', 'video.upload'],
        responseType: 'code',
    },
    twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        responseType: 'code',
    },
    youtube: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        responseType: 'code',
    },
}

export async function POST(req: NextRequest) {
    try {
        const { platform, projectId } = await req.json()

        if (!platform || !OAUTH_CONFIGS[platform]) {
            return NextResponse.json(
                { error: 'Invalid platform' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const config = OAUTH_CONFIGS[platform]

        // Environment-based client IDs
        const clientIdKey = `${platform.toUpperCase()}_CLIENT_ID`
        const clientId = process.env[clientIdKey]

        if (!clientId) {
            return NextResponse.json(
                { error: `${platform} OAuth not configured. Set ${clientIdKey} environment variable.` },
                { status: 500 }
            )
        }

        // Build callback URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
        const redirectUri = `${baseUrl}/api/social/callback`

        // State parameter for security (includes platform + projectId + userId)
        const state = Buffer.from(JSON.stringify({
            platform,
            projectId,
            userId: user.id,
            ts: Date.now(),
        })).toString('base64url')

        // Build OAuth URL
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: config.responseType,
            scope: config.scopes.join(platform === 'tiktok' ? ',' : ' '),
            state,
        })

        // Platform-specific params
        if (platform === 'twitter') {
            params.set('code_challenge', 'challenge') // PKCE simplified
            params.set('code_challenge_method', 'plain')
        }
        if (platform === 'youtube') {
            params.set('access_type', 'offline')
            params.set('prompt', 'consent')
        }

        const authorizationUrl = `${config.authUrl}?${params.toString()}`

        return NextResponse.json({
            url: authorizationUrl,
            platform,
        })
    } catch (error) {
        console.error('OAuth connect error:', error)
        return NextResponse.json(
            { error: 'Failed to generate OAuth URL' },
            { status: 500 }
        )
    }
}
