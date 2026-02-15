import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Language } from '@/lib/i18n/translations'

// Allow up to 2 minutes for influencer creation
export const maxDuration = 120

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

// Language-specific influencer generation config
const LANGUAGE_CONFIG: Record<Language, {
    langName: string
    nameInstruction: string
    promptLang: string
    systemNote: string
}> = {
    tr: {
        langName: 'Turkish',
        nameInstruction: 'a Turkish name (e.g. Elif, Berk, Zeynep, Emre)',
        promptLang: 'Tüm kişilik ve hikaye metinlerini TÜRKÇE yaz.',
        systemNote: 'You create Turkish virtual influencer personas. Write personality and backstory in TURKISH.',
    },
    en: {
        langName: 'English',
        nameInstruction: 'an English name (e.g. Sarah, James, Emily, Ryan)',
        promptLang: 'Write ALL personality and backstory text in ENGLISH.',
        systemNote: 'You create English-speaking virtual influencer personas. Write personality and backstory in ENGLISH.',
    },
    es: {
        langName: 'Spanish',
        nameInstruction: 'a Spanish name (e.g. Isabella, Carlos, Lucía, Diego)',
        promptLang: 'Escribe TODA la personalidad y la historia de fondo en ESPAÑOL.',
        systemNote: 'You create Spanish-speaking virtual influencer personas. Write personality and backstory in SPANISH.',
    },
    de: {
        langName: 'German',
        nameInstruction: 'a German name (e.g. Hannah, Lukas, Sophie, Maximilian)',
        promptLang: 'Schreibe ALLE Persönlichkeits- und Hintergrundtexte auf DEUTSCH.',
        systemNote: 'You create German-speaking virtual influencer personas. Write personality and backstory in GERMAN.',
    },
    fr: {
        langName: 'French',
        nameInstruction: 'a French name (e.g. Camille, Antoine, Chloé, Théo)',
        promptLang: 'Écris TOUTE la personnalité et l\'histoire en FRANÇAIS.',
        systemNote: 'You create French-speaking virtual influencer personas. Write personality and backstory in FRENCH.',
    },
}

