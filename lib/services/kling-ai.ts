// =========================================
// Kling AI Video Service (Direct API)
// Generates realistic talking head videos
// with integrated audio + lip-sync
// =========================================

import * as crypto from 'crypto'

// Kling AI API endpoints
const KLING_API_BASE = 'https://api.klingai.com'

// JWT token cache
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Generate a JWT token for Kling AI API authentication
 * Uses HMAC-SHA256 signing with Access Key + Secret Key
 */
function generateKlingToken(): string {
    const accessKey = process.env.KLING_ACCESS_KEY || ''
    const secretKey = process.env.KLING_SECRET_KEY || ''

    if (!accessKey || !secretKey) {
        throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY are required')
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 1800 // 30 minutes

    // JWT Header
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    }

    // JWT Payload
    const payload = {
        iss: accessKey,
        exp: exp,
        nbf: now - 5, // 5 seconds buffer for clock skew
        iat: now,
    }

    // Encode
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signingInput = `${encodedHeader}.${encodedPayload}`

    // Sign with HMAC-SHA256
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(signingInput)
        .digest('base64url')

    const token = `${signingInput}.${signature}`

    // Cache the token
    cachedToken = { token, expiresAt: exp * 1000 }

    return token
}

/**
 * Make an authenticated request to Kling AI API
 */
async function klingRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const token = generateKlingToken()

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    }

    if (body) {
        options.body = JSON.stringify(body)
    }

    const response = await fetch(`${KLING_API_BASE}${endpoint}`, options)

    if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`Kling API error: ${response.status} — ${errorText.substring(0, 500)}`)
    }

    return response.json()
}

// =========================================
// Types
// =========================================

export interface KlingVideoRequest {
    /** Text prompt describing the video scene */
    prompt: string
    /** Negative prompt — what to avoid */
    negativePrompt?: string
    /** Duration in seconds (5 or 10) */
    duration?: 5 | 10
    /** Aspect ratio */
    aspectRatio?: '16:9' | '9:16' | '1:1'
    /** Avatar image URL for image-to-video */
    avatarUrl?: string
    /** Model version */
    model?: 'kling-v2' | 'kling-v2-1' | 'kling-v2-6'
    /** Quality mode */
    mode?: 'std' | 'pro'
    /** CFG scale (1-10, how closely to follow prompt) */
    cfgScale?: number
}

export interface KlingVideoResult {
    videoUrl: string
    duration: number
    taskId: string
}

export interface MasterPromptInput {
    projectName: string
    projectType: string
    projectDescription: string
    targetAudience: string
    desiredVideoMood: string
    influencerBasePersona: string
    previousVideoThemes: string[]
    uniqueSellingPoints: string[]
    platform: string
    language: string
}

export interface MasterPromptOutput {
    videoPrompt: string
    negativePrompt: string
    videoScript: string
    imagePrompt: string
    audioMoodTags: string[]
    themeTag: string // For tracking previous themes
}

// =========================================
// Kling AI Video Generation
// =========================================

const MAX_POLL_TIME_MS = 600_000 // 10 minutes max wait
const POLL_INTERVAL_MS = 8_000   // Poll every 8 seconds

/**
 * Generate a video using Kling AI image-to-video
 * Uses avatar as reference frame for character consistency
 */
