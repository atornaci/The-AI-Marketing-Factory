// =========================================
// Abacus.AI Service Client
// Handles project analysis, script generation,
// AI influencer creation, and video generation
// =========================================

import type { Language } from '@/lib/i18n/translations'

const ABACUS_API_BASE = 'https://api.abacus.ai/api/v0'

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
    appearanceDescription: string
    visualProfile: Record<string, unknown>
}

class AbacusAIService {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.ABACUS_AI_API_KEY || ''
    }

    private async callLLM(prompt: string, systemPrompt?: string): Promise<string> {
        const response = await fetch(`${ABACUS_API_BASE}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                deploymentToken: this.apiKey,
                deploymentId: process.env.ABACUS_DEPLOYMENT_ID || '',
                arguments: {
                    prompt,
                    system_prompt: systemPrompt || 'You are an expert marketing strategist and content creator.',
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`Abacus AI API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.result || data.prediction || ''
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

        const result = await this.callLLM(prompt)
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
  }
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt)
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
        platform: 'instagram' | 'tiktok' | 'linkedin',
        language: Language = 'tr'
    ): Promise<VideoScript> {
        const lang = LANGUAGE_PROMPTS[language]
        const platformSpecs = {
            instagram: {
                maxDuration: 60,
                style: 'Samimi, duygusal, görsel ağırlıklı, trend',
                format: 'Reels',
                tone: 'Arkadaşına anlatır gibi, enerjik ve samimi',
                storyStyle: 'Kısa, vurucu bir kişisel deneyim hikayesi. Sorunu yaşa → çözümü keşfet → sonucu göster.',
            },
            tiktok: {
                maxDuration: 60,
                style: 'Hızlı, otantik, viral, dikkat çekici',
                format: 'Short-form',
                tone: 'Doğal, spontan, samimi - sanki arkadaşına mesaj atıyor gibi',
                storyStyle: '"Ben de aynı sorunla boğuşuyordum..." diye başlayan, merak uyandıran bir mini hikaye. Sonunda çene düşüren bir sonuç.',
            },
            linkedin: {
                maxDuration: 120,
                style: 'Profesyonel ama insani, düşünce liderliği',
                format: 'Professional video',
                tone: 'Deneyim paylaşan bir meslektaş gibi - otoriter ama samimi',
                storyStyle: 'Profesyonel bir zorlukla başla → çözüm arayışını anlat → keşfi paylaş → somut sonuçları göster. Veri ve kişisel deneyimi harmanla.',
            },
        }

        const spec = platformSpecs[platform]

        // Build pain points into story elements
        const painPoints = analysis.targetAudience.painPoints.join(', ')
        const demographics = analysis.targetAudience.demographics.join(', ')

        const prompt = `
Sen bir AI influencer'sın ve ${analysis.name} uygulamasını gerçekten kullanıp seven biri gibi davranıyorsun.

GÖREV: ${platform.toUpperCase()} için SAMİMİ BİR HİKAYE ANLAT. Bu bir reklam değil, bu senin GERÇEK DENEYİMİN.

=== UYGULAMA BİLGİLERİ ===
Uygulama: ${analysis.name}
Ne yapar: ${analysis.description}
Değer önerisi: ${analysis.valueProposition}
Hedef kitle: ${demographics}
Hedef kitlenin sorunları: ${painPoints}
Marka sesi: ${constitution.brandVoice}

=== HİKAYE YAPISI (ZORUNLU) ===
Videoyu şu hikaye akışıyla oluştur:

1. 🎣 HOOK (İlk 3 saniye - DURDURUCU):
   - Kişisel bir sorunla başla. "Geçen hafta..." veya "Biliyor musunuz..." ile değil,
   - Şok edici bir itiraf veya soru ile: "Saatlerce uğraştığım şey 30 saniyede halloldu." gibi.
   - İzleyici "nasıl?!" diye merak etmeli.

2. 😤 SORUN (Empati kurma - 10 saniye):
   - Hedef kitlenin EN BÜYÜK acı noktasını KENDİ DENEYİMİN olarak anlat.
   - Duyguları göster: sinir, hayal kırıklığı, umutsuzluk.
   - İzleyici "evet, ben de aynısını yaşıyorum!" demeli.

3. 💡 KEŞİF ANI (Dönüm noktası - 10 saniye):
   - ${analysis.name}'ı nasıl keşfettiğini anlat.
   - "Bir arkadaşım önerdi" veya "internette rastladım" gibi doğal bir keşif hikayesi.
   - İlk izlenimini paylaş - şüpheciydin belki?

4. 🎬 DEMO / GÖSTER (Uygulamayı gösterme - 15-20 saniye):
   - Uygulamanın ekran görüntülerini gösterirken konuş.
   - "Bakın, burada şunu yapıyorsunuz..." diye adım adım göster.
   - Kolaylığına ve hızına vurgu yap.
   - Spesifik özellikleri göster, genel konuşma.

5. 🎉 SONUÇ / DÖNÜŞÜM (Mutluluk - 10 saniye):
   - Uygulamayı kullandıktan sonra hayatının nasıl değiştiğini anlat.
   - Somut bir sonuç ver: "İlk hafta 3 teklif aldım" gibi.
   - Duygusal kapanış: "Keşke daha önce keşfetseydim."

6. 📢 CTA (Eylem çağrısı - 5 saniye):
   - Doğal ve samimi bir tavsiye: "Ciddi ciddi deneyin" gibi, "Hemen indirin!" gibi bağırmadan.
   - Bağlantıyı bio'da veya yorumda bulabileceklerini söyle.

=== PLATFORM KURALLARI ===
- Platform: ${platform.toUpperCase()} ${spec.format}
- Maksimum süre: ${spec.maxDuration} saniye
- Ton: ${spec.tone}
- Hikaye tarzı: ${spec.storyStyle}

=== KRİTİK KURALLAR ===
- ${lang.instruction}
- LANGUAGE: Write the ENTIRE script in ${lang.name} (${lang.adLang}). Every word must be in ${lang.name}.
- No ad-speak. Everything must be in 1st person perspective.
- Be genuine, not fake. Add realistic details.
- Describe the target audience's problems as your own.
- Mark app screenshot moments with "[SCREEN: description]".
- Clear emotional transitions: frustration → curiosity → surprise → happiness.

JSON formatında yanıt ver:
{
  "title": "Video title in ${lang.name} (attention-grabbing)",
  "hook": "Opening 3-second hook in ${lang.name}",
  "body": "Main story body in ${lang.name} (problem → discovery → demo → transformation)",
  "cta": "Genuine call to action in ${lang.name}",
  "fullScript": "Complete script in ${lang.name}. All sections included. Stage directions in parentheses. [SCREEN: ...] notes included.",
  "hashtags": ["relevant", "hashtags", "5-8 items"],
  "estimatedDuration": ${Math.min(spec.maxDuration, 55)},
  "storyBeats": [
    {"timestamp": "0:00-0:03", "beat": "HOOK", "emotion": "curiosity/shock"},
    {"timestamp": "0:03-0:13", "beat": "PROBLEM", "emotion": "empathy"},
    {"timestamp": "0:13-0:23", "beat": "DISCOVERY", "emotion": "hope"},
    {"timestamp": "0:23-0:43", "beat": "DEMO", "emotion": "excitement"},
    {"timestamp": "0:43-0:53", "beat": "TRANSFORMATION", "emotion": "happiness"},
    {"timestamp": "0:53-0:${Math.min(spec.maxDuration, 60)}", "beat": "CTA", "emotion": "sincerity"}
  ]
}

Respond ONLY with valid JSON.`

        const systemPrompt = `You are a world-class content strategist and storyteller.
Your expertise: Presenting products not as ads, but as genuine personal experience stories.
When people watch your videos, they don't think "this is an ad" — they think "my friend is recommending something."
IMPORTANT: Always respond in ${lang.name} (${lang.adLang}). Every single word of the script MUST be in ${lang.name}.`

        const result = await this.callLLM(prompt, systemPrompt)
        try {
            return JSON.parse(result)
        } catch {
            // Samimi bir fallback hikaye oluştur
            const painPoint = analysis.targetAudience.painPoints[0] || 'bir sorunu çözmek'
            return {
                title: `${analysis.name} hayatımı değiştirdi — ciddi söylüyorum`,
                hook: `${painPoint} yüzünden saatlerce uğraşıyordum. Ta ki bunu keşfedene kadar...`,
                body: `Hepimiz biliyoruz o duyguyu — ${painPoint}. Ben de aynı durumdalydım. Sonra ${analysis.name}'ı keşfettim. ${analysis.valueProposition}. İlk denediğimde inanamadım, gerçekten bu kadar kolay mıydı?`,
                cta: `Eğer siz de aynı sorunla uğraşıyorsanız, ${analysis.name}'a bir şans verin. Link bio'da. Ciddi söylüyorum, keşke daha önce bilseydim.`,
                fullScript: `${painPoint} yüzünden saatlerce uğraşıyordum. Ta ki bunu keşfedene kadar... Hepimiz biliyoruz o duyguyu — ${painPoint}. Ben de tam olarak aynı durumdalydım. Her seferinde aynı hayal kırıklığı. Sonra bir gün ${analysis.name}'ı keşfettim. [EKRAN: Ana sayfa gösteriliyor] ${analysis.valueProposition}. İlk denediğimde inanamadım — gerçekten bu kadar kolay mıydı? [EKRAN: Uygulama kullanım gösterimi] Ve sonuç? İlk haftada farkı gördüm. Eğer siz de aynı sorunla uğraşıyorsanız, ${analysis.name}'a bir şans verin. Link bio'da. Ciddi söylüyorum, keşke daha önce bilseydim.`,
                hashtags: [`#${analysis.name?.replace(/\s/g, '')}`, '#hayatıkolaylaştır', '#tavsiye', '#deneyim', '#teknoloji'],
                estimatedDuration: 45,
            }
        }
    }

    /**
     * Generate an AI Influencer profile
     */
    async generateInfluencerProfile(analysis: ProjectAnalysis, constitution: MarketingConstitution): Promise<InfluencerProfile> {
        const prompt = `
Create an AI Influencer character profile for marketing the following project.

Project: ${analysis.name}
Target Audience: ${JSON.stringify(analysis.targetAudience)}
Brand Voice: ${constitution.brandVoice}
Visual Style: ${constitution.visualGuidelines.style}

The AI influencer should be a virtual character that embodies the brand and connects with the target audience.

Respond with a JSON object:
{
  "name": "Influencer name",
  "personality": "Personality traits and communication style",
  "appearanceDescription": "Detailed visual description for AI generation",
  "visualProfile": {
    "gender": "male/female/neutral",
    "ageRange": "25-35",
    "style": "business casual/casual/formal",
    "features": "Key visual features"
  }
}

Respond ONLY with valid JSON.`

        const result = await this.callLLM(prompt)
        try {
            return JSON.parse(result)
        } catch {
            return {
                name: 'Alex Nova',
                personality: 'Friendly, professional, and enthusiastic about technology',
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
     * Generate video with AI influencer (Abacus.AI Video Engine)
     */
    async generateVideo(params: {
        script: string
        audioUrl: string
        influencerProfile: Record<string, unknown>
        screenshotUrls: string[]
        platform: 'instagram' | 'tiktok' | 'linkedin'
    }): Promise<{ videoUrl: string; thumbnailUrl: string }> {
        // This would call Abacus.AI's video generation API
        // For now, return a placeholder that will be replaced with actual API call
        const response = await fetch(`${ABACUS_API_BASE}/generateVideo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                deploymentToken: this.apiKey,
                arguments: {
                    script: params.script,
                    audio_url: params.audioUrl,
                    character_profile: params.influencerProfile,
                    overlay_images: params.screenshotUrls,
                    platform: params.platform,
                    lip_sync: true,
                    resolution: params.platform === 'linkedin' ? '1920x1080' : '1080x1920',
                },
            }),
        })

        if (!response.ok) {
            throw new Error(`Video generation failed: ${response.statusText}`)
        }

        const data = await response.json()
        return {
            videoUrl: data.video_url || '',
            thumbnailUrl: data.thumbnail_url || '',
        }
    }
}

export const abacusAI = new AbacusAIService()
export type { ProjectAnalysis, MarketingConstitution, VideoScript, InfluencerProfile }
