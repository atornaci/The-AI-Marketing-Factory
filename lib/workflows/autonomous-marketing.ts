// =========================================
// Autonomous Marketing Workflow Engine
// Orchestrates the full pipeline:
// URL → Analysis → Influencer → Video
// =========================================

import { abacusAI } from '@/lib/services/abacus-ai'
import { elevenLabs } from '@/lib/services/elevenlabs'
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

    // Step 2: Generate unique avatar image
    report('Generating influencer photo...')
    const avatarUrl = await abacusAI.generateInfluencerAvatar(profile)

    // Step 3: Select appropriate voice
    report('Selecting brand voice...')
    const voices = await elevenLabs.getRecommendedVoices(constitution.brandVoice)
    const selectedVoice = voices[0] // Select best match

    return {
        influencerId: '', // Will be set by API route
        profile,
        voiceId: selectedVoice?.voice_id || '',
        voiceName: selectedVoice?.name || 'Default Voice',
        avatarUrl,
    }
}

// =========================================
// Phase 3: Video Generation
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

    // Step 1: Generate script
    report('Writing viral video script...')
    let script: VideoScript
    try {
        script = await abacusAI.generateVideoScript(analysis, constitution, platform)
        console.log(`[Workflow] ✅ Script generated: "${script.title}"`)
    } catch (error) {
        console.error('[Workflow] ❌ Script generation failed:', error)
        // Provide a fallback script so pipeline can continue
        script = {
            title: `${analysis.name} - ${platform} Ad`,
            hook: `Discover ${analysis.name}!`,
            body: analysis.valueProposition || analysis.description,
            fullScript: `${analysis.name}: ${analysis.valueProposition || analysis.description}`,
            cta: 'Try it now!',
            hashtags: [analysis.name.replace(/\s+/g, ''), platform, 'ai'],
            estimatedDuration: 30,
        }
    }

    // Step 2: Generate narration audio (only if voiceId is available)
    let audioBuffer: ArrayBuffer | null = null
    if (voiceId && voiceId.trim().length > 0) {
        report('Generating AI voice narration...')
        try {
            audioBuffer = await elevenLabs.generateSpeech(script.fullScript, voiceId)
            console.log(`[Workflow] ✅ Audio generated (${audioBuffer.byteLength} bytes)`)
        } catch (error) {
            console.error('[Workflow] ❌ Audio generation failed:', error)
        }
    } else {
        console.log('[Workflow] ⚠️ No voice ID provided, skipping audio generation')
    }

    // Step 3: Upload audio to Supabase Storage
    let audioUrl = ''
    if (audioBuffer && audioBuffer.byteLength > 0) {
        report('Uploading narration audio...')
        try {
            audioUrl = await uploadMediaToStorage(
                Buffer.from(audioBuffer),
                projectId,
                `narration-${platform}-${Date.now()}.mp3`,
                'audio/mpeg'
            )
            console.log(`[Workflow] ✅ Audio uploaded: ${audioUrl}`)
        } catch (error) {
            console.error('[Workflow] ❌ Audio upload failed:', error)
        }
    }

    // Step 4: Generate video with AI influencer via Abacus AI
    report('Rendering video with AI influencer (Abacus AI)...')
    let videoUrl = ''
    let thumbnailUrl = ''
    try {
        const videoResult = await abacusAI.generateVideo({
            script: script.fullScript,
            audioUrl,
            influencerProfile,
            screenshotUrls,
            platform,
        })
        videoUrl = videoResult.videoUrl
        thumbnailUrl = videoResult.thumbnailUrl
        console.log(`[Workflow] ✅ Video generation complete. URL: ${videoUrl || '(pending)'}`)
    } catch (error) {
        console.error('[Workflow] ❌ Video generation failed:', error)
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
