import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Allow up to 2 minutes for influencer creation
export const maxDuration = 120

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

export async function POST(req: NextRequest) {
    try {
        const { projectId, gender } = await req.json()

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

        const prompt = `Create a UNIQUE AI Influencer character profile for marketing the following project.
Generation seed: ${uniqueSeed} — use this to ensure uniqueness.

Project: ${project.name}
Description: ${project.description || ''}
Gender: ${selectedGender}

CREATIVE DIRECTION:
- Personality archetype: ${archetype}
- Name style: Give them ${nameStyle}

The AI influencer should be a virtual character that:
- Has a memorable, UNIQUE name (first and last name) — NEVER use generic names like "Alex Nova" or "Ada"
- Has a rich backstory explaining who they are
- Embodies the brand values
- Has a distinct personality matching the archetype

Respond with ONLY valid JSON (no markdown formatting):
{
  "name": "A creative, memorable influencer name",
  "personality": "Detailed personality traits (2-3 sentences)",
  "backstory": "A compelling backstory (3-5 sentences)",
  "appearanceDescription": "Detailed visual description for AI image generation",
  "visualProfile": {
    "gender": "${selectedGender}",
    "ageRange": "25-35",
    "style": "business casual/casual/formal",
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
                        content: 'You are an AI character designer. Create unique, memorable influencer personas. Respond ONLY with valid JSON, no markdown formatting.',
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
        const dnaKeywords = visualDna ? `, ${visualDna}` : ''
        const avatarPrompt = `Professional photorealistic portrait headshot of a ${genderWord} aged ${age}, ${appearance || 'stylish and professional'}, clean studio background, soft lighting, warm confident expression, high-end corporate headshot style, 8k uhd, sharp focus${dnaKeywords}`

        let avatarUrl = ''
        try {
            if (FAL_KEY) {
                const falResponse = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Key ${FAL_KEY}`,
                    },
                    body: JSON.stringify({
                        prompt: avatarPrompt,
                        negative_prompt: 'lowres, bad anatomy, text overlap, distorted UI, cartoon, messy background, unrealistic skin, blurry, watermark, logo, text, deformed, disfigured, extra limbs',
                        image_size: { width: 512, height: 512 },
                        num_images: 1,
                        output_format: 'png',
                        enable_safety_checker: true,
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