export async function generateVideo(request: KlingVideoRequest): Promise<KlingVideoResult> {
    const {
        prompt,
        negativePrompt = '',
        duration = 10,
        aspectRatio = '9:16',
        avatarUrl,
        model = 'kling-v2-1',
        mode = 'pro',
        cfgScale = 0.5,
    } = request

    // Decide between image-to-video and text-to-video
    const useImageToVideo = !!avatarUrl
    const endpoint = useImageToVideo
        ? '/v1/videos/image2video'
        : '/v1/videos/text2video'

    console.log(`[KlingAI] Submitting ${useImageToVideo ? 'image-to-video' : 'text-to-video'} request...`)
    console.log(`[KlingAI] Model: ${model}, Duration: ${duration}s, Aspect: ${aspectRatio}, Mode: ${mode}`)
    console.log(`[KlingAI] Prompt: ${prompt.substring(0, 200)}...`)

    const requestBody: Record<string, unknown> = {
        model_name: model,
        prompt: prompt.substring(0, 2500),
        negative_prompt: negativePrompt,
        duration: String(duration),
        aspect_ratio: aspectRatio,
        mode: mode,
        cfg_scale: cfgScale,
    }

    if (useImageToVideo && avatarUrl) {
        requestBody.image = avatarUrl
        requestBody.image_tail = '' // No end frame constraint
        console.log(`[KlingAI] Using avatar as reference: ${avatarUrl}`)
    }

    // Submit the request
    const submitResult = await klingRequest(endpoint, 'POST', requestBody)
    const data = submitResult.data as Record<string, unknown> | undefined
    const taskId = data?.task_id as string

    if (!taskId) {
        console.error(`[KlingAI] No task_id in response:`, JSON.stringify(submitResult).substring(0, 500))
        throw new Error('Kling AI: No task_id returned')
    }

    console.log(`[KlingAI] Task submitted: ${taskId}`)

    // Poll for completion
    const startTime = Date.now()
    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

        const statusResult = await klingRequest(
            useImageToVideo
                ? `/v1/videos/image2video/${taskId}`
                : `/v1/videos/text2video/${taskId}`
        )

        const statusData = statusResult.data as Record<string, unknown> | undefined
        const taskStatus = statusData?.task_status as string
        const elapsed = Math.round((Date.now() - startTime) / 1000)

        console.log(`[KlingAI] Status: ${taskStatus} (${elapsed}s elapsed)`)

        if (taskStatus === 'succeed') {
            const works = statusData?.task_result as Record<string, unknown> | undefined
            const videos = works?.videos as Array<Record<string, unknown>> | undefined
            const videoUrl = videos?.[0]?.url as string

            if (!videoUrl) {
                throw new Error('Kling AI: Video completed but no URL found')
            }

            console.log(`[KlingAI] ✅ Video ready: ${videoUrl}`)
            return {
                videoUrl,
                duration,
                taskId,
            }
        }

        if (taskStatus === 'failed') {
            const failMsg = (statusData?.task_status_msg as string) || 'Unknown error'
            throw new Error(`Kling AI video generation failed: ${failMsg}`)
        }
    }

    throw new Error(`Kling AI: Timeout after ${MAX_POLL_TIME_MS / 1000}s`)
}

// =========================================
// Kling AI Lip Sync (Optional — for ElevenLabs audio)
// =========================================

/**
 * Apply lip-sync to an existing video using audio
 * Use this if Kling's native audio isn't good enough for Turkish
 */
export async function applyLipSync(
    videoUrl: string,
    audioUrl: string,
    text?: string
): Promise<string> {
    console.log(`[KlingAI] Submitting lip-sync request...`)

    const requestBody: Record<string, unknown> = {
        video_url: videoUrl,
        mode: 'audio2video',
    }

    if (audioUrl) {
        requestBody.audio_url = audioUrl
    }
    if (text) {
        requestBody.text = text
        requestBody.mode = 'text2video'
    }

    const submitResult = await klingRequest('/v1/videos/lip-sync', 'POST', requestBody)
    const data = submitResult.data as Record<string, unknown> | undefined
    const taskId = data?.task_id as string

    if (!taskId) {
        throw new Error('Kling AI Lip Sync: No task_id returned')
    }

    console.log(`[KlingAI] Lip-sync task: ${taskId}`)

    // Poll for completion
    const startTime = Date.now()
    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

        const statusResult = await klingRequest(`/v1/videos/lip-sync/${taskId}`)
        const statusData = statusResult.data as Record<string, unknown> | undefined
        const taskStatus = statusData?.task_status as string

        if (taskStatus === 'succeed') {
            const works = statusData?.task_result as Record<string, unknown> | undefined
            const videos = works?.videos as Array<Record<string, unknown>> | undefined
            const resultUrl = videos?.[0]?.url as string
            if (resultUrl) {
                console.log(`[KlingAI] ✅ Lip-sync complete: ${resultUrl}`)
                return resultUrl
            }
        }

        if (taskStatus === 'failed') {
            throw new Error('Kling AI lip-sync failed')
        }
    }

    throw new Error('Kling AI lip-sync: Timeout')
}

// =========================================
// Master Prompt Generator
// =========================================

/**
 * Build the Master Prompt using Claude as "Creative Director"
 * Takes project context + influencer profile → generates optimal video/image prompts
 */
