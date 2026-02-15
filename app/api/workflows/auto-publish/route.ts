// =========================================
// Auto-Publish Workflow
// Called by n8n cron to:
// 1. Check for due schedules
// 2. Generate new video
// 3. Publish to connected platforms
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateVideo } from '@/lib/workflows/autonomous-marketing'
import { publishToSocialMedia } from '@/lib/services/social-media'
import type { SocialPlatform } from '@/lib/services/social-media'
import type { ProjectAnalysis, MarketingConstitution } from '@/lib/services/abacus-ai'

// GET — Check which schedules are due (called by n8n every hour)
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()

        const now = new Date().toISOString()

        // Find active schedules that are due
        const { data: dueSchedules, error } = await supabase
            .from('publish_schedules')
            .select(`
                *,
                projects(id, name, url, analysis, marketing_constitution)
            `)
            .eq('is_active', true)
            .lte('next_run_at', now)
            .order('next_run_at', { ascending: true })
            .limit(5) // Process max 5 at a time

        if (error) {
            console.error('Failed to fetch due schedules:', error)
            return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
        }

        return NextResponse.json({
            dueSchedules: dueSchedules || [],
            count: dueSchedules?.length || 0,
            checkedAt: now,
        })
    } catch (error) {
        console.error('Schedule check error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST — Execute auto-publish for a specific schedule
export async function POST(req: NextRequest) {
    try {
        const { scheduleId, projectId } = await req.json()

        if (!scheduleId && !projectId) {
            return NextResponse.json(
                { error: 'scheduleId or projectId required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()

        // Get schedule + project data
        let schedule: Record<string, unknown> | null = null
        let project: Record<string, unknown> | null = null

        if (scheduleId) {
            const { data } = await supabase
                .from('publish_schedules')
                .select('*, projects(*)')
                .eq('id', scheduleId)
                .single()
            schedule = data
            project = (data as Record<string, unknown>)?.projects as Record<string, unknown>
        } else {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single()
            project = data
        }

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const analysis = project.analysis as ProjectAnalysis
        const constitution = project.marketing_constitution as MarketingConstitution

        if (!analysis || !constitution) {
            return NextResponse.json(
                { error: 'Project missing analysis or marketing constitution' },
                { status: 400 }
            )
        }

        // Get influencer for this project
        const { data: influencer } = await supabase
            .from('influencers')
            .select('*')
            .eq('project_id', project.id)
            .single()

        // Get screenshots
        const { data: screenshots } = await supabase
            .from('assets')
            .select('file_path')
            .eq('project_id', project.id as string)
            .eq('asset_type', 'screenshot')

        const screenshotUrls = (screenshots || []).map(s => s.file_path)

        // Determine platforms to publish
        const platforms: string[] = schedule
            ? (schedule.platforms as string[])
            : ['instagram']

        const results: Record<string, unknown>[] = []

        for (const platform of platforms) {
            try {
                console.log(`[AutoPublish] Generating video for ${project.name} → ${platform}`)

                // Step 1: Generate video
                const videoResult = await generateVideo(
                    analysis,
                    constitution,
                    (influencer || {}) as Record<string, unknown>,
                    '',
                    screenshotUrls,
                    platform as 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
                    project.id as string,
                    (step) => console.log(`[AutoPublish] ${step}`)
                )

                if (!videoResult.videoUrl) {
                    throw new Error('Video generation returned no URL')
                }

                // Save video to DB
                const { data: savedVideo } = await supabase
                    .from('videos')
                    .insert({
                        project_id: project.id,
                        user_id: schedule?.user_id || project.user_id,
                        platform,
                        title: videoResult.script.title,
                        script: videoResult.script.fullScript,
                        video_url: videoResult.videoUrl,
                        thumbnail_url: videoResult.thumbnailUrl,
                        status: 'ready',
                        metadata: {
                            hashtags: videoResult.script.hashtags,
                            source: 'auto_publish',
                            storyboard: videoResult.storyboard,
                        },
                    })
                    .select()
                    .single()

                // Step 2: Get social connection for this platform
                const userId = (schedule?.user_id || project.user_id) as string
                const { data: connection } = await supabase
                    .from('social_connections')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('platform', platform)
                    .single()

                if (!connection) {
                    console.warn(`[AutoPublish] No ${platform} connection for user, skipping publish`)
                    results.push({
                        platform,
                        videoGenerated: true,
                        published: false,
                        reason: 'No social connection',
                        videoId: savedVideo?.id,
                    })
                    continue
                }

                // Step 3: Publish
                console.log(`[AutoPublish] Publishing to ${platform}...`)
                const publishResult = await publishToSocialMedia(
                    platform as SocialPlatform,
                    {
                        accessToken: connection.access_token,
                        refreshToken: connection.refresh_token,
                        accountId: connection.account_id,
                    },
                    {
                        videoUrl: videoResult.videoUrl,
                        title: videoResult.script.title,
                        description: videoResult.script.fullScript,
                        hashtags: videoResult.script.hashtags || [],
                        thumbnailUrl: videoResult.thumbnailUrl,
                    }
                )

                // Save publish history
                await supabase.from('published_content').insert({
                    project_id: project.id,
                    user_id: userId,
                    content_type: 'video',
                    source_id: savedVideo?.id,
                    source_table: 'videos',
                    platform,
                    caption: videoResult.script.fullScript,
                    hashtags: videoResult.script.hashtags,
                    post_url: publishResult.postUrl,
                    post_id: publishResult.postId,
                    status: publishResult.success ? 'published' : 'failed',
                    published_at: publishResult.success ? new Date().toISOString() : null,
                    error_message: publishResult.error,
                })

                results.push({
                    platform,
                    videoGenerated: true,
                    published: publishResult.success,
                    postUrl: publishResult.postUrl,
                    videoId: savedVideo?.id,
                    error: publishResult.error,
                })
            } catch (err) {
                console.error(`[AutoPublish] Failed for ${platform}:`, err)
                results.push({
                    platform,
                    videoGenerated: false,
                    published: false,
                    error: String(err),
                })
            }
        }

        // Update schedule: set last_run_at and calculate next_run_at
        if (schedule) {
            const nextRun = calculateNextRunFromSchedule(schedule)
            await supabase
                .from('publish_schedules')
                .update({
                    last_run_at: new Date().toISOString(),
                    next_run_at: nextRun,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', schedule.id)
        }

        return NextResponse.json({
            success: true,
            results,
            project: { id: project.id, name: project.name },
        })
    } catch (error) {
        console.error('Auto-publish error:', error)
        return NextResponse.json(
            { error: 'Auto-publish failed', details: String(error) },
            { status: 500 }
        )
    }
}

// =========================================
// Calculate next run from schedule config
// =========================================
function calculateNextRunFromSchedule(schedule: Record<string, unknown>): string {
    const frequency = schedule.frequency as string
    const publishTimes = schedule.publish_times as unknown
    const now = new Date()

    if (frequency === 'daily' && Array.isArray(publishTimes)) {
        for (const time of publishTimes.sort()) {
            const [h, m] = (time as string).split(':').map(Number)
            const candidate = new Date(now)
            candidate.setUTCHours(h - 3, m, 0, 0) // Istanbul UTC+3
            if (candidate > now) return candidate.toISOString()
        }
        const [h, m] = (publishTimes[0] as string).split(':').map(Number)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setUTCHours(h - 3, m, 0, 0)
        return tomorrow.toISOString()
    }

    // Default: 24h from now
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
}