export async function POST(req: NextRequest) {
    try {
        const { projectId, gender, language: requestLanguage, sector, environment, energy } = await req.json()
        const language: Language = requestLanguage || 'tr'

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
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

        // Get project data
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

        // Delete existing influencer for this project (user wants to recreate)
        const { data: existingInfluencer } = await supabase
            .from('ai_influencers')
            .select('id')
            .eq('project_id', projectId)
            .single()

        if (existingInfluencer) {
            await supabase
                .from('ai_influencers')
                .delete()
                .eq('id', existingInfluencer.id)
        }

        // Randomize personality
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

        const archetype = archetypes[Math.floor(Math.random() * archetypes.length)]
        const nameStyle = nameStyles[Math.floor(Math.random() * nameStyles.length)]
        const uniqueSeed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        const selectedGender = gender || 'female'
        const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['tr']

        const prompt = `Create a UNIQUE AI Influencer character profile for marketing the following project.
Generation seed: ${uniqueSeed} — use this to ensure uniqueness.

Project: ${project.name}
Description: ${project.description || ''}
Gender: ${selectedGender}
Language: ${langConfig.langName}

CREATIVE DIRECTION:
- Personality archetype: ${archetype}
- Name: Give them ${langConfig.nameInstruction} OR ${nameStyle}
- ${langConfig.promptLang}

The AI influencer should be a virtual character that:
- Has a memorable, UNIQUE name (first and last name) — NEVER use generic names like "Alex Nova" or "Ada"
- Has a rich backstory explaining who they are
- Embodies the brand values
- Has a distinct personality matching the archetype
- IMPORTANT: Read the project description carefully. If it mentions a specific LOCATION or SETTING (e.g. café, gym, park, kitchen, studio, beach, restaurant, etc.), use that as the sceneEnvironment. If no specific location is mentioned, choose a setting that fits the project topic.
${sector ? `- SECTOR/INDUSTRY: ${sector} — tailor the influencer's personality, style and backstory to this specific industry.` : ''}
${environment ? `- PREFERRED ENVIRONMENT: ${environment} — use this as the primary sceneEnvironment.` : ''}
${energy ? `- ENERGY LEVEL: ${energy} — match the influencer's personality to this energy (e.g. sakin=calm expert, enerjik=bold challenger, samimi=friendly mentor).` : ''}

Respond with ONLY valid JSON (no markdown formatting):
{
  "name": "A creative, memorable influencer name",
  "personality": "Detailed personality traits (2-3 sentences)",
  "backstory": "A compelling backstory (3-5 sentences)",
  "appearanceDescription": "Detailed visual description for AI image generation including clothing, hair, expression",
  "sceneEnvironment": "The physical setting/location where the influencer is (e.g. 'cozy café with warm lighting', 'modern gym with equipment', 'sunny park bench', 'sleek home kitchen'). Must match the project description context.",
  "visualProfile": {
    "gender": "${selectedGender}",
    "ageRange": "25-35",
    "style": "casual/sporty/business casual/formal — pick what fits the scene",
    "features": "Key visual features"
  }
}`

        // Call OpenRouter directly
        const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                messages: [
                    {
                        role: 'system',
                        content: langConfig.systemNote,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.95,
                max_tokens: 1024,
            }),
        })

        if (!llmResponse.ok) {
            const errorBody = await llmResponse.text().catch(() => '')
            throw new Error(`OpenRouter error: ${llmResponse.status} ${errorBody}`)
        }

        const llmData = await llmResponse.json()
        const content = llmData.choices?.[0]?.message?.content || '{}'

        let profile;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            profile = JSON.parse(cleaned)
        } catch {
            // Randomized fallback
            const fallbackNames = ['Zara Pulse', 'Leo Vantis', 'Maya Drift', 'Kai Ember', 'Nora Flux', 'Ravi Crest', 'Lina Spark', 'Theo Blaze']
            profile = {
                name: fallbackNames[Math.floor(Math.random() * fallbackNames.length)],
                personality: 'Charismatic, energetic, and authentic. Connects with audiences through genuine enthusiasm.',
                backstory: 'A passionate digital creator who found their calling in connecting innovative brands with people.',
                appearanceDescription: 'Professional and stylish appearance with warm expression',
                visualProfile: { gender: selectedGender, ageRange: '25-35', style: 'business casual', features: 'expressive eyes' },
            }
        }

        // Generate avatar using fal.ai directly (server-side)
        const FAL_KEY = process.env.FAL_KEY || ''
        const vp = profile.visualProfile || {}
        const genderWord = selectedGender === 'male' ? 'man' : 'woman'
        const age = vp.ageRange || '28'

        // Extract Visual DNA from constitution for brand-consistent avatar
        const constitution = project.marketing_constitution as Record<string, unknown> | undefined
        const visualDna = (constitution?.visualDna as string) || ''

        const appearance = (profile.appearanceDescription || '').substring(0, 150)
        const scene = (profile.sceneEnvironment || 'modern office environment').substring(0, 100)
        const dnaKeywords = visualDna ? `, ${visualDna}` : ''
        const avatarPrompt = `Professional photorealistic medium shot portrait of a ${genderWord} aged ${age}, visible from waist up, ${appearance || 'stylish and professional'}, sitting or standing naturally in ${scene}, relaxed natural pose, soft cinematic lighting, warm confident expression looking at camera, 8k uhd, sharp focus, shot on 85mm lens${dnaKeywords}. Avoid: extreme close-up, tight headshot, cropped face, lowres, bad anatomy, text overlap, distorted UI, cartoon, unrealistic skin, blurry, watermark, logo, text, deformed, disfigured, extra limbs`

        let avatarUrl = ''
        try {
            if (FAL_KEY) {
                const falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Key ${FAL_KEY}`,
                    },
                    body: JSON.stringify({
                        prompt: avatarPrompt,
                        aspect_ratio: '1:1',
                        resolution: '1K',
                        num_images: 1,
                        output_format: 'png',
                        safety_tolerance: '2',
                    }),
                })

                if (falResponse.ok) {
                    const falData = await falResponse.json()
                    avatarUrl = falData.images?.[0]?.url || ''
                    console.log('fal.ai avatar generated:', avatarUrl ? 'success' : 'empty URL')
                } else {
                    const errText = await falResponse.text().catch(() => '')
                    console.error('fal.ai error:', falResponse.status, errText)
                }
            } else {
                console.warn('FAL_KEY not set, skipping avatar generation')
            }
        } catch (imgErr) {
            console.error('fal.ai avatar generation failed:', imgErr)
        }

        // Fallback: use a placeholder if fal.ai fails
        if (!avatarUrl) {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=512&background=7c3aed&color=fff&bold=true`
        }

        // Save to database
        const { data: newInfluencer, error: insertError } = await supabase
            .from('ai_influencers')
            .insert({
                project_id: projectId,
                name: profile.name,
                gender: selectedGender,
                personality: profile.personality,
                backstory: profile.backstory,
                appearance_description: profile.appearanceDescription,
                visual_profile: profile.visualProfile,
                avatar_url: avatarUrl,
                status: 'ready',
            })
            .select()
            .single()

        if (insertError) {
            throw new Error(`Database error: ${insertError.message}`)
        }

        return NextResponse.json({
            success: true,
            influencer: {
                id: newInfluencer.id,
                name: profile.name,
                personality: profile.personality,
                backstory: profile.backstory,
                avatarUrl,
            },
        })
    } catch (error) {
        console.error('Influencer creation error:', error)
        return NextResponse.json(
            { error: 'Influencer creation failed', details: String(error) },
            { status: 500 }
        )
    }
}
