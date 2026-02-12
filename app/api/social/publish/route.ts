// =========================================
// Social Media Publishing API Route
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { publishToSocialMedia } from '@/lib/services/social-media'
import type { SocialPlatform } from '@/lib/services/social-media'

export async function POST(req: NextRequest) {
    try {
        const { videoId, platform } = await req.json()

        if (!videoId || !platform) {
            return NextResponse.json(
                { error: 'Video ID and platform are required' },
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

        // Get video data
        const { data: video, error: videoError } = await supabase
            .from('videos')
            .select('*, projects(name)')
            .eq('id', videoId)
            .single()

        if (videoError || !video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            )
        }

        // Get social media credentials for the user + platform
        const { data: connection, error: connError } = await supabase
            .from('social_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .eq('is_active', true)
            .single()

        if (connError || !connection) {
            return NextResponse.json(
                { error: `No active ${platform} connection found. Please connect your account first.` },
                { status: 400 }
            )
        }

        // Publish
        const result = await publishToSocialMedia(
            platform as SocialPlatform,
            {
                accessToken: connection.access_token,
                refreshToken: connection.refresh_token,
                accountId: connection.account_id,
            },
            {
                videoUrl: video.video_url,
                title: video.title || '',
                description: video.script || '',
                hashtags: video.metadata?.hashtags || [],
                thumbnailUrl: video.thumbnail_url,
            }
        )

        // Record the publish attempt
        await supabase.from('publish_history').insert({
            video_id: videoId,
            user_id: user.id,
            platform,
            status: result.success ? 'published' : 'failed',
            post_id: result.postId,
            post_url: result.postUrl,
            error_message: result.error,
        })

        if (!result.success) {
            return NextResponse.json(
                { error: `Publishing failed: ${result.error}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            postId: result.postId,
            postUrl: result.postUrl,
            platform,
        })
    } catch (error) {
        console.error('Social media publish error:', error)
        return NextResponse.json(
            { error: 'Publishing failed', details: String(error) },
            { status: 500 }
        )
    }
}
