// =========================================
// AI Service Client (OpenRouter + fal.ai)
// Handles project analysis, script generation,
// AI influencer creation, and video generation
// =========================================

import type { Language } from '@/lib/i18n/translations'
import type { HookVariation, Storyboard, StoryboardScene, ProblemSolutionPair } from '@/lib/types/storyboard'

// OpenRouter — OpenAI-compatible endpoint (multi-provider LLM router)
const API_BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'anthropic/claude-3.5-haiku' // Fast & cost-effective

// Task-specific models for higher quality output
const MODELS = {
    default: 'anthropic/claude-3.5-haiku',
    analysis: 'openai/gpt-4o-mini',                   // Better structured analysis & reasoning
    creative: 'anthropic/claude-sonnet-4',              // Better creative writing & storytelling
} as const

// Universal negative prompt pool — appended to every fal.ai image/video request
const NEGATIVE_PROMPT = 'lowres, bad anatomy, text overlap, distorted UI, cartoon, messy background, unrealistic skin, blurry, watermark, logo, text, deformed, disfigured, extra limbs'

// UGC Authenticity Keywords — makes AI video prompts feel like real creator content
const UGC_AUTHENTICITY_KEYWORDS = [
    'smartphone selfie', 'handheld realism', 'raw unfiltered',
    'TikTok aesthetic', 'real voice', 'micro hand jitters',
    'trust builder', 'phone selfie', 'natural front-camera look',
] as const

// Map pixel dimensions to Nano Banana Pro aspect_ratio enum
function dimensionsToAspectRatio(w: number, h: number): string {
    const ratio = w / h
    if (Math.abs(ratio - 1) < 0.05) return '1:1'
    if (ratio > 1) {
        // Landscape
        if (ratio >= 2.2) return '21:9'
        if (ratio >= 1.7) return '16:9'
        if (ratio >= 1.4) return '3:2'
        if (ratio >= 1.25) return '4:3'
        return '5:4'
    }
    // Portrait
    if (ratio <= 0.48) return '9:16'
    if (ratio <= 0.6) return '9:16'
    if (ratio <= 0.7) return '2:3'
    if (ratio <= 0.8) return '3:4'
    return '4:5'
}

// Language-specific prompt instructions
const LANGUAGE_PROMPTS: Record<Language, { name: string; instruction: string; adLang: string }> = {
    tr: { name: 'Turkish', instruction: 'Türkçe yaz. Doğal, günlük konuşma dili kullan.', adLang: 'Türkçe' },
    en: { name: 'English', instruction: 'Write in English. Use natural, conversational language.', adLang: 'English' },
    es: { name: 'Spanish', instruction: 'Escribe en español. Usa un lenguaje natural y conversacional.', adLang: 'Español' },
    de: { name: 'German', instruction: 'Schreibe auf Deutsch. Verwende eine natürliche, umgangssprachliche Sprache.', adLang: 'Deutsch' },
    fr: { name: 'French', instruction: 'Écris en français. Utilise un langage naturel et conversationnel.', adLang: 'Français' },
}

interface ProjectAnalysis {
    name: string
    description: string
    valueProposition: string
    targetAudience: {
        demographics: string[]
        interests: string[]
        painPoints: string[]
    }
    competitors: string[]
    brandTone: string
    keywords: string[]
    category?: string
    industry?: string
    [key: string]: unknown
}

interface MarketingConstitution {
    brandVoice: string
    contentPillars: string[]
    messagingFramework: {
        hook: string
        problem: string
        solution: string
        cta: string
    }
    visualGuidelines: {
        colorPalette: string[]
        mood: string
        style: string
    }
    brandPersona?: string   // "If this brand were a person" — environment, clothing, energy
    visualDna?: string      // fal.ai keywords: "cyberpunk, 8k, clinical white, soft bokeh..."
}

interface VideoScript {
    title: string
    hook: string
    body: string
    cta: string
    fullScript: string
    hashtags: string[]
    estimatedDuration: number
}

interface InfluencerProfile {
    name: string
    personality: string
    backstory: string
    appearanceDescription: string
    visualProfile: Record<string, unknown>
}

