import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const influencerId = searchParams.get('influencerId')

        let query = supabase
            .from('videos')
            .select('id, title, video_url, thumbnail_url, platform, script, metadata, status, created_at, influencer_id')
            .eq('status', 'ready')
            .order('created_at', { ascending: false })

        if (influencerId) {
            query = query.eq('influencer_id', influencerId)
        }

        const { data: videos, error } = await query.limit(50)

        if (error) {
            console.error('Failed to fetch videos:', error)
            return NextResponse.json(
                { error: 'Failed to fetch videos' },
                { status: 500 }
            )
        }

        const formattedVideos = (videos || []).map(v => ({
            id: v.id,
            title: v.title || 'Video',
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url,
            platform: v.platform,
            script: v.script,
            postCaption: (v.metadata as Record<string, unknown>)?.postCaption || '',
            hashtags: (v.metadata as Record<string, unknown>)?.hashtags || [],
            createdAt: v.created_at,
        }))

        return NextResponse.json({ videos: formattedVideos })
    } catch (error) {
        console.error('Videos API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
