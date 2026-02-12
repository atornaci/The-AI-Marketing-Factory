import { NextRequest, NextResponse } from 'next/server'
import { generateVideo } from '@/lib/workflows/autonomous-marketing'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { projectId, platform } = await req.json()

        if (!projectId || !platform) {
            return NextResponse.json(
                { error: 'Project ID and platform are required' },
                { status: 400 }
            )
        }

        if (!['instagram', 'tiktok', 'linkedin'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be instagram, tiktok, or linkedin' },
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

        // Get project data
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

        // Get influencer data
        const { data: influencer } = await supabase
            .from('ai_influencers')
            .select('*')
            .eq('project_id', projectId)
            .eq('status', 'ready')
            .single()

        // Get project screenshots
        const { data: assets } = await supabase
            .from('assets')
            .select('*')
            .eq('project_id', projectId)
            .eq('asset_type', 'screenshot')

        const screenshotUrls = (assets || []).map(a => a.file_path)

        // Create video record
        const { data: videoRecord, error: videoInsertError } = await supabase
            .from('videos')
            .insert({
                project_id: projectId,
                influencer_id: influencer?.id || null,
                platform,
                status: 'scripting',
            })
            .select()
            .single()

        if (videoInsertError) {
            throw new Error(`Database error: ${videoInsertError.message}`)
        }

        // Run video generation workflow
        // Update status to 'voicing' before starting
        await supabase
            .from('videos')
            .update({ status: 'voicing' })
            .eq('id', videoRecord.id)

        const result = await generateVideo(
            {
                name: project.name,
                description: project.description || '',
                valueProposition: project.value_proposition || '',
                targetAudience: project.target_audience || { demographics: [], interests: [], painPoints: [] },
                competitors: project.competitors || [],
                brandTone: 'professional',
                keywords: [],
            },
            project.marketing_constitution || {
                brandVoice: 'Professional',
                contentPillars: [],
                messagingFramework: { hook: '', problem: '', solution: '', cta: '' },
                visualGuidelines: { colorPalette: [], mood: '', style: '' },
            },
            influencer?.visual_profile || {},
            influencer?.voice_id || '',
            screenshotUrls,
            platform,
            projectId
        )

        // Update status to 'rendering' before video gen
        await supabase
            .from('videos')
            .update({ status: 'rendering' })
            .eq('id', videoRecord.id)

        // Determine final status based on video URL availability
        const finalStatus = result.videoUrl ? 'ready' : 'rendering'

        // Update video record with results
        const { error: updateError } = await supabase
            .from('videos')
            .update({
                title: result.script.title,
                script: result.script.fullScript,
                video_url: result.videoUrl,
                thumbnail_url: result.thumbnailUrl,
                duration_seconds: result.script.estimatedDuration,
                status: finalStatus,
                metadata: {
                    hashtags: result.script.hashtags,
                    hook: result.script.hook,
                    cta: result.script.cta,
                },
            })
            .eq('id', videoRecord.id)

        if (updateError) {
            throw new Error(`Update error: ${updateError.message}`)
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

        // Update video status to 'failed' so it doesn't stay stuck in 'İşleniyor'
        try {
            const supabase = await createServerSupabaseClient()
            // Find the most recent scripting/rendering video for this project and mark it failed
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
