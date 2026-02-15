// =========================================
// ElevenLabs Voice Service Client
// Global Voice Library + TTS Generation
// =========================================

import type { Language } from '@/lib/i18n/translations'

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'

// ─── Types ────────────────────────────────────────────────
interface Voice {
    voice_id: string
    name: string
    category: string
    labels: Record<string, string>
    preview_url: string
}

interface VoiceSettings {
    stability: number
    similarity_boost: number
    style: number
    use_speaker_boost: boolean
}

type Gender = 'male' | 'female'

interface VoiceEntry {
    voiceId: string
    name: string
    character: string     // e.g. "Profesyonel", "Dinamik"
    gender: Gender
}

// ─── Optimized Voice Settings (Natural Sounding) ────────
// Tuned for expressive, natural-sounding influencer narration
const NATURAL_VOICE_SETTINGS: VoiceSettings = {
    stability: 0.35,          // Lower = more expressive, less monotone
    similarity_boost: 0.85,   // High fidelity to original voice character
    style: 0.45,              // Higher = more natural inflection & emotion
    use_speaker_boost: true,  // Enhances clarity & presence
}

// ─── Global Voice Library ─────────────────────────────────
// 20 pre-selected multilingual voices (4 per language)
// All voices use eleven_multilingual_v2 which auto-detects language
// Voice IDs are from ElevenLabs premade library (verified)
//
// Strategy: Since eleven_multilingual_v2 handles ANY language with
// the same voice ID, we pick the best-sounding voices per language
// based on verified_languages from the ElevenLabs API.

