// =========================================
// ElevenLabs Voice Service Client
// Handles voice selection, cloning, and TTS
// =========================================

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'

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
     * List all available voices
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

        // Filter voices based on brand tone
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
        }).slice(0, 5) // Return top 5
    }

    /**
     * Generate speech from text
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        settings?: Partial<VoiceSettings>
    ): Promise<ArrayBuffer> {
        const defaultSettings: VoiceSettings = {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
        }

        const response = await fetch(
            `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Accept': 'audio/mpeg',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: { ...defaultSettings, ...settings },
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`Speech generation failed: ${response.statusText}`)
        }

        return response.arrayBuffer()
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
     * Preview a voice with sample text
     */
    async previewVoice(voiceId: string, sampleText?: string): Promise<ArrayBuffer> {
        const text = sampleText || 'Hello! I am your AI marketing influencer. Let me help you promote your brand to the world!'
        return this.generateSpeech(text, voiceId)
    }
}

export const elevenLabs = new ElevenLabsService()
export type { Voice, VoiceSettings }
