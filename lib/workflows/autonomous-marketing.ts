// =========================================
// Autonomous Marketing Workflow Engine
// Orchestrates the full pipeline:
// URL → Analysis → Influencer → Video
// =========================================

import { abacusAI } from '@/lib/services/abacus-ai'
import { elevenLabs } from '@/lib/services/elevenlabs'
import { captureWebsite, uploadScreenshot, scrapeWebsiteInfo } from '@/lib/services/screenshot'
import type { ProjectAnalysis, MarketingConstitution, VideoScript, InfluencerProfile } from '@/lib/services/abacus-ai'

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
}

export interface VideoResult {
    videoId: string
    videoUrl: string
    thumbnailUrl: string
    script: VideoScript
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

    // Step 2: Select appropriate voice
    report('Selecting brand voice...')
    const voices = await elevenLabs.getRecommendedVoices(constitution.brandVoice)
    const selectedVoice = voices[0] // Select best match

    return {
        influencerId: '', // Will be set by API route
        profile,
        voiceId: selectedVoice?.voice_id || '',
        voiceName: selectedVoice?.name || 'Default Voice',
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
    platform: 'instagram' | 'tiktok' | 'linkedin',
    onProgress?: (step: string) => void
): Promise<VideoResult> {
    const report = (step: string) => onProgress?.(step)

    // Step 1: Generate script
    report('Writing viral video script...')
    const script = await abacusAI.generateVideoScript(analysis, constitution, platform)

    // Step 2: Generate narration audio
    report('Generating AI voice narration...')
    const audioBuffer = await elevenLabs.generateSpeech(script.fullScript, voiceId)

    // Step 3: Upload audio to storage
    report('Uploading audio...')
    // Audio upload would go here

    // Step 4: Generate video with AI influencer
    report('Rendering video with AI influencer...')
    const { videoUrl, thumbnailUrl } = await abacusAI.generateVideo({
        script: script.fullScript,
        audioUrl: '', // Would be the uploaded audio URL
        influencerProfile,
        screenshotUrls,
        platform,
    })

    return {
        videoId: '', // Will be set by API route
        videoUrl,
        thumbnailUrl,
        script,
    }
}

// =========================================
// Full Pipeline: Run Everything
// =========================================
export async function runFullPipeline(
    url: string,
    userId: string,
    platform: 'instagram' | 'tiktok' | 'linkedin',
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