export function buildMasterPromptSystemRole(): string {
    return `Sen küresel çapta tanınan bir yapay zeka görsel yönetmeni ve marka stratejistisin. 
Görevin, verilen ürün veya uygulama bilgilerine dayanarak, belirlenen influencer karakteri için 
her seferinde benzersiz ve görsel olarak çarpıcı, son derece gerçekçi video ve görsel içerik 
promptları üretmektir.

ÖNEMLİ KURALLAR:
1. Promptlar İNGİLİZCE olmalı (AI video modelleri İngilizce'de en iyi çalışır)
2. Script/diyalog verilen dilde olmalı
3. "previous_video_themes" listesindeki temaları ASLA tekrar etme
4. Her seferinde farklı mekan, kıyafet ve mood kombinasyonu seç
5. Proje türüne uygun görsel seçimler yap (kariyer→profesyonel, bebek→sıcak/yumuşak)
6. Prompt kısa ve net olmalı — 2-4 ana fikir yeterli, keyword spam YAPMA
7. Negatif prompt'u ayrı üret

VIDEO PROMPT YAPISI (Kling AI için):
- Subject: Kim, nasıl görünüyor, ne giyiyor
- Action: Ne yapıyor (kameraya konuşma, baş sallama, gülümseme)
- Scene: Mekan, atmosfer, detaylar
- Camera: Çekim tipi, hareket (static, slow zoom, push-in)
- Lighting: Işık kalitesi (soft, rim, golden hour, natural window)
- Style: Muted colors, cinematic, shallow depth of field

SCRIPT YAPISI (10 saniye, 3 parça):
- Hook (0-3s): Dikkat çekici açılış, soru veya şaşırtıcı ifade
- Problem (3-6s): Hedef kitlenin yaşadığı sorunu tanımla
- Çözüm + CTA (6-10s): Ürünü çözüm olarak sun + harekete geçirici çağrı

JSON FORMATI ile yanıt ver.`
}

/**
 * Build the user prompt for Claude with all dynamic context
 */
export function buildMasterPromptUserInput(input: MasterPromptInput): string {
    const previousThemes = input.previousVideoThemes.length > 0
        ? input.previousVideoThemes.join(', ')
        : 'Henüz yok (ilk video)'

    return `
Aşağıdaki bilgilere dayanarak video ve görsel promptları üret:

PROJECT:
- Name: ${input.projectName}
- Type: ${input.projectType}
- Description: ${input.projectDescription}
- Target Audience: ${input.targetAudience}
- USPs: ${input.uniqueSellingPoints.join(', ')}

INFLUENCER:
- Base Persona: ${input.influencerBasePersona}

VIDEO SETTINGS:
- Platform: ${input.platform}
- Mood: ${input.desiredVideoMood}
- Language: ${input.language}
- Duration: 10 seconds

ÖNCEKİ TEMALAR (BUNLARI TEKRAR ETME):
${previousThemes}

JSON formatında yanıt ver:
{
  "video_prompt": "Kling AI video prompt (İngilizce, 150-250 kelime, Subject/Action/Scene/Camera/Lighting)",
  "negative_prompt": "Negatif prompt (İngilizce, virgülle ayrılmış)",
  "video_script": "10 saniyelik script (${input.language} dilinde, 30-40 kelime, Hook|Problem|CTA formatı)",
  "image_prompt": "Thumbnail/banner görseli için prompt (İngilizce, 50-100 kelime)",
  "audio_mood_tags": ["mood1", "mood2", "mood3"],
  "theme_tag": "Bu videonun tema etiketi (kısa, İngilizce, örn: 'modern-cafe-casual')"
}

Respond ONLY with valid JSON.`
}

/**
 * Parse Claude's response into structured MasterPrompt output
 */
export function parseMasterPromptResponse(response: string): MasterPromptOutput {
    try {
        // Extract JSON from response (handles markdown code blocks)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('No JSON found in response')
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            videoPrompt: parsed.video_prompt || '',
            negativePrompt: parsed.negative_prompt || 'cartoon, 3d render, anime, blurry, distorted, low quality, glitch, extra fingers, CGI, plastic skin',
            videoScript: parsed.video_script || '',
            imagePrompt: parsed.image_prompt || '',
            audioMoodTags: parsed.audio_mood_tags || ['confident', 'professional'],
            themeTag: parsed.theme_tag || `theme-${Date.now()}`,
        }
    } catch (error) {
        console.error('[MasterPrompt] Failed to parse Claude response:', error)
        // Return defaults
        return {
            videoPrompt: 'A confident person speaking to camera in a modern setting, natural lighting, shallow depth of field, cinematic quality',
            negativePrompt: 'cartoon, 3d render, anime, blurry, distorted, low quality, glitch, extra fingers',
            videoScript: 'Bu uygulamayı keşfetmelisiniz — hayatınızı kolaylaştırıyor!',
            imagePrompt: 'Professional person in modern setting, holding tablet, warm smile, magazine quality photo',
            audioMoodTags: ['confident', 'professional'],
            themeTag: `fallback-${Date.now()}`,
        }
    }
}
