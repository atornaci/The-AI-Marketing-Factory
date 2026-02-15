// =========================================
// Autonomous Marketing Workflow Engine
// Orchestrates the full pipeline:
// URL → Analysis → Influencer → Video
// =========================================

import { abacusAI } from '@/lib/services/abacus-ai'
import * as klingAI from '@/lib/services/kling-ai'
import { captureWebsite, uploadScreenshot, scrapeWebsiteInfo, uploadMediaToStorage } from '@/lib/services/screenshot'
import type { ProjectAnalysis, MarketingConstitution, VideoScript, InfluencerProfile } from '@/lib/services/abacus-ai'
import type { Storyboard } from '@/lib/types/storyboard'

export interface WorkflowStatus {
    id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    currentStep: string
    stepsCompleted: string[]
    error?: string
}

export interface OnboardingResult {
    projectId: string
    analysis: ProjectAnalysis
    constitution: MarketingConstitution
    screenshots: string[]
}

export interface InfluencerResult {
    influencerId: string
    profile: InfluencerProfile
    voiceId: string
    voiceName: string
    avatarUrl: string
}

export interface VideoResult {
    videoId: string
    videoUrl: string
    thumbnailUrl: string
    script: VideoScript
    storyboard?: Storyboard
}

// =========================================
// Phase 1: Project Onboarding
// =========================================
export async function onboardProject(
    url: string,
    userId: string,
    onProgress?: (step: string) => void
): Promise<OnboardingResult> {
    const steps = [
        'Validating URL...',
        'Capturing screenshots...',
        'Scraping website content...',
        'Analyzing project with AI...',
        'Generating Marketing Constitution...',
        'Saving to database...',
    ]

    let currentStep = 0
    const report = (step: string) => {
        onProgress?.(step)
        currentStep++
    }

    // Step 1: Validate URL
    report(steps[0])
    const validUrl = normalizeUrl(url)

    // Step 2: Capture screenshots
    report(steps[1])
    let screenshotUrls: string[] = []
    try {
        const buffer = await captureWebsite(validUrl)
        const screenshotUrl = await uploadScreenshot(buffer, 'temp', `screenshot-${Date.now()}.png`)
        screenshotUrls = [screenshotUrl]
    } catch (error) {
        console.error('Screenshot capture failed:', error)
    }

    // Step 3: Scrape website
    report(steps[2])
    const websiteInfo = await scrapeWebsiteInfo(validUrl)

    // Step 4: Analyze with AI
    report(steps[3])
    const analysis = await abacusAI.analyzeProject(validUrl, websiteInfo.content)

    // Step 5: Generate Marketing Constitution
    report(steps[4])
    const constitution = await abacusAI.generateMarketingConstitution(analysis)

    // Step 6: Save to database (done by the API route)
    report(steps[5])

    return {
        projectId: '', // Will be set by API route after DB insert
        analysis,
        constitution,
        screenshots: screenshotUrls,
    }
}

// =========================================
// Phase 2: AI Influencer Creation
// =========================================
export async function createInfluencer(
    analysis: ProjectAnalysis,
    constitution: MarketingConstitution,
    onProgress?: (step: string) => void
): Promise<InfluencerResult> {
    const report = (step: string) => onProgress?.(step)

    // Step 1: Generate influencer profile
    report('Generating influencer personality...')
    const profile = await abacusAI.generateInfluencerProfile(analysis, constitution)

    // Step 2: Generate unique avatar image (with Visual DNA for brand-consistent look)
    report('Generating influencer photo...')
    const avatarUrl = await abacusAI.generateInfluencerAvatar(profile, constitution.visualDna)

    // Step 3: Voice ID no longer needed (Kling AI handles audio natively)
    // Kept in the return type for backward compatibility

    return {
        influencerId: '', // Will be set by API route
        profile,
        voiceId: '',
        voiceName: 'Kling AI Native',
        avatarUrl,
    }
}