class AIService {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || ''
    }

    /**
     * Public chat completion method — wraps callLLM for external use
     * Used by Master Prompt Generator to call Claude as Creative Director
     */
    async chatCompletion(systemPrompt: string, userPrompt: string, modelType: keyof typeof MODELS = 'default'): Promise<string> {
        return this.callLLM(userPrompt, systemPrompt, MODELS[modelType])
    }

    private async callLLM(prompt: string, systemPrompt?: string, preferredModel?: string, maxTokens?: number): Promise<string> {
        const model = preferredModel || DEFAULT_MODEL
        const MAX_RETRIES = 3
        const TIMEOUT_MS = 90_000 // 90 seconds — below Cloudflare's 100s limit

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

                // On last retry, fallback to route-llm if using a specific model
                const activeModel = (attempt === MAX_RETRIES && model !== DEFAULT_MODEL) ? DEFAULT_MODEL : model
                if (activeModel !== model) {
                    console.warn(`[LLM] Falling back to ${DEFAULT_MODEL} after ${attempt - 1} failed attempts with ${model}`)
                }

                const response = await fetch(`${API_BASE}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: activeModel,
                        messages: [
                            {
                                role: 'system',
                                content: systemPrompt || 'You are an expert marketing strategist and content creator.',
                            },
                            {
                                role: 'user',
                                content: prompt,
                            },
                        ],
                        temperature: 0.7,
                        max_tokens: maxTokens || 2048,
                    }),
                    signal: controller.signal,
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    const errorBody = await response.text().catch(() => '')
                    // Retry on 5xx / timeout errors
                    if (response.status >= 500 && attempt < MAX_RETRIES) {
                        console.warn(`OpenRouter attempt ${attempt} failed (${response.status}), retrying in ${attempt * 2}s...`)
                        await new Promise(r => setTimeout(r, attempt * 2000))
                        continue
                    }
                    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} — ${errorBody}`)
                }

                const data = await response.json()
                return data.choices?.[0]?.message?.content || ''
            } catch (error: unknown) {
                const isAbortError = error instanceof Error && error.name === 'AbortError'
                const isTimeout = isAbortError || (error instanceof Error && error.message.includes('timeout'))

                if ((isTimeout || (error instanceof Error && error.message.includes('fetch'))) && attempt < MAX_RETRIES) {
                    console.warn(`OpenRouter attempt ${attempt} timed out, retrying in ${attempt * 3}s...`)
                    await new Promise(r => setTimeout(r, attempt * 3000))
                    continue
                }
                throw error
            }
        }

        throw new Error('OpenRouter: All retry attempts exhausted')
    }

    /**
     * Analyze a web project from its URL
     */
    async analyzeProject(url: string, scrapedContent: string, language: Language = 'tr'): Promise<ProjectAnalysis> {
        const lang = LANGUAGE_PROMPTS[language]
        const prompt = `
Analyze the following website and provide a comprehensive marketing analysis.
IMPORTANT: Write ALL text values in ${lang.name} language.

URL: ${url}
Website Content:
${scrapedContent}

Respond with a JSON object containing (all values in ${lang.name}):
{
  "name": "Project/Company name",
  "description": "Brief description of the project in ${lang.name}",
  "valueProposition": "Main value proposition in ${lang.name}",
  "targetAudience": {
    "demographics": ["demographic1 in ${lang.name}", "demographic2"],
    "interests": ["interest1 in ${lang.name}", "interest2"],
    "painPoints": ["painpoint1 in ${lang.name}", "painpoint2"]
  },
  "competitors": ["competitor1", "competitor2"],
  "brandTone": "brand tone description in ${lang.name}",
  "keywords": ["keyword1", "keyword2"]
}

Respond ONLY with valid JSON, no additional text.`

        const result = await this.callLLM(prompt, undefined, MODELS.analysis)
        try {
            return JSON.parse(result)
        } catch {
            return {
                name: 'Unknown Project',
                description: scrapedContent.substring(0, 200),
                valueProposition: '',
                targetAudience: { demographics: [], interests: [], painPoints: [] },
                competitors: [],
                brandTone: 'professional',
                keywords: [],
            }
        }
    }

    /**
     * Generate a Marketing Constitution for the project
     */
    async generateMarketingConstitution(analysis: ProjectAnalysis, language: Language = 'tr'): Promise<MarketingConstitution> {
        const lang = LANGUAGE_PROMPTS[language]
        const prompt = `
Based on the following project analysis, create a comprehensive Marketing Constitution.
IMPORTANT: Write ALL text values in ${lang.name} language.

Project: ${analysis.name}
Description: ${analysis.description}
Value Proposition: ${analysis.valueProposition}
Target Audience: ${JSON.stringify(analysis.targetAudience)}
Brand Tone: ${analysis.brandTone}

Respond with a JSON object (all values in ${lang.name}):
{
  "brandVoice": "Description of brand voice in ${lang.name}",
  "contentPillars": ["pillar1 in ${lang.name}", "pillar2", "pillar3"],
  "messagingFramework": {
    "hook": "Attention-grabbing hook in ${lang.name}",
    "problem": "Problem statement in ${lang.name}",
    "solution": "Solution presentation in ${lang.name}",
    "cta": "Call-to-action in ${lang.name}"
  },
  "visualGuidelines": {
    "colorPalette": ["#color1", "#color2"],
    "mood": "Visual mood in ${lang.name}",
    "style": "Visual style in ${lang.name}"
  },
  "brandPersona": "Bu marka bir insan olsaydı nasıl giyinirdi, nasıl bir ortamda çalışırdı? Detaylı bir karakter tanımı yaz. Örn: 'Minimalist ofiste çalışan, şık giyinen, sakin ama kararlı bir profesyonel' veya 'Şefkatli bir ev ortamında, pastel renkli yumuşak kıyafetler giyen, sıcak gülümsemesiyle güven veren bir anne figürü'",
  "visualDna": "fal.ai görsel üretimi için kullanılacak İngilizce anahtar kelimeler. Markanın ruhunu yansıtan teknik ve stilistik terimler. Örn: 'photorealistic, 8k UHD, warm studio lighting, clean white environment, soft bokeh, professional vibes' veya 'cyberpunk aesthetic, neon glow, dark moody, cinematic lighting, tech lab environment'"
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt, undefined, MODELS.creative)
        try {
            return JSON.parse(result)
        } catch {
            return {
                brandVoice: 'Professional and engaging',
                contentPillars: ['Innovation', 'Value', 'Trust'],
                messagingFramework: {
                    hook: 'Did you know...',
                    problem: 'The challenge is...',
                    solution: `${analysis.name} solves this by...`,
                    cta: 'Try it now!',
                },
                visualGuidelines: {
                    colorPalette: ['#6366f1', '#8b5cf6', '#ec4899'],
                    mood: 'Modern and dynamic',
                    style: 'Clean and professional',
                },
                brandPersona: 'Modern, profesyonel ve yenilikçi bir karakter',
                visualDna: 'photorealistic, 8k UHD, clean modern environment, soft studio lighting, professional vibes',
            }
        }
    }

    /**
     * Generate a STORY-DRIVEN video script for a specific platform.
     * The influencer tells a personal, intimate story about the app —
     * as if they genuinely discovered and loved it.
     */
    async generateVideoScript(
        analysis: ProjectAnalysis,
        constitution: MarketingConstitution,
        platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
        language: Language = 'tr'
    ): Promise<VideoScript> {
        const lang = LANGUAGE_PROMPTS[language]
        const platformSpecs = {
            instagram: {
                maxDuration: 6,
                style: 'Tek cümlelik vurucu, merak uyandıran',
                format: 'Reels',
                tone: 'Samimi, heyecanlı, kısa',
                storyStyle: 'Tek güçlü cümle. Hook + değer önerisi.',
            },
            tiktok: {
                maxDuration: 6,
                style: 'Viral, dikkat çekici, tek nefeste',
                format: 'Short-form',
                tone: 'Doğal, spontan, enerjik',
                storyStyle: 'Tek vurucu cümle — durdurucu ve merak uyandırıcı.',
            },
            linkedin: {
                maxDuration: 6,
                style: 'Profesyonel, özlü, etkileyici',
                format: 'Professional video',
                tone: 'Güvenilir ve net',
                storyStyle: 'Tek profesyonel mesaj — sorun + çözüm önerisi.',
            },
            youtube: {
                maxDuration: 6,
                style: 'Enerjik, merak uyandıran',
                format: 'YouTube Shorts',
                tone: 'Heyecanlı, samimi',
                storyStyle: 'Tek vurucu hook — izleyiciyi durduran mini mesaj.',
            },
        }

        const spec = platformSpecs[platform]

        // Build pain points into story elements
        const painPoints = analysis.targetAudience.painPoints.join(', ')
        const demographics = analysis.targetAudience.demographics.join(', ')

        // ═══ SCRIPT VARIETY: Random story angle for unique scripts each time ═══
        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

        const storyAngles = [
            'Kendi yaşadığın bir problemi ve çözümünü anlat - kişisel deneyim odaklı',
            'Bir arkadaşının sorunu çözdüğün bir anıyı anlat - sosyal kanıt odaklı',
            'Eskiden nasıl yapıyordun vs şimdi nasıl yapıyorsun - karşılaştırma odaklı',
            'İlk kullandığında yaşadığın şaşkınlığı anlat - keşif anı odaklı',
            'Rakip ürünleri deneyip hayal kırıklığına uğradıktan sonraki bulma hikayesi',
            'Bir gün boyunca bu uygulamayla neler başardığını anlat - günlük hayat odaklı',
            'Bu uygulamanın en bilinmeyen ama en güçlü özelliğini paylaş - gizli özellik odaklı',
            'Konuya şüpheci başla, sonra ikna ol - samimi dönüşüm hikayesi',
        ]

        const hookStyles = [
            'Şok edici bir istatistikle başla',
            'Bir soruyla başla: "Hiç ... yaşadınız mı?"',
            'Bir itirafla başla: "İtiraf etmeliyim ki..."',
            'Bir meydan okumayla başla: "Bunu 30 saniyede yapabileceğinize inanmazsınız"',
            'Bir sırla başla: "Size hiç kimsenin söylemediği bir şey var..."',
            'Son sonuçla başla ve geriye doğru anlat',
            'Popüler bir yanlış inançla başla ve çürüt',
            'Espriyle başla ve sonra ciddiye dön',
        ]

        const selectedAngle = pick(storyAngles)
        const selectedHook = pick(hookStyles)
        const uniqueSeed = Math.random().toString(36).substring(2, 8)
        console.log(`[Script] 🎭 Variety: Angle="${selectedAngle.substring(0, 40)}...", Hook="${selectedHook.substring(0, 30)}...", Seed=${uniqueSeed}`)

        const prompt = `
Sen bir AI influencer'sın ve ${analysis.name} uygulamasını gerçekten kullanıp seven biri gibi davranıyorsun.

GÖREV: ${platform.toUpperCase()} için SAMİMİ BİR HİKAYE ANLAT. Bu bir reklam değil, bu senin GERÇEK DENEYİMİN.

⚠️ ÖNEMLİ - BENZERSİZLİK KURALI:
Bu script TAMAMEN FARKLI ve ÖZGÜN olmalı. Daha önce üretilmiş hiçbir scripte benzememeli.
- Hikaye açısı: ${selectedAngle}
- Hook tarzı: ${selectedHook}
- Benzersizlik kodu: ${uniqueSeed}
Her seferinde farklı detaylar, farklı örnekler ve farklı bir bakış açısı kullan.

=== UYGULAMA BİLGİLERİ ===
Uygulama: ${analysis.name}
Ne yapar: ${analysis.description}
Değer önerisi: ${analysis.valueProposition}
Hedef kitle: ${demographics}
Hedef kitlenin sorunları: ${painPoints}
Marka sesi: ${constitution.brandVoice}

=== 6 SANİYE KURALI (ÇOK ÖNEMLİ) ===
Video SADECE 6 SANİYE. Script bu süreye SIĞMALI.
- Maksimum 15-20 kelime.
- TEK BİR GÜÇLÜ CÜMLE yaz.
- Bu cümle hem sorunu, hem çözümü, hem de merak uyandıran bir hook içermeli.
- Sanki TikTok'ta scroll ederken durduracak tek bir cümle.

=== PLATFORM ===
- Platform: ${platform.toUpperCase()} ${spec.format}
- Süre: ${spec.maxDuration} saniye (SADECE 6 SANİYE!)
- Ton: ${spec.tone}
- Stil: ${spec.storyStyle}

=== KRİTİK KURALLAR ===
- ${lang.instruction}
- LANGUAGE: ${lang.name} (${lang.adLang}). Her kelime ${lang.name} olmalı.
- 1. şahıs perspektifi. Samimi ve doğal.
- KISA TUT. 15-20 kelimeyi ASLA geçme.
- Uzun hikaye YAZMA. Tek vurucu cümle.

JSON formatında yanıt ver:
{
  "title": "Video başlığı ${lang.name} (dikkat çekici)",
  "hook": "6 saniyelik tek vurucu cümle ${lang.name}",
  "body": "",
  "cta": "",
  "fullScript": "6 saniyeye sığan TEK CÜMLE. Parantez içi yönerge YOK. Maksimum 15-20 kelime. Sadece konuşma metni.",
  "hashtags": ["relevant", "hashtags", "5 items"],
  "estimatedDuration": 6,
  "storyBeats": [
    {"timestamp": "0:00-0:06", "beat": "HOOK+CTA", "emotion": "impact"}
  ]
}

Respond ONLY with valid JSON.`

        const systemPrompt = `You are a world-class content strategist and storyteller.
Your expertise: Presenting products not as ads, but as genuine personal experience stories.
When people watch your videos, they don't think "this is an ad" — they think "my friend is recommending something."
IMPORTANT: Always respond in ${lang.name} (${lang.adLang}). Every single word of the script MUST be in ${lang.name}.`

        const result = await this.callLLM(prompt, systemPrompt, MODELS.creative)
        try {
            return JSON.parse(result)
        } catch {
            // 6 saniyelik kısa fallback
            const painPoint = analysis.targetAudience.painPoints[0] || 'bir sorunu çözmek'
            return {
                title: `${analysis.name} ile tanışın`,
                hook: `${painPoint} için saatlerce uğraşmayı bırakın — ${analysis.name} bunu saniyede çözüyor.`,
                body: '',
                cta: '',
                fullScript: `${painPoint} için saatlerce uğraşmayı bırakın — ${analysis.name} bunu saniyede çözüyor.`,
                hashtags: [`#${analysis.name?.replace(/\s/g, '')}`, '#çözüm', '#tavsiye', '#teknoloji', '#keşfet'],
                estimatedDuration: 6,
            }
        }
    }

    /**
     * Generate an AI Influencer profile
     */
    async generateInfluencerProfile(analysis: ProjectAnalysis, constitution: MarketingConstitution): Promise<InfluencerProfile> {
        // Randomize personality archetype each time for variety
        const archetypes = [
            'The Visionary Innovator — forward-thinking, inspiring, always talking about the future',
            'The Friendly Mentor — warm, approachable, guides people with patience and humor',
            'The Bold Challenger — provocative, energetic, breaks conventions and challenges norms',
            'The Calm Expert — composed, authoritative, explains complex topics simply',
            'The Passionate Storyteller — emotional, creative, connects through narratives',
            'The Street-Smart Hustler — practical, direct, motivates with real-world experience',
            'The Quirky Creative — playful, unconventional, surprises with unexpected angles',
            'The Empathetic Connector — deeply caring, community-focused, builds trust naturally',
        ]
        const nameStyles = [
            'a modern tech-inspired name',
            'a warm Mediterranean-sounding name',
            'an elegant European name',
            'a bold and punchy American name',
            'an artistic and creative name',
            'a cool and trendy East Asian-inspired name',
            'a sophisticated British-sounding name',
            'a vibrant Latin-inspired name',
        ]
        const backstoryThemes = [
            'came from a completely different career and found their true calling',
            'grew up in a small town and built their way up through pure determination',
            'was a skeptic at first but became a passionate advocate after a life-changing experience',
            'has an academic/research background and brings intellectual depth',
            'is a serial entrepreneur who has seen both failures and successes',
            'traveled the world and gained unique perspectives from different cultures',
            'started as a community volunteer and discovered their talent for communication',
            'is a former artist/musician who brings creative energy to everything they do',
        ]

        const archetype = archetypes[Math.floor(Math.random() * archetypes.length)]
        const nameStyle = nameStyles[Math.floor(Math.random() * nameStyles.length)]
        const backstoryTheme = backstoryThemes[Math.floor(Math.random() * backstoryThemes.length)]
        const uniqueSeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

        const prompt = `
Create a UNIQUE AI Influencer character profile for marketing the following project.
Generation seed: ${uniqueSeed} — use this to ensure uniqueness.

Project: ${analysis.name}
Description: ${analysis.description || ''}
Target Audience: ${JSON.stringify(analysis.targetAudience)}
Brand Voice: ${constitution.brandVoice}
Visual Style: ${constitution.visualGuidelines.style}

CREATIVE DIRECTION (follow this closely):
- Personality archetype: ${archetype}
- Name style: Give them ${nameStyle}
- Backstory theme: This character ${backstoryTheme}

The AI influencer should be a virtual character that:
- Has a memorable, UNIQUE name (first and last name) — NEVER use generic names like "Alex Nova" or "Ada"
- Has a rich backstory explaining who they are and why they promote this brand
- Embodies the brand values and connects emotionally with the target audience
- Has a distinct personality matching the archetype above

Respond with a JSON object:
{
  "name": "A creative, memorable influencer name (first and last name)",
  "personality": "Detailed personality traits, communication style, and tone of voice matching the archetype (2-3 sentences)",
  "backstory": "A compelling backstory following the theme above: who this character is, their background, why they are passionate about this brand/product, what drives them, and their mission. Write as a mini biography (3-5 sentences).",
  "appearanceDescription": "Detailed visual description for AI generation",
  "visualProfile": {
    "gender": "male/female/neutral",
    "ageRange": "25-35",
    "style": "business casual/casual/formal",
    "features": "Key visual features"
  }
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt, undefined, MODELS.analysis)
        try {
            return JSON.parse(result)
        } catch {
            // Randomized fallback names
            const fallbackNames = ['Zara Pulse', 'Leo Vantis', 'Maya Drift', 'Kai Ember', 'Nora Flux', 'Ravi Crest', 'Lina Spark', 'Theo Blaze']
            const fallbackName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
            return {
                name: fallbackName,
                personality: 'Friendly, professional, and enthusiastic about technology. Speaks with confidence and warmth, making complex things feel simple.',
                backstory: `${fallbackName} is a passionate digital creator who discovered their calling in connecting innovative brands with the people who need them most. Their journey started unexpectedly, but every experience shaped them into the authentic voice they are today.`,
                appearanceDescription: 'A modern, professional-looking AI character with a warm smile',
                visualProfile: {
                    gender: 'neutral',
                    ageRange: '25-35',
                    style: 'business casual',
                    features: 'Clean, modern look',
                },
            }
        }
    }

    /**
     * Generate a unique AI influencer avatar/headshot using fal.ai
     * Uses nano-banana-pro model for high-quality portrait generation
     */
    async generateInfluencerAvatar(profile: InfluencerProfile, visualDna?: string): Promise<string> {
        try {
            const falKey = process.env.FAL_KEY
            if (!falKey) {
                console.error('[Influencer] FAL_KEY not set')
                return ''
            }

            const vp = profile.visualProfile as Record<string, string> | undefined
            const gender = vp?.gender === 'male' ? 'man' : 'woman'
            const age = vp?.ageRange || '28'

            const features = (vp?.features || '').replace(/[^a-zA-Z0-9 ,.\-]/g, '').substring(0, 80)
            const style = vp?.style || 'business casual'
            const appearance = (profile.appearanceDescription || '')
                .replace(/[^a-zA-Z0-9 ,.\-]/g, '')
                .substring(0, 100)

            const hairStyles = ['blonde', 'brunette', 'black-haired', 'auburn', 'red-haired', 'dark brown-haired']
            const backgrounds = ['soft blue', 'warm beige', 'light gray', 'pastel green', 'white', 'gradient purple']
            const expressions = ['warm smile', 'confident gaze', 'friendly expression', 'gentle smile']

            const hair = hairStyles[Math.floor(Math.random() * hairStyles.length)]
            const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
            const expr = expressions[Math.floor(Math.random() * expressions.length)]

            const detailPart = features || appearance || style
            const dnaKeywords = visualDna ? `, ${visualDna}` : ''
            const promptText = `photorealistic portrait headshot of a ${hair} ${gender} aged ${age}, ${detailPart}, ${bg} background, studio lighting, ${expr}, 8k uhd${dnaKeywords}. Avoid: ${NEGATIVE_PROMPT}`

            console.log(`[Influencer] Avatar prompt: ${promptText}`)

            const response = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${falKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: promptText,
                    aspect_ratio: '1:1',
                    resolution: '1K',
                    num_images: 1,
                    safety_tolerance: '2',
                }),
            })

            if (!response.ok) {
                console.error(`[Influencer] fal.ai returned ${response.status}: ${await response.text()}`)
                return ''
            }

            const data = await response.json()
            const avatarUrl = data?.images?.[0]?.url || ''
            if (avatarUrl) {
                console.log(`[Influencer] ✅ Avatar generated via fal.ai`)
            }
            return avatarUrl
        } catch (error) {
            console.error(`[Influencer] Avatar generation error:`, error)
            return ''
        }
    }

    /**
     * Generate video with AI influencer
     * Uses LLM for script refinement + fal.ai for thumbnail
     */
    async generateVideo(params: {
        script: string
        audioUrl: string
        influencerProfile: Record<string, unknown>
        screenshotUrls: string[]
        platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube'
        visualDna?: string
        brandPersona?: string
        brandColors?: string
        scenes?: unknown[]
        avatarUrl?: string
    }): Promise<{ videoUrl: string; thumbnailUrl: string }> {
        console.log(`[Video] Starting video generation via fal.ai minimax-video...`)
        console.log(`[Video] Avatar URL: ${params.avatarUrl || 'none (text-only mode)'}`)
        console.log(`[Video] Script: ${params.script.length} chars, platform: ${params.platform}`)
        console.log(`[Video] Audio URL: ${params.audioUrl || 'none'}`)
        console.log(`[Video] Screenshots: ${params.screenshotUrls.length} images`)

        // Platform-specific video settings
        const platformSettings = {
            instagram: { aspectRatio: '9:16', maxDuration: 60 },
            tiktok: { aspectRatio: '9:16', maxDuration: 60 },
            youtube: { aspectRatio: '9:16', maxDuration: 60 },
            linkedin: { aspectRatio: '16:9', maxDuration: 120 },
        }
        const settings = platformSettings[params.platform]

        // Build the influencer description for visual consistency
        const influencerDesc = params.influencerProfile?.appearanceDescription
            || params.influencerProfile?.name
            || 'A professional, modern-looking presenter'

        // Build the video generation prompt
        const videoPrompt = this.buildVideoPrompt(
            params.script, influencerDesc as string, settings, params.screenshotUrls,
            params.visualDna, params.brandPersona, params.brandColors,
            params.influencerProfile, params.scenes as Array<Record<string, unknown>> | undefined
        )

        try {
            // Use fal.ai minimax-video for real video generation
            const videoResult = await this.callFalVideoGen(videoPrompt, params.avatarUrl)

            if (videoResult.videoUrl) {
                console.log(`[Video] ✅ Video generated successfully via fal.ai: ${videoResult.videoUrl}`)
                // Also generate a thumbnail
                const thumbnailUrl = await this.generateVideoThumbnail(params.script, influencerDesc as string, params.platform, params.visualDna)
                return { videoUrl: videoResult.videoUrl, thumbnailUrl }
            }

            // Fallback: generate just a thumbnail
            console.log(`[Video] fal.ai video gen returned no URL, generating thumbnail only...`)
            const thumbnailUrl = await this.generateVideoThumbnail(params.script, influencerDesc as string, params.platform, params.visualDna)

            return {
                videoUrl: '',
                thumbnailUrl,
            }
        } catch (error) {
            console.error(`[Video] Video generation failed:`, error)
            return {
                videoUrl: '',
                thumbnailUrl: '',
            }
        }
    }

    /**
     * Build a character reference string from influencer profile
     * Creates a consistent identity anchor for all video/image prompts
     */
    private buildCharacterReference(
        influencerProfile: Record<string, unknown>
    ): string {
        const vp = influencerProfile?.visualProfile as Record<string, string> | undefined
        const name = (influencerProfile?.name as string) || 'Influencer'
        const gender = vp?.gender === 'male' ? 'man' : 'woman'
        const age = vp?.ageRange || '28'
        const appearance = (influencerProfile?.appearanceDescription as string || '')
            .replace(/[^a-zA-Z0-9 ,.\-]/g, '')
            .substring(0, 200)
        const style = vp?.style || 'casual'
        const features = vp?.features || ''

        return `Character: @${name.toLowerCase().replace(/\s+/g, '_')} | ${gender}, aged ${age}, ${appearance || style}${features ? `, ${features}` : ''}. Maintain this exact character appearance across ALL scenes for visual consistency.`
    }

    /**
     * Build a cinematic video generation prompt
     * VARIETY SYSTEM: Each call randomly selects different location, outfit, mood, and camera style
     */
    private buildVideoPrompt(
        script: string,
        influencerDesc: string,
        settings: { aspectRatio: string; maxDuration: number },
        screenshotUrls: string[],
        visualDna?: string,
        brandPersona?: string,
        brandColors?: string,
        influencerProfile?: Record<string, unknown>,
        scenes?: Array<Record<string, unknown>>
    ): string {
        const spokenScript = script
            .replace(/\[.*?\]/g, '')
            .replace(/\(.*?\)/g, '')
            .trim()
            .substring(0, 500)

        const screenshotContext = screenshotUrls.length > 0
            ? `\nReference images from the product/app are available.`
            : ''

        const characterRef = influencerProfile
            ? this.buildCharacterReference(influencerProfile)
            : `Character: ${influencerDesc}`

        // ═══ VARIETY SYSTEM: Random visual elements ═══
        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

        const locations = [
            'modern minimalist apartment with floor-to-ceiling windows, city skyline visible, warm afternoon light',
            'cozy café with exposed brick walls, warm Edison bulb lighting, coffee steam visible',
            'bright outdoor terrace with green plants, golden hour sunlight, slight breeze in hair',
            'sleek modern office with a standing desk, large monitor in background, clean workspace',
            'trendy rooftop with panoramic city view at sunset, warm orange and purple sky',
            'home studio setup with ring light, bookshelf and plants in background, cozy vibe',
            'beachside café with ocean view, tropical plants, natural bright light',
            'library corner with warm wooden shelves, soft ambient lighting',
            'modern kitchen with marble countertops, morning sunlight streaming through window',
            'urban street scene, colorful murals in background, natural daylight',
            'park bench under a tree, dappled sunlight, peaceful green surroundings',
            'hotel lobby with luxurious interior, elegant furniture, soft warm lighting',
        ]

        const outfits = [
            'wearing a casual chic white t-shirt and light denim jacket, minimal gold jewelry',
            'in a professional but relaxed outfit: cream blazer over a simple black top',
            'dressed in a cozy oversized sweater in earth tones, hair in a natural loose style',
            'wearing a trendy colorful blouse with statement earrings, confident look',
            'in a smart-casual look: fitted turtleneck and tailored pants, sophisticated vibe',
            'dressed casually in a hoodie and clean sneakers, relatable everyday look',
            'wearing a stylish leather jacket over a simple outfit, edgy but approachable',
            'in a summer dress with a light cardigan, relaxed and friendly appearance',
            'wearing a professional shirt with rolled-up sleeves, business casual feel',
            'dressed in athleisure: sleek joggers and a fitted top, energetic vibe',
        ]

        const moods = [
            'excited and genuinely surprised, like sharing a secret discovery with a best friend',
            'calm and thoughtful, like giving honest advice over coffee',
            'energetic and passionate, like telling an amazing story',
            'warm and empathetic, like comforting someone who shares the same struggle',
            'confident and inspiring, like a mentor sharing life-changing wisdom',
            'playful and humorous, cracking a smile while sharing something cool',
            'serious then suddenly amazed, showing a genuine transformation moment',
            'reflective and honest, like a real person sharing a vulnerable moment',
        ]

        const cameraStyles = [
            'handheld selfie style, slight natural movement, like a real phone video',
            'stable tripod shot with subtle zoom-in during key moments',
            'vlog-style with walking movement, dynamic and engaging',
            'close-up face shot transitioning to medium shot, intimate and personal',
            'over-the-shoulder angle showing phone screen, then back to face',
            'steady medium shot with slow cinematic push-in for emphasis',
        ]

        const loc = pick(locations)
        const outfit = pick(outfits)
        const mood = pick(moods)
        const cam = pick(cameraStyles)

        console.log(`[Video] Variety: Location="${loc.substring(0, 40)}...", Outfit="${outfit.substring(0, 40)}...", Mood="${mood.substring(0, 40)}..."`)

        let sceneBreakdown = ''
        if (scenes && scenes.length > 0) {
            sceneBreakdown = '\n\nSCENE-BY-SCENE BREAKDOWN:\n' + scenes.map(scene => {
                const lens = scene.lens || 'iPhone 15 PRO front-camera (~23mm)'
                const lighting = scene.lighting || 'natural window light, soft and warm'
                const performance = scene.performanceDirection || 'warm eye contact with lens'
                const ugc = (scene.ugcKeywords as string[])?.join(', ') || 'smartphone selfie, handheld realism'
                return `Scene ${scene.sceneNumber} (${scene.startSecond}s-${scene.endSecond}s):
  Camera: ${scene.cameraDirection || 'Medium shot'} | Lens: ${lens}
  Lighting: ${lighting}
  Performance: ${performance} | Emotion: ${scene.emotion || 'confident'}
  Visual: ${scene.visualDescription || ''}
  UGC Feel: ${ugc}`
            }).join('\n')
        }

        const ugcStr = UGC_AUTHENTICITY_KEYWORDS.slice(0, 6).join(', ')

        return `Cinematic close-up of a real person speaking to camera for ${settings.maxDuration} seconds. ${settings.aspectRatio} format.

${characterRef}

SETTING (THIS VIDEO):
- Location: ${loc}
- Outfit: ${outfit}
- Mood: ${mood}

WHAT THE PERSON IS SAYING:
${spokenScript}

CINEMATIC REALISM (CRITICAL):
- Highly realistic, photorealistic human, NOT CGI, NOT 3D render, NOT cartoon, NOT anime
- Natural skin texture, hyper-detailed pores, subtle facial micro-expressions
- Soft cinematic rim lighting, shallow depth of field, shot on 35mm lens
- 4K quality, 60fps, professional color grading
- Real physical location with natural light and real shadows

MOVEMENT (MINIMAL — VERY IMPORTANT):
- Slow dolly-in camera movement only
- Gentle head tilt, natural eye blinks, subtle nodding
- NO fast movements, NO hand gestures, NO body movement
- The person mostly looks at camera with calm, natural expression
- Occasional slow blink and slight smile — that's it
- Think: a talking head video where only lips and eyes move naturally

NEGATIVE (AVOID AT ALL COSTS):
cartoon, 3d render, anime, blurry, distorted mouth, extra fingers, low quality, glitch, video game, CGI, plastic skin, smooth skin, unnatural eyes, flat lighting, artificial look

${visualDna ? `\nVISUAL DNA: ${visualDna}` : ''}
${brandPersona ? `\nBRAND PERSONA: ${brandPersona}` : ''}
${brandColors ? `\nBRAND COLORS: ${brandColors}` : ''}
${screenshotContext}`
    }

    /**
     * Call fal.ai Kling Video queue API for real video generation
     * Uses submit → poll → get result pattern
     * Model: Kling AI V2.1 Pro via fal.ai (10s, cinematic quality)
     */
    private async callFalVideoGen(
        prompt: string,
        avatarUrl?: string,
        negativePrompt?: string,
    ): Promise<{ videoUrl: string }> {
        const FAL_KEY = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY || ''
        if (!FAL_KEY) {
            console.warn('[Video] No FAL_KEY found, skipping fal.ai video generation')
            return { videoUrl: '' }
        }

        const MAX_POLL_TIME_MS = 600_000 // 10 minutes max wait (Kling pro can take time)
        const POLL_INTERVAL_MS = 8_000   // Poll every 8 seconds

        try {
            // Choose model based on whether we have an avatar image
            // Kling V2.1 Pro for image-to-video (10s, cinematic quality)
            // Kling V2.1 Pro text-to-video fallback
            const useImageToVideo = !!avatarUrl
            const falModel = useImageToVideo
                ? 'fal-ai/kling-video/v2.1/pro/image-to-video'
                : 'fal-ai/kling-video/v2.1/pro/text-to-video'

            // Step 1: Submit the video generation request to fal.ai queue
            console.log(`[Video] Submitting to fal.ai ${falModel} queue...`)
            const requestBody: Record<string, unknown> = {
                prompt: prompt.substring(0, 2500), // Kling supports longer prompts
                duration: '10', // 10 seconds for marketing content
                negative_prompt: negativePrompt || 'blur, distort, low quality, cartoon, 3d render, anime, extra fingers, CGI',
                cfg_scale: 0.5,
            }
            if (useImageToVideo) {
                requestBody.image_url = avatarUrl
                console.log(`[Video] Using influencer avatar as reference frame: ${avatarUrl}`)
            }

            const submitResponse = await fetch(`https://queue.fal.run/${falModel}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Key ${FAL_KEY}`,
                },
                body: JSON.stringify(requestBody),
            })

            if (!submitResponse.ok) {
                const errorText = await submitResponse.text().catch(() => '')
                console.error(`[Video] fal.ai submit failed: ${submitResponse.status} — ${errorText}`)
                return { videoUrl: '' }
            }

            const submitData = await submitResponse.json()

            // Check if we got a direct result (synchronous response)
            if (submitData.video?.url) {
                console.log(`[Video] fal.ai returned video immediately`)
                return { videoUrl: submitData.video.url }
            }

            // Queue response: use status_url and response_url from fal.ai
            // fal.ai returns simplified URLs that may differ from the full model path
            const requestId = submitData.request_id
            const statusUrl = submitData.status_url
            const responseUrl = submitData.response_url
            if (!requestId || !statusUrl) {
                console.warn(`[Video] No request_id or status_url in fal.ai response:`, JSON.stringify(submitData).substring(0, 500))
                return { videoUrl: '' }
            }

            console.log(`[Video] fal.ai request queued: ${requestId}`)
            console.log(`[Video] Status URL: ${statusUrl}`)
            console.log(`[Video] Response URL: ${responseUrl}`)

            // Step 2: Poll for completion using the status_url from fal.ai
            const startTime = Date.now()
            while (Date.now() - startTime < MAX_POLL_TIME_MS) {
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

                const statusResponse = await fetch(statusUrl, {
                    headers: { 'Authorization': `Key ${FAL_KEY}` },
                })

                if (!statusResponse.ok) {
                    console.warn(`[Video] Poll status error: ${statusResponse.status}`)
                    continue
                }

                const statusData = await statusResponse.json()
                const elapsed = Math.round((Date.now() - startTime) / 1000)
                console.log(`[Video] fal.ai status: ${statusData.status} (${elapsed}s elapsed)`)

                if (statusData.status === 'COMPLETED') {
                    // Step 3: Fetch the result using response_url from fal.ai
                    const resultResponse = await fetch(responseUrl, {
                        headers: { 'Authorization': `Key ${FAL_KEY}` },
                    })

                    if (resultResponse.ok) {
                        const resultData = await resultResponse.json()
                        const videoUrl = resultData.video?.url || ''
                        if (videoUrl) {
                            console.log(`[Video] ✅ fal.ai video ready: ${videoUrl}`)
                            return { videoUrl }
                        }
                    }
                    console.warn(`[Video] fal.ai completed but no video URL found`)
                    return { videoUrl: '' }
                }

                if (statusData.status === 'FAILED') {
                    console.error(`[Video] fal.ai generation failed:`, statusData.error)
                    return { videoUrl: '' }
                }

                // IN_QUEUE or IN_PROGRESS — keep polling
            }

            console.warn(`[Video] fal.ai timed out after ${MAX_POLL_TIME_MS / 1000}s`)
            return { videoUrl: '' }
        } catch (error) {
            console.error(`[Video] fal.ai error:`, error)
            return { videoUrl: '' }
        }
    }

    /**
     * Extract video URL from various response formats
     */
    private extractVideoUrl(data: Record<string, unknown>): string {
        // Check common response locations
        if (typeof data.videoUrl === 'string') return data.videoUrl
        if (typeof data.video_url === 'string') return data.video_url

        // Check nested response
        const result = data.result as Record<string, unknown> | undefined
        if (result) {
            if (typeof result.videoUrl === 'string') return result.videoUrl
            if (typeof result.video_url === 'string') return result.video_url
            if (typeof result.url === 'string') return result.url
        }

        // Check ChatLLM message format
        const messages = data.messages as Array<Record<string, unknown>> | undefined
        if (messages?.length) {
            const lastMsg = messages[messages.length - 1]
            const content = lastMsg?.content as string | undefined
            if (content) {
                // Look for URLs in the response content
                const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|webm|mov)/i)
                if (urlMatch) return urlMatch[0]
            }
        }

        // Check choices format (OpenAI-compatible)
        const choices = data.choices as Array<Record<string, unknown>> | undefined
        if (choices?.length) {
            const msg = choices[0]?.message as Record<string, unknown> | undefined
            const content = msg?.content as string | undefined
            if (content) {
                const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(mp4|webm|mov)/i)
                if (urlMatch) return urlMatch[0]
            }
        }

        // Check attachments
        const attachments = data.attachments as Array<Record<string, unknown>> | undefined
        if (attachments?.length) {
            const videoAttachment = attachments.find(a =>
                (a.type as string)?.includes('video') || (a.mime_type as string)?.includes('video')
            )
            if (videoAttachment?.url) return videoAttachment.url as string
        }

        console.log(`[Video] Could not find video URL in response:`, JSON.stringify(data).substring(0, 500))
        return ''
    }

    /**
     * Extract thumbnail URL from response
     */
    private extractThumbnailUrl(data: Record<string, unknown>): string {
        if (typeof data.thumbnailUrl === 'string') return data.thumbnailUrl
        if (typeof data.thumbnail_url === 'string') return data.thumbnail_url

        const result = data.result as Record<string, unknown> | undefined
        if (result?.thumbnailUrl) return result.thumbnailUrl as string
        if (result?.thumbnail_url) return result.thumbnail_url as string

        return ''
    }

    /**
     * Generate a video thumbnail using fal.ai
     */
    async generateVideoThumbnail(
        script: string,
        influencerDesc: string,
        platform: string,
        visualDna?: string
    ): Promise<string> {
        try {
            const falKey = process.env.FAL_KEY
            if (!falKey) return ''

            const topic = script.substring(0, 60).replace(/[^a-zA-Z0-9 ]/g, '')
            const orientation = platform === 'linkedin' ? 'landscape' : 'portrait'
            const width = platform === 'linkedin' ? 1024 : 512
            const height = platform === 'linkedin' ? 576 : 910

            const dnaKeywords = visualDna ? `, ${visualDna}` : ', vibrant colors, clean design'
            const aspectRatio = platform === 'linkedin' ? '16:9' : '9:16'
            const promptText = `${orientation} video thumbnail, ${topic}, professional marketing${dnaKeywords}. Avoid: ${NEGATIVE_PROMPT}`

            const response = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${falKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: promptText,
                    aspect_ratio: aspectRatio,
                    resolution: '1K',
                    num_images: 1,
                    safety_tolerance: '2',
                }),
            })

            if (!response.ok) {
                console.warn(`[Video] Thumbnail fal.ai error: ${response.status}`)
                return ''
            }

            const data = await response.json()
            const url = data?.images?.[0]?.url || ''
            if (url) console.log(`[Video] ✅ Thumbnail generated via fal.ai`)
            return url
        } catch (error) {
            console.warn(`[Video] Thumbnail error:`, error)
            return ''
        }
    }

    /**
     * Deep Research — Advanced competitor analysis with SWOT, market gaps, and attack strategies
     * Uses multi-step reasoning with gpt-5-mini for deeper insights
     */
    async analyzeCompetitors(
        analysis: ProjectAnalysis,
        constitution: MarketingConstitution
    ): Promise<CompetitorAnalysis> {
        const competitors = analysis.competitors || []

        if (competitors.length === 0) {
            return {
                competitors: [],
                marketPosition: 'Rakip bilgisi bulunamadı. Projeyi yeniden analiz edin.',
                marketOpportunities: [],
                attackStrategies: [],
                generatedAt: new Date().toISOString(),
            }
        }

        const prompt = `
You are a world-class competitive intelligence analyst conducting DEEP RESEARCH.
Perform an exhaustive multi-dimensional analysis.

=== OUR PROJECT ===
Name: ${analysis.name}
Description: ${analysis.description || ''}
Value Proposition: ${analysis.valueProposition}
Target Audience: ${JSON.stringify(analysis.targetAudience)}
Brand Voice: ${constitution.brandVoice}
Keywords: ${analysis.keywords?.join(', ')}

=== COMPETITORS ===
${competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')}

=== ANALYSIS REQUIRED ===

For EACH competitor, provide a COMPREHENSIVE analysis:
1. SWOT Analysis:
   - Strengths (minimum 3): What they genuinely do well
   - Weaknesses (minimum 3): Real gaps, missing features, poor UX, pricing issues, limited reach
   - Opportunities: Market gaps they haven't exploited
   - Threats: Ways they could outcompete us
2. Our specific advantage over them (detailed, actionable)
3. Their estimated market share or positioning

Then provide:
- Overall market positioning summary (3-5 sentences)
- Top 3 market opportunities WE can exploit
- Attack strategies: specific marketing tactics against each competitor

Respond in Turkish. Respond ONLY with valid JSON:
{
  "competitors": [
    {
      "name": "Name",
      "url": "url if known",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
      "opportunities": ["opp 1", "opp 2"],
      "threats": ["threat 1", "threat 2"],
      "ourAdvantage": "Detailed advantage statement",
      "estimatedPosition": "Market leader / Strong challenger / Niche player / Emerging"
    }
  ],
  "marketPosition": "3-5 sentence market positioning summary",
  "marketOpportunities": [
    "Opportunity 1: detailed description",
    "Opportunity 2: detailed description",
    "Opportunity 3: detailed description"
  ],
  "attackStrategies": [
    "Strategy 1: specific tactic against a competitor",
    "Strategy 2: specific tactic",
    "Strategy 3: specific tactic"
  ]
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt, undefined, MODELS.analysis)
        try {
            const parsed = JSON.parse(result)
            return {
                ...parsed,
                generatedAt: new Date().toISOString(),
            }
        } catch {
            return {
                competitors: competitors.map(c => ({
                    name: c,
                    url: c,
                    strengths: ['Pazar bilinirliği'],
                    weaknesses: ['Detaylı analiz yapılamadı'],
                    opportunities: [],
                    threats: [],
                    ourAdvantage: 'Daha yenilikçi bir yaklaşım sunuyoruz',
                    estimatedPosition: 'Bilinmiyor',
                })),
                marketPosition: 'Rakip analizi tamamlanamadı. Lütfen tekrar deneyin.',
                marketOpportunities: [],
                attackStrategies: [],
                generatedAt: new Date().toISOString(),
            }
        }
    }

    /**
     * Generate A/B ad copy variations
     */
    async generateAdCopyVariations(
        analysis: ProjectAnalysis,
        constitution: MarketingConstitution,
        influencerName?: string
    ): Promise<AdCopyResult> {
        const framework = constitution.messagingFramework || {}

        const prompt = `
You are an expert digital advertising copywriter. Create 5 COMPLETELY DIFFERENT ad copy variations for the following product.

PRODUCT:
- Name: ${analysis.name}
- Description: ${analysis.description || analysis.valueProposition}
- Value Proposition: ${analysis.valueProposition}
- Target Audience: ${JSON.stringify(analysis.targetAudience)}

BRAND MESSAGING FRAMEWORK:
- Hook: ${framework.hook || 'N/A'}
- Problem: ${framework.problem || 'N/A'}
- Solution: ${framework.solution || 'N/A'}
- CTA: ${framework.cta || 'N/A'}

${influencerName ? `BRAND AMBASSADOR: ${influencerName}` : ''}

Create 5 variations with DIFFERENT approaches:
1. EMOTION-DRIVEN: Pull heartstrings, use storytelling
2. URGENCY-BASED: Create FOMO, limited time/opportunity
3. SOCIAL PROOF: Highlight community, trust, numbers
4. PROBLEM-SOLUTION: Lead with pain point, offer relief
5. ASPIRATIONAL: Paint a picture of the ideal outcome

Each variation should be ready to copy-paste into Facebook Ads, Google Ads, or Instagram.

Respond in Turkish. Respond ONLY with valid JSON:
{
  "variations": [
    {
      "id": 1,
      "approach": "Duygusal",
      "headline": "Attention-grabbing headline (max 40 chars)",
      "body": "Compelling ad body text (2-3 sentences, max 150 chars)",
      "cta": "Call to action button text (max 20 chars)",
      "platform": "Facebook"
    },
    {
      "id": 2,
      "approach": "Aciliyet",
      "headline": "...",
      "body": "...",
      "cta": "...",
      "platform": "Google"
    }
  ]
}

Make sure each variation feels COMPLETELY DIFFERENT in tone and approach.
Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt, undefined, MODELS.creative)
        try {
            const parsed = JSON.parse(result)
            return {
                ...parsed,
                generatedAt: new Date().toISOString(),
            }
        } catch {
            return {
                variations: [
                    {
                        id: 1,
                        approach: 'Duygusal',
                        headline: `${analysis.name} ile tanışın`,
                        body: 'Hayatınızı kolaylaştıracak çözüm burada. Hemen deneyin ve farkı hissedin.',
                        cta: 'Hemen Başla',
                        platform: 'Facebook',
                    },
                ],
                generatedAt: new Date().toISOString(),
            }
        }
    }

    // =========================================
    // Marketing Intelligence — Hook & Storyboard
    // =========================================

    async generateHookVariations(
        analysis: ProjectAnalysis,
        platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
        language: Language = 'tr'
    ): Promise<HookVariation[]> {
        const lang = LANGUAGE_PROMPTS[language]
        const prompt = `
You are a viral content strategist. Create 5 HOOK variations for the first 3 seconds of a ${platform} marketing video.

Project: ${analysis.name}
Value: ${analysis.valueProposition}
Target: ${JSON.stringify(analysis.targetAudience)}

Each hook must STOP the viewer from scrolling. Use these 5 different styles:
1. question — Ask a provocative question
2. shock — Share a shocking statistic or statement
3. curiosity — Create an information gap
4. pain-point — Hit a nerve they feel daily
5. social-proof — Reference what others are doing

IMPORTANT: Write ALL hooks in ${lang.name}.

Respond ONLY with valid JSON:
[
  {
    "id": 1,
    "text": "Hook text (max 15 words)",
    "style": "question",
    "estimatedImpact": "high"
  }
]

Respond ONLY with valid JSON array.`

        const result = await this.callLLM(prompt, 'You are a viral content expert who writes hooks that stop people from scrolling.', MODELS.creative)
        try {
            const parsed = JSON.parse(result)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return [
                { id: 1, text: `${analysis.name} ile tanışın!`, style: 'curiosity' as const, estimatedImpact: 'medium' as const },
            ]
        }
    }

    async generateStoryboard(
        analysis: ProjectAnalysis,
        constitution: MarketingConstitution,
        hooks: HookVariation[],
        platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
        language: Language = 'tr'
    ): Promise<Storyboard> {
        const lang = LANGUAGE_PROMPTS[language]
        const duration = platform === 'linkedin' ? 60 : platform === 'tiktok' ? 30 : 45
        const bestHook = hooks.find(h => h.estimatedImpact === 'high') || hooks[0]

        const prompt = `You are a professional video director creating a STORYBOARD for a ${platform} marketing video.
Total duration: ${duration} seconds.

Project: ${analysis.name}
Description: ${analysis.description || ''}
Value Proposition: ${analysis.valueProposition}
Features/Keywords: ${analysis.keywords?.join(', ')}
Brand Voice: ${constitution.brandVoice}
Brand Colors: ${constitution.visualGuidelines?.colorPalette?.join(', ')}
${constitution.visualDna ? `Visual DNA: ${constitution.visualDna}` : ''}
${constitution.brandPersona ? `Brand Persona: ${constitution.brandPersona}` : ''}

Selected Hook: "${bestHook.text}"

Create a scene-by-scene storyboard following Hook → Problem → Solution → CTA structure.
This should feel like a real creator making UGC (User Generated Content) — NOT a corporate ad.

For EACH scene provide:
- sceneNumber, startSecond, endSecond
- narration: What the influencer says (in ${lang.name})
- visualDescription: Detailed visual direction for AI render
- screenContent: What app/website screenshot to show (if applicable)
- cameraDirection: Close-up / Medium shot / Wide / Over-shoulder / Screen recording
- emotion: Character emotional state
- lens: Camera/lens spec (default: "iPhone 15 PRO front-camera (~23mm)")
- lighting: Lighting direction (e.g. "bright window/light from side (Rembrandt style)", "warm studio light", "natural daylight")
- performanceDirection: Acting cues (e.g. "warm eye contact, lean forward, broad hand gestures")
- ugcKeywords: Array of UGC authenticity tags (e.g. ["smartphone selfie", "handheld realism", "raw unfiltered TikTok aesthetic"])

Also create a problemSolutionMap: which project feature solves which user problem.

IMPORTANT: All narration text in ${lang.name}.

Respond ONLY with valid JSON:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "startSecond": 0,
      "endSecond": 3,
      "narration": "Hook text",
      "visualDescription": "Close-up of influencer looking into camera with a wake-up call expression",
      "screenContent": "",
      "cameraDirection": "Close-up",
      "emotion": "curious",
      "lens": "iPhone 15 PRO front-camera (~23mm)",
      "lighting": "bright window/light from side (Rembrandt style)",
      "performanceDirection": "looks directly into lens, slight head tilt, eyebrows raised",
      "ugcKeywords": ["smartphone selfie", "handheld realism", "raw unfiltered"]
    }
  ],
  "problemSolutionMap": [
    {
      "problem": "User problem",
      "feature": "App feature that solves it",
      "videoMoment": "Scene 3 (12-18s)"
    }
  ]
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(
            prompt,
            'You are an award-winning video director who creates storyboards that feel cinematic yet authentic.',
            MODELS.creative,
            4096
        )

        try {
            const parsed = JSON.parse(result)
            return {
                hookVariations: hooks,
                selectedHook: bestHook.id,
                scenes: parsed.scenes || [],
                totalDuration: duration,
                platform,
                problemSolutionMap: parsed.problemSolutionMap || [],
                createdAt: new Date().toISOString(),
            }
        } catch {
            return {
                hookVariations: hooks,
                selectedHook: bestHook.id,
                scenes: [
                    {
                        sceneNumber: 1, startSecond: 0, endSecond: 3,
                        narration: bestHook.text,
                        visualDescription: 'Close-up of influencer looking at camera with a wake-up call expression',
                        cameraDirection: 'Close-up', emotion: 'excited',
                        lens: 'iPhone 15 PRO front-camera (~23mm)',
                        lighting: 'bright window/light from side (Rembrandt style)',
                        performanceDirection: 'looks directly into lens, eyebrows raised, slight lean forward',
                        ugcKeywords: ['smartphone selfie', 'handheld realism', 'raw unfiltered'],
                    },
                    {
                        sceneNumber: 2, startSecond: 3, endSecond: Math.floor(duration * 0.7),
                        narration: analysis.valueProposition,
                        visualDescription: 'Medium shot, influencer showing app on phone, gesturing enthusiastically',
                        screenContent: analysis.name,
                        cameraDirection: 'Medium shot', emotion: 'enthusiastic',
                        lens: 'iPhone 15 PRO front-camera (~23mm)',
                        lighting: 'natural daylight, warm tone',
                        performanceDirection: 'holds phone at arm length, broad hand gestures, leans forward',
                        ugcKeywords: ['smartphone selfie', 'TikTok aesthetic', 'trust builder'],
                    },
                    {
                        sceneNumber: 3, startSecond: Math.floor(duration * 0.7), endSecond: duration,
                        narration: 'Hemen deneyin!',
                        visualDescription: 'Close-up with CTA overlay, genuine smile',
                        cameraDirection: 'Close-up', emotion: 'confident',
                        lens: 'iPhone 15 PRO front-camera (~23mm)',
                        lighting: 'bright window/light from side',
                        performanceDirection: 'warm confident smile, nods, points at camera',
                        ugcKeywords: ['real voice', 'micro hand jitters', 'natural front-camera look'],
                    },
                ],
                totalDuration: duration,
                platform,
                problemSolutionMap: [],
                createdAt: new Date().toISOString(),
            }
        }
    }

    /**
     * Enhance a user prompt with brand context for image generation
     * Uses LLM to transform a basic prompt into a detailed, production-ready image gen prompt
     */
    async generateEnhancedPrompt(
        userPrompt: string,
        brandContext: string,
        brandColors: string[],
        imageType: string,
        platform: string,
        visualDna?: string,
        brandPersona?: string
    ): Promise<string> {
        const colorStr = brandColors.length > 0 ? brandColors.join(', ') : 'vibrant, modern'
        const dnaSection = visualDna
            ? `\n- Visual DNA (incorporate these stylistic keywords into the prompt): ${visualDna}`
            : ''
        const personaSection = brandPersona
            ? `\n- Brand Persona (match this environment/mood): ${brandPersona}`
            : ''
        const systemPrompt = `You are an expert prompt engineer specializing in AI image generation.
Generate a single, highly detailed image generation prompt in English based on the user's request.
The prompt must be:
- Under 600 characters
- English only, no special characters
- Professional marketing quality, photorealistic
- Include the brand color scheme: ${colorStr}
- Optimized for ${platform} ${imageType}${dnaSection}${personaSection}
- Output format: 'A high-end, photorealistic [SUBJECT] in a [ENVIRONMENT], [LIGHTING_STYLE], [TECHNICAL_SPECS]'
Brand context: ${brandContext}
Return ONLY the prompt text, nothing else.`

        try {
            const enhanced = await this.callLLM(userPrompt, systemPrompt, MODELS.creative, 400)
            return enhanced.replace(/[^a-zA-Z0-9 ,.!?\-]/g, '').substring(0, 600)
        } catch {
            return userPrompt.replace(/[^a-zA-Z0-9 ,.!?\-]/g, '').substring(0, 300)
        }
    }

    /**
     * Generate a marketing image using fal.ai (nano-banana-pro)
     * Supports: static_post, carousel_slide, thumbnail, story, banner, custom
     */
    async generateMarketingImage(params: {
        prompt: string
        imageType: string
        platform: string
        brandColors?: string[]
        brandContext?: string
        visualDna?: string
        brandPersona?: string
    }): Promise<{ imageUrl: string; width: number; height: number; enhancedPrompt: string }> {
        const { prompt, imageType, platform, brandColors = [], brandContext = '', visualDna, brandPersona } = params

        // Get dimensions for this type/platform combo
        const typeDims = IMAGE_DIMENSIONS[imageType] || IMAGE_DIMENSIONS.custom
        const dims = typeDims[platform] || typeDims.instagram || { width: 1080, height: 1080 }
        const width = Math.min(dims.width, 2048)
        const height = Math.min(dims.height, 2048)

        console.log(`[Image] Generating ${imageType} for ${platform} (${width}x${height})...`)

        // Enhance the prompt with brand context via LLM
        const enhancedPrompt = await this.generateEnhancedPrompt(
            prompt, brandContext, brandColors, imageType, platform, visualDna, brandPersona
        )

        console.log(`[Image] Enhanced prompt: ${enhancedPrompt}`)

        const falKey = process.env.FAL_KEY
        if (!falKey) {
            console.error('[Image] FAL_KEY not set')
            return { imageUrl: '', width, height, enhancedPrompt }
        }

        try {
            const aspectRatio = dimensionsToAspectRatio(width, height)
            const fullPrompt = `${enhancedPrompt}. Avoid: ${NEGATIVE_PROMPT}`

            const response = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${falKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    aspect_ratio: aspectRatio,
                    resolution: '1K',
                    num_images: 1,
                    safety_tolerance: '2',
                }),
            })

            if (!response.ok) {
                console.warn(`[Image] fal.ai returned ${response.status}: ${await response.text()}`)
                return { imageUrl: '', width, height, enhancedPrompt }
            }

            const data = await response.json()
            const imageUrl = data?.images?.[0]?.url || ''
            if (imageUrl) {
                console.log(`[Image] ✅ Image generated via fal.ai`)
            }
            return { imageUrl, width, height, enhancedPrompt }
        } catch (error) {
            console.error(`[Image] Generation error:`, error)
            return { imageUrl: '', width, height, enhancedPrompt }
        }
    }
}


// Types for new features
interface CompetitorEntry {
    name: string
    url?: string
    strengths: string[]
    weaknesses: string[]
    opportunities?: string[]
    threats?: string[]
    ourAdvantage: string
    estimatedPosition?: string
}

interface CompetitorAnalysis {
    competitors: CompetitorEntry[]
    marketPosition: string
    marketOpportunities?: string[]
    attackStrategies?: string[]
    generatedAt: string
}

interface AdCopyVariation {
    id: number
    approach: string
    headline: string
    body: string
    cta: string
    platform: string
}

interface AdCopyResult {
    variations: AdCopyVariation[]
    generatedAt: string
}

// =========================================
// Image Generation Types
// =========================================
interface ImageGenParams {
    prompt: string
    imageType: 'static_post' | 'carousel_slide' | 'thumbnail' | 'story' | 'banner' | 'custom'
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube'
    brandColors?: string[]
    brandContext?: string  // project name, description etc.
    withLogo?: boolean
}

interface GeneratedImage {
    imageUrl: string
    width: number
    height: number
    prompt: string
}

// Platform + type specific dimensions
const IMAGE_DIMENSIONS: Record<string, Record<string, { width: number; height: number }>> = {
    static_post: {
        instagram: { width: 1080, height: 1080 },
        tiktok: { width: 1080, height: 1080 },
        linkedin: { width: 1200, height: 627 },
        youtube: { width: 1280, height: 720 },
    },
    carousel_slide: {
        instagram: { width: 1080, height: 1080 },
        linkedin: { width: 1080, height: 1080 },
        tiktok: { width: 1080, height: 1080 },
        youtube: { width: 1280, height: 720 },
    },
    thumbnail: {
        instagram: { width: 1080, height: 1080 },
        tiktok: { width: 1080, height: 1920 },
        linkedin: { width: 1280, height: 720 },
        youtube: { width: 1280, height: 720 },
    },
    story: {
        instagram: { width: 1080, height: 1920 },
        tiktok: { width: 1080, height: 1920 },
        linkedin: { width: 1080, height: 1920 },
        youtube: { width: 1080, height: 1920 },
    },
    banner: {
        instagram: { width: 1080, height: 566 },
        tiktok: { width: 1080, height: 566 },
        linkedin: { width: 1584, height: 396 },
        youtube: { width: 2560, height: 1440 },
    },
    custom: {
        instagram: { width: 1080, height: 1080 },
        tiktok: { width: 1080, height: 1920 },
        linkedin: { width: 1200, height: 627 },
        youtube: { width: 1280, height: 720 },
    },
}

export const abacusAI = new AIService()
export type { ProjectAnalysis, MarketingConstitution, VideoScript, InfluencerProfile, CompetitorAnalysis, CompetitorEntry, AdCopyResult, AdCopyVariation, ImageGenParams, GeneratedImage }
export { IMAGE_DIMENSIONS }