export const VOICE_LIBRARY: Record<Language, VoiceEntry[]> = {
    // 🇹🇷 Turkish — Custom Turkish voices (user-selected)
    tr: [
        { voiceId: '8eSMFxjAUgbRqmAkLPBt', name: 'Türk Kadın 1', character: 'Doğal', gender: 'female' },
        { voiceId: 'jbJMQWv1eS4YjQ6PCcn6', name: 'Türk Kadın 2', character: 'Modern', gender: 'female' },
        { voiceId: 'c8cLMUvGlREhTqM1J5zV', name: 'Türk Erkek 1', character: 'Doğal', gender: 'male' },
        { voiceId: 'Vv1QW9Yx3WB2mLKFmyZG', name: 'Türk Erkek 2', character: 'Güçlü', gender: 'male' },
    ],

    // 🇬🇧 English — Custom female + premade male voices
    en: [
        { voiceId: 'uYXf8XasLslADfZ2MB4u', name: 'EN Kadın 1', character: 'Professional', gender: 'female' },
        { voiceId: 'NDTYOmYEjbDIVCKB35i3', name: 'EN Kadın 2', character: 'Warm', gender: 'female' },
        { voiceId: 'cjVigY5qzO86Huf0OWal', name: 'Eric', character: 'Trustworthy', gender: 'male' },
        { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian', character: 'Dynamic', gender: 'male' },
    ],

    // 🇪🇸 Spanish — Voices verified for ES-ES locale
    es: [
        { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', character: 'Cálida', gender: 'female' },
        { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', character: 'Enérgica', gender: 'female' },
        { voiceId: 'cjVigY5qzO86Huf0OWal', name: 'Eric', character: 'Elegante', gender: 'male' },
        { voiceId: 'bIHbv24MWmeRgasZH58o', name: 'Will', character: 'Carismático', gender: 'male' },
    ],

    // 🇩🇪 German — Voices verified for DE-DE locale
    de: [
        { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', character: 'Klar', gender: 'female' },
        { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', character: 'Freundlich', gender: 'female' },
        { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian', character: 'Zuverlässig', gender: 'male' },
        { voiceId: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', character: 'Natürlich', gender: 'male' },
    ],

    // 🇫🇷 French — Voices verified for FR-FR locale
    fr: [
        { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', character: 'Élégante', gender: 'female' },
        { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', character: 'Douce', gender: 'female' },
        { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', character: 'Raffiné', gender: 'male' },
        { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Chris', character: 'Naturel', gender: 'male' },
    ],
}

// ─── Voice Selection Helper ───────────────────────────────

/**
 * Get the best voice for a given language + gender
 * Returns the first matching voice (primary recommendation)
 */
export function getVoiceForLanguage(
    language: Language,
    gender: Gender = 'female'
): VoiceEntry {
    const voices = VOICE_LIBRARY[language] || VOICE_LIBRARY['en']
    const match = voices.find(v => v.gender === gender)
    return match || voices[0]
}

/**
 * Get all voices for a language, optionally filtered by gender
 */
export function getVoicesForLanguage(
    language: Language,
    gender?: Gender
): VoiceEntry[] {
    const voices = VOICE_LIBRARY[language] || VOICE_LIBRARY['en']
    if (gender) return voices.filter(v => v.gender === gender)
    return voices
}

/**
 * Get a random voice for variety across videos
 */
export function getRandomVoice(
    language: Language,
    gender?: Gender
): VoiceEntry {
    const voices = getVoicesForLanguage(language, gender)
    return voices[Math.floor(Math.random() * voices.length)]
}

// ─── ElevenLabs Service Class ─────────────────────────────

class ElevenLabsService {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY || ''
    }

    private getHeaders(): Record<string, string> {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
        }
    }

    /**
     * List all available voices from ElevenLabs account
     */
    async listVoices(): Promise<Voice[]> {
        const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.voices || []
    }

    /**
     * Get recommended voices for a brand profile
     */
    async getRecommendedVoices(brandTone: string): Promise<Voice[]> {
        const voices = await this.listVoices()

        const toneMap: Record<string, string[]> = {
            professional: ['professional', 'narrative', 'news'],
            casual: ['conversational', 'casual', 'young'],
            playful: ['animated', 'young', 'conversational'],
            authoritative: ['professional', 'strong', 'narrative'],
        }

        const preferredLabels = toneMap[brandTone.toLowerCase()] || toneMap['professional']

        return voices.filter(voice => {
            const voiceLabels = Object.values(voice.labels).map(l => l.toLowerCase())
            return preferredLabels.some(pref =>
                voiceLabels.some(vl => vl.includes(pref))
            )
        }).slice(0, 5)
    }

    /**
     * Generate speech from text using ElevenLabs TTS
     * Uses eleven_multilingual_v2 for automatic language detection
     *
     * @param text - Script text (in target language)
     * @param voiceId - ElevenLabs voice ID
     * @param settings - Optional voice settings override
     * @returns ArrayBuffer of MP3 audio
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        settings?: Partial<VoiceSettings>
    ): Promise<ArrayBuffer> {
        console.log(`[ElevenLabs] Generating speech: ${text.length} chars, voice: ${voiceId}`)

        const finalSettings = { ...NATURAL_VOICE_SETTINGS, ...settings }

        const response = await fetch(
            `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Accept': 'audio/mpeg',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: finalSettings,
                }),
            }
        )

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'unknown')
            throw new Error(`Speech generation failed: ${response.status} ${response.statusText} - ${errorBody}`)
        }

        const audioBuffer = await response.arrayBuffer()
        console.log(`[ElevenLabs] ✅ Audio generated: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`)
        return audioBuffer
    }

    /**
     * Generate speech for video pipeline
     * Automatically selects voice based on language and gender
     */
    async generateVideoAudio(
        script: string,
        language: Language,
        gender: Gender = 'female',
        specificVoiceId?: string
    ): Promise<{ audioBuffer: ArrayBuffer; voiceId: string; voiceName: string }> {
        // Use specific voice ID if provided, otherwise auto-select
        let voiceId: string
        let voiceName: string

        if (specificVoiceId) {
            voiceId = specificVoiceId
            voiceName = 'custom'
        } else {
            const voice = getVoiceForLanguage(language, gender)
            voiceId = voice.voiceId
            voiceName = voice.name
        }

        console.log(`[ElevenLabs] Video audio: lang=${language}, gender=${gender}, voice=${voiceName} (${voiceId})`)

        const audioBuffer = await this.generateSpeech(script, voiceId)

        return { audioBuffer, voiceId, voiceName }
    }

    /**
     * Clone a voice from audio samples
     */
    async cloneVoice(
        name: string,
        description: string,
        audioFiles: File[]
    ): Promise<Voice> {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('description', description)

        audioFiles.forEach(file => {
            formData.append('files', file)
        })

        const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
            method: 'POST',
            headers: {
                'xi-api-key': this.apiKey,
            },
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Voice cloning failed: ${response.statusText}`)
        }

        const data = await response.json()
        return data
    }

    /**
     * Get voice settings
     */
    async getVoiceSettings(voiceId: string): Promise<VoiceSettings> {
        const response = await fetch(
            `${ELEVENLABS_API_BASE}/voices/${voiceId}/settings`,
            { headers: this.getHeaders() }
        )

        if (!response.ok) {
            throw new Error(`Failed to get voice settings: ${response.statusText}`)
        }

        return response.json()
    }

    /**
     * Preview a voice with sample text in the target language
     */
    async previewVoice(voiceId: string, language: Language = 'en'): Promise<ArrayBuffer> {
        const sampleTexts: Record<Language, string> = {
            tr: 'Merhaba! Ben sizin AI pazarlama etkileyicinizim. Markanızı dünyaya tanıtmanıza yardımcı olayım!',
            en: 'Hello! I am your AI marketing influencer. Let me help you promote your brand to the world!',
            es: '¡Hola! Soy tu influencer de marketing con IA. ¡Déjame ayudarte a promocionar tu marca!',
            de: 'Hallo! Ich bin Ihr KI-Marketing-Influencer. Lassen Sie mich Ihnen helfen, Ihre Marke zu bewerben!',
            fr: 'Bonjour ! Je suis votre influenceur marketing IA. Laissez-moi vous aider à promouvoir votre marque !',
        }
        return this.generateSpeech(sampleTexts[language] || sampleTexts['en'], voiceId)
    }
}

export const elevenLabs = new ElevenLabsService()
export type { Voice, VoiceSettings, VoiceEntry, Gender }
