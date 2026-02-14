import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateVideo } from '@/lib/workflows/autonomous-marketing'
import type { ProjectAnalysis, MarketingConstitution } from '@/lib/services/abacus-ai'

// Allow up to 5 minutes for video generation pipeline
export const maxDuration = 300

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

        // Get influencer data if available
        let influencerProfile: Record<string, unknown> = {}
        let voiceId = ''
        if (influencerId) {
            const { data: influencer } = await supabase
                .from('ai_influencers')
                .select('*')
                .eq('id', influencerId)
                .single()
            if (influencer) {
                influencerProfile = {
                    name: influencer.name,
                    personality: influencer.personality,
                    backstory: influencer.backstory,
                    appearanceDescription: influencer.appearance_description,
                    visualProfile: influencer.visual_profile,
                    avatarUrl: influencer.avatar_url,
                }
                voiceId = influencer.voice_id || ''
            }
        } else if (influencerName) {
            // Fallback: use inline influencer info from request body
            influencerProfile = {
                name: influencerName,
                personality: influencerPersonality || '',
                backstory: influencerBackstory || '',
            }
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

        console.log(`[API] Starting direct video pipeline for video ${videoRecord.id}`)

        // Build analysis object from project data
        const analysis: ProjectAnalysis = {
            name: project.name || brandName || 'Brand',
            description: project.description || '',
            valueProposition: project.value_proposition || '',
            targetAudience: project.target_audience || { demographics: [], interests: [], painPoints: [] },
            competitors: project.competitors || [],
            brandTone: project.brand_tone || 'professional',
            keywords: project.keywords || [],
        }

        // Build constitution object from project data
        const constitution: MarketingConstitution = {
            brandVoice: project.brand_voice || project.tone_of_voice || analysis.brandTone || 'professional',
            contentPillars: project.content_pillars || [],
            messagingFramework: project.messaging_framework || {
                hook: '',
                problem: '',
                solution: '',
                cta: '',
            },
            visualGuidelines: project.visual_guidelines || {
                colorPalette: [],
                mood: '',
                style: '',
            },
            brandPersona: project.brand_persona || `${analysis.name} is a ${project.industry || 'innovative'} brand`,
            visualDna: project.visual_dna || '',
        }

        try {
            // Update status to show we're in the script phase
            await supabase
                .from('videos')
                .update({ status: 'scripting' })
                .eq('id', videoRecord.id)

            // Run the full video generation pipeline directly
            const result = await generateVideo(
                analysis,
                constitution,
                influencerProfile,
                voiceId,
                productImageUrls || [],
                platform,
                projectId,
                async (step: string) => {
                    console.log(`[API] Video progress: ${step}`)
                    // Update status dynamically
                    let status = 'scripting'
                    if (step.includes('voice') || step.includes('narration') || step.includes('Audio')) status = 'voicing'
                    if (step.includes('Render') || step.includes('video') || step.includes('Video')) status = 'rendering'
                    if (step.includes('Upload')) status = 'rendering'

                    await supabase
                        .from('videos')
                        .update({ status })
                        .eq('id', videoRecord.id)
                }
            )

            // Update video record with the results
            await supabase
                .from('videos')
                .update({
                    title: result.script?.title || title || `${analysis.name} - ${platform} Video`,
                    script: result.script?.fullScript || '',
                    video_url: result.videoUrl || '',
                    thumbnail_url: result.thumbnailUrl || '',
                    duration_seconds: result.script?.estimatedDuration || 30,
                    status: result.videoUrl ? 'ready' : 'script_ready',
                    metadata: {
                        hashtags: result.script?.hashtags || [],
                        hook: result.script?.hook || '',
                        cta: result.script?.cta || '',
                        storyboard: result.storyboard ? { sceneCount: result.storyboard.scenes?.length } : null,
                    },
                })
                .eq('id', videoRecord.id)

            console.log(`[API] ✅ Video pipeline complete for ${videoRecord.id}`)

            return NextResponse.json({
                success: true,
                video: {
                    id: videoRecord.id,
                    title: result.script?.title || title,
                    script: result.script?.fullScript || '',
                    videoUrl: result.videoUrl || '',
                    thumbnailUrl: result.thumbnailUrl || '',
                    hashtags: result.script?.hashtags || [],
                    hook: result.script?.hook || '',
                    cta: result.script?.cta || '',
                },
            })
        } catch (pipelineError) {
            console.error('[API] Pipeline error:', pipelineError)
            // Mark video as failed
            await supabase
                .from('videos')
                .update({
                    status: 'failed',
                    metadata: { error: String(pipelineError) },
                })
                .eq('id', videoRecord.id)
            throw pipelineError
        }
    } catch (error) {
        console.error('Video generation error:', error)

        return NextResponse.json(
            { error: 'Video generation failed', details: String(error) },
            { status: 500 }
        )
    }
}