// =========================================
// Phase 3: Video Generation (Kling AI + Master Prompt)
// =========================================
export async function generateVideo(
    analysis: ProjectAnalysis,
    constitution: MarketingConstitution,
    influencerProfile: Record<string, unknown>,
    voiceId: string,
    screenshotUrls: string[],
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
    projectId: string,
    onProgress?: (step: string) => void
): Promise<VideoResult> {
    const report = (step: string) => onProgress?.(step)

    // Step 0.1: Generate Hook Variations
    report('Generating 5 hook variations...')
    let storyboard: Storyboard | undefined
    try {
        const hooks = await abacusAI.generateHookVariations(analysis, platform)
        console.log(`[Workflow] ✅ ${hooks.length} hooks generated`)

        // Step 0.2: Generate Storyboard
        report('Creating cinematic storyboard...')
        storyboard = await abacusAI.generateStoryboard(analysis, constitution, hooks, platform)
        console.log(`[Workflow] ✅ Storyboard: ${storyboard.scenes.length} scenes, ${storyboard.totalDuration}s`)
    } catch (error) {
        console.warn('[Workflow] ⚠️ Hook/Storyboard generation failed, continuing with script:', error)
    }

    // Step 1: Generate script (kept as fallback / metadata)
    report('Writing viral video script...')
    let script: VideoScript
    try {
        script = await abacusAI.generateVideoScript(analysis, constitution, platform)
        console.log(`[Workflow] ✅ Script generated: "${script.title}"`)
    } catch (error) {
        console.error('[Workflow] ❌ Script generation failed:', error)
        script = {
            title: `${analysis.name} - ${platform} Ad`,
            hook: `Discover ${analysis.name}!`,
            body: analysis.valueProposition || analysis.description,
            fullScript: `${analysis.name}: ${analysis.valueProposition || analysis.description}`,
            cta: 'Try it now!',
            hashtags: [analysis.name.replace(/\s+/g, ''), platform, 'ai'],
            estimatedDuration: 10,
        }
    }

    // Step 2: Generate Master Prompt via Claude (Creative Director)
    report('🎬 Master Prompt: Claude is designing your video...')
    let masterPrompt: klingAI.MasterPromptOutput | null = null
    try {
        const vp = influencerProfile?.visualProfile as Record<string, string> | undefined
        const persona = (influencerProfile?.appearanceDescription as string)
            || `${vp?.gender === 'male' ? 'Man' : 'Woman'}, ${vp?.ageRange || '28'}, ${vp?.style || 'professional'}`

        // Fetch previous themes from the script title to avoid repetition
        const previousThemes = storyboard?.scenes?.map(s =>
            (s as unknown as Record<string, unknown>).visualDescription as string
        ).filter(Boolean) || []

        const masterPromptInput: klingAI.MasterPromptInput = {
            projectName: analysis.name || '',
            projectType: analysis.category || analysis.industry || '',
            projectDescription: analysis.description || analysis.valueProposition || '',
            targetAudience: (analysis as Record<string, unknown>).targetAudience as string || 'General audience',
            desiredVideoMood: constitution?.brandPersona || 'Professional and engaging',
            influencerBasePersona: persona,
            previousVideoThemes: previousThemes,
            uniqueSellingPoints: (analysis as Record<string, unknown>).uniqueFeatures as string[]
                || [analysis.valueProposition || ''].filter(Boolean),
            platform: platform,
            language: 'Turkish',
        }

        // Call Claude to generate the Master Prompt
        const systemRole = klingAI.buildMasterPromptSystemRole()
        const userInput = klingAI.buildMasterPromptUserInput(masterPromptInput)
        const claudeResponse = await abacusAI.chatCompletion(systemRole, userInput, 'creative')
        masterPrompt = klingAI.parseMasterPromptResponse(claudeResponse)

        console.log(`[Workflow] ✅ Master Prompt generated:`)
        console.log(`[Workflow]   Theme: ${masterPrompt.themeTag}`)
        console.log(`[Workflow]   Video prompt: ${masterPrompt.videoPrompt.substring(0, 100)}...`)
        console.log(`[Workflow]   Script: ${masterPrompt.videoScript.substring(0, 100)}...`)
    } catch (error) {
        console.error('[Workflow] ❌ Master Prompt generation failed, using fallback:', error)
    }

    // Determine final prompt and script
    const finalVideoPrompt = masterPrompt?.videoPrompt || script.fullScript
    const finalNegativePrompt = masterPrompt?.negativePrompt
        || 'cartoon, 3d render, anime, blurry, distorted, low quality, glitch, extra fingers, CGI, plastic skin'
    const finalScript = masterPrompt?.videoScript || script.fullScript

    // Update script with master prompt output
    if (masterPrompt) {
        script.fullScript = finalScript
        script.hook = finalScript.split('|')[0]?.trim() || script.hook
    }

    // Step 3: Generate video with Kling AI via fal.ai
    report('🎥 Kling AI (via fal.ai): Generating cinematic video...')
    let videoUrl = ''
    let thumbnailUrl = ''

    // Platform-specific settings
    const aspectRatio = platform === 'linkedin' ? '16:9' as const : '9:16' as const

    try {
        // PRIMARY: Use fal.ai Kling V2.1 Pro (billed through fal.ai account)
        console.log('[Workflow] Using fal.ai Kling V2.1 Pro as primary video engine...')
        const falResult = await abacusAI.generateVideo({
            script: finalScript,
            audioUrl: '',
            influencerProfile,
            screenshotUrls,
            platform,
            visualDna: constitution?.visualDna,
            brandPersona: constitution?.brandPersona,
            brandColors: constitution?.visualGuidelines?.colorPalette?.join(', '),
            scenes: storyboard?.scenes,
            avatarUrl: (influencerProfile?.avatarUrl as string) || '',
        })
        videoUrl = falResult.videoUrl
        thumbnailUrl = falResult.thumbnailUrl
        console.log(`[Workflow] ✅ fal.ai Kling video: ${videoUrl || '(none)'}`)

        // Upload to Supabase for permanent storage
        if (videoUrl) {
            report('Uploading video to storage...')
            try {
                const videoResponse = await fetch(videoUrl)
                if (videoResponse.ok) {
                    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
                    const uploadedUrl = await uploadMediaToStorage(
                        videoBuffer,
                        projectId,
                        `video-${platform}-${Date.now()}.mp4`,
                        'video/mp4'
                    )
                    if (uploadedUrl) {
                        videoUrl = uploadedUrl
                        console.log(`[Workflow] ✅ Video uploaded to Supabase: ${videoUrl}`)
                    }
                }
            } catch (uploadError) {
                console.error('[Workflow] ⚠️ Video upload failed, using fal.ai URL directly:', uploadError)
            }
        }

        // If fal.ai didn't return a video, try direct Kling API as fallback
        if (!videoUrl) {
            throw new Error('fal.ai Kling returned no video URL')
        }
    } catch (error) {
        console.error('[Workflow] ❌ fal.ai Kling failed:', error)

        // FALLBACK: Try direct Kling API (requires KLING_ACCESS_KEY credits)
        console.log('[Workflow] Attempting direct Kling API fallback...')
        try {
            const videoResult = await klingAI.generateVideo({
                prompt: `${finalVideoPrompt}\n\nDIALOGUE (spoken by the person in the video, in Turkish):\n"${finalScript}"`,
                negativePrompt: finalNegativePrompt,
                duration: 10,
                aspectRatio: aspectRatio,
                avatarUrl: (influencerProfile?.avatarUrl as string) || '',
                model: 'kling-v2-1',
                mode: 'pro',
                cfgScale: 0.5,
            })
            videoUrl = videoResult.videoUrl
            console.log(`[Workflow] ✅ Direct Kling API video: ${videoUrl}`)

            // Upload direct Kling video too
            if (videoUrl) {
                try {
                    const videoResponse = await fetch(videoUrl)
                    if (videoResponse.ok) {
                        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
                        const uploadedUrl = await uploadMediaToStorage(
                            videoBuffer,
                            projectId,
                            `video-${platform}-${Date.now()}.mp4`,
                            'video/mp4'
                        )
                        if (uploadedUrl) {
                            videoUrl = uploadedUrl
                        }
                    }
                } catch { /* use Kling URL directly */ }
            }
        } catch (fallbackError) {
            console.error('[Workflow] ❌ Direct Kling API also failed:', fallbackError)
        }
    }

    // Step 4: Generate thumbnail (using Master Prompt image prompt if available)
    if (!thumbnailUrl && masterPrompt?.imagePrompt) {
        report('Generating thumbnail...')
        try {
            thumbnailUrl = await abacusAI.generateVideoThumbnail(
                masterPrompt.imagePrompt,
                masterPrompt.videoPrompt.substring(0, 200),
                platform,
                constitution?.visualDna
            )
        } catch { /* ignore thumbnail errors */ }
    }

    return {
        videoId: '', // Will be set by API route
        videoUrl,
        thumbnailUrl,
        script,
        storyboard,
    }
}

// =========================================
// Full Pipeline: Run Everything
// =========================================
export async function runFullPipeline(
    url: string,
    userId: string,
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
    projectId: string,
    onProgress?: (step: string) => void
): Promise<{
    project: OnboardingResult
    influencer: InfluencerResult
    video: VideoResult
}> {
    const report = (step: string) => onProgress?.(step)

    // Phase 1
    report('🔍 Phase 1: Project onboarding...')
    const project = await onboardProject(url, userId, onProgress)

    // Phase 2
    report('🤖 Phase 2: Creating AI influencer...')
    const influencer = await createInfluencer(
        project.analysis,
        project.constitution,
        onProgress
    )

    // Phase 3
    report('🎬 Phase 3: Generating marketing video...')
    const video = await generateVideo(
        project.analysis,
        project.constitution,
        influencer.profile as unknown as Record<string, unknown>,
        influencer.voiceId,
        project.screenshots,
        platform,
        projectId,
        onProgress
    )

    return { project, influencer, video }
}

// =========================================
// Utility Functions
// =========================================
function normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
    }
    return url
}
