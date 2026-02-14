import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Allow up to 5 minutes for video generation pipeline
export const maxDuration = 300

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE || 'https://n8n.srv1140504.hstgr.cloud'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { projectId, platform, prompt, brandName, title, influencerId, influencerName, influencerPersonality, influencerBackstory, productImageUrls } = body

        if (!projectId || !platform) {
            return NextResponse.json(
                { error: 'Project ID and platform are required' },
                { status: 400 }
            )
        }

        if (!['instagram', 'tiktok', 'linkedin', 'youtube'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be instagram, tiktok, linkedin, or youtube' },
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

        // Get project data to verify ownership
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Create video record in the database first
        const { data: videoRecord, error: videoInsertError } = await supabase
            .from('videos')
            .insert({
                project_id: projectId,
                influencer_id: influencerId || null,
                platform,
                status: 'scripting',
            })
            .select()
            .single()

        if (videoInsertError) {
            throw new Error(`Database error: ${videoInsertError.message}`)
        }

        // Proxy the request to n8n webhook (server-side, avoids CORS)
        const n8nResponse = await fetch(`${N8N_BASE}/webhook/generate-video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId,
                platform,
                prompt: prompt || `Create a ${platform} marketing video for "${project.name}". ${project.description || ''}`,
                brandName: brandName || project.name,
                title: title || `${project.name} - ${platform} Video`,
                videoId: videoRecord.id,
                influencerId: influencerId || null,
                influencerName: influencerName || null,
                influencerPersonality: influencerPersonality || null,
                influencerBackstory: influencerBackstory || null,
                productImageUrls: productImageUrls || [],
            }),
        })

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text().catch(() => '')
            // Mark video as failed
            await supabase
                .from('videos')
                .update({ status: 'failed', metadata: { error: `n8n error: ${n8nResponse.status} ${errorBody}` } })
                .eq('id', videoRecord.id)
            throw new Error(`n8n webhook error: ${n8nResponse.status} ${errorBody}`)
        }

        const result = await n8nResponse.json().catch(() => ({}))

        // Update video record with results from n8n
        if (result.videoUrl || result.script || result.title) {
            await supabase
                .from('videos')
                .update({
                    title: result.title || title,
                    script: result.script || '',
                    video_url: result.videoUrl || '',
                    thumbnail_url: result.thumbnailUrl || '',
                    duration_seconds: result.duration || 60,
                    status: 'ready',
                    metadata: {
                        hashtags: result.hashtags || [],
                        hook: result.hook || '',
                        cta: result.cta || '',
                    },
                })
                .eq('id', videoRecord.id)
        }

        return NextResponse.json({
            success: true,
            video: {
                id: videoRecord.id,
                ...result,
            },
        })
    } catch (error) {
        console.error('Video generation error:', error)

        // Update video status to 'failed' so it doesn't stay stuck
        try {
            const supabase = await createServerSupabaseClient()
            const { projectId } = await req.clone().json().catch(() => ({ projectId: null }))
            if (projectId) {
                await supabase
                    .from('videos')
                    .update({
                        status: 'failed',
                        metadata: { error: String(error) },
                    })
                    .eq('project_id', projectId)
                    .in('status', ['scripting', 'voicing', 'rendering'])
            }
        } catch (dbError) {
            console.error('Failed to update video status:', dbError)
        }

        return NextResponse.json(
            { error: 'Video generation failed', details: String(error) },
            { status: 500 }
        )
    }
}
