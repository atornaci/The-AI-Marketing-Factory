import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Language } from '@/lib/i18n/translations'

// Allow up to 2 minutes for influencer creation
export const maxDuration = 120

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

// ─── UGC Video Machine Master System Prompt ───
// This system prompt governs ALL character generation.
// Key principle: Identity Freeze — once defined, maintain exact physical parameters.
const UGC_SYSTEM_PROMPT = `Role: You are the "UGC Video Machine" Engine. Your sole purpose is to generate ultra-realistic, consistent social media influencer characters.

Core Logic:
1. Identity Freeze: Once a character is defined (features, hair, skin texture, age), maintain these EXACT parameters across all outputs. Include specific: ethnicity, eye color, hair texture/length, facial markers.
2. UGC Realism DNA: Characters must look like real smartphone selfie creators, NOT models or actors.
3. Human Imperfections: Include visible pores, flyaway hairs, natural skin redness, non-perfect teeth, real human features.
4. Strictly Avoid: "Cinematic," "Studio lighting," "Professional photography," "Perfect skin," "Model look."

Output Structure: For every request, provide a complete [Character Identity] with frozen physical parameters.`

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
        systemNote: UGC_SYSTEM_PROMPT + '\n\nLANGUAGE: Write personality and backstory in TURKISH.',
    },
    en: {
        langName: 'English',
        nameInstruction: 'an English name (e.g. Sarah, James, Emily, Ryan)',
        promptLang: 'Write ALL personality and backstory text in ENGLISH.',
        systemNote: UGC_SYSTEM_PROMPT + '\n\nLANGUAGE: Write personality and backstory in ENGLISH.',
    },
    es: {
        langName: 'Spanish',
        nameInstruction: 'a Spanish name (e.g. Isabella, Carlos, Lucía, Diego)',
        promptLang: 'Escribe TODA la personalidad y la historia de fondo en ESPAÑOL.',
        systemNote: UGC_SYSTEM_PROMPT + '\n\nLANGUAGE: Write personality and backstory in SPANISH.',
    },
    de: {
        langName: 'German',
        nameInstruction: 'a German name (e.g. Hannah, Lukas, Sophie, Maximilian)',
        promptLang: 'Schreibe ALLE Persönlichkeits- und Hintergrundtexte auf DEUTSCH.',
        systemNote: UGC_SYSTEM_PROMPT + '\n\nLANGUAGE: Write personality and backstory in GERMAN.',
    },
    fr: {
        langName: 'French',
        nameInstruction: 'a French name (e.g. Camille, Antoine, Chloé, Théo)',
        promptLang: 'Écris TOUTE la personnalité et l\'histoire en FRANÇAIS.',
        systemNote: UGC_SYSTEM_PROMPT + '\n\nLANGUAGE: Write personality and backstory in FRENCH.',
    },
}

export async function POST(req: NextRequest) {
    try {
        const { projectId, gender, language: requestLanguage, sector, environment, energy } = await req.json()
        const language: Language = requestLanguage || 'en'

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
        const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en']

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

IDENTITY FREEZE — PHYSICAL DESCRIPTION REQUIREMENTS:
The "appearanceDescription" field must be EXTREMELY DETAILED and include ALL of the following:
- Exact ethnicity and skin tone (e.g. "light olive Mediterranean skin", "warm brown South Asian skin")
- Eye color and shape (e.g. "deep brown almond-shaped eyes", "green-hazel round eyes")
- Hair texture, length, color, and style (e.g. "shoulder-length wavy dark brown hair with natural highlights, slightly messy")
- Specific facial markers: freckles, moles, dimples, or beauty marks (e.g. "small mole on left cheek, light freckles across nose bridge")
- Teeth description (e.g. "slightly uneven front teeth", "warm wide smile with visible canines")
- Any piercings or distinctive features (e.g. "small gold nose stud", "thick natural eyebrows")
- Body type hint (e.g. "average build", "athletic", "curvy")
- Do NOT describe as "perfect" or "model-like" — make them look like a REAL relatable person

Respond with ONLY valid JSON (no markdown formatting):
{
  "name": "A creative, memorable influencer name",
  "personality": "Detailed personality traits (2-3 sentences)",
  "backstory": "A compelling backstory (3-5 sentences)",
  "appearanceDescription": "EXTREMELY DETAILED physical description following the Identity Freeze requirements above. Must include: ethnicity, skin tone, eye color/shape, hair texture/length/color, facial markers (moles/freckles/dimples), teeth, any piercings, body type. This is the CHARACTER MAP used for ALL future image and video generation.",
  "sceneEnvironment": "The physical setting/location where the influencer is (e.g. 'cozy café with warm lighting', 'modern gym with equipment', 'sunny park bench', 'sleek home kitchen'). Must match the project description context.",
  "visualProfile": {
    "gender": "${selectedGender}",
    "ageRange": "25-35",
    "ethnicity": "specific ethnicity",
    "eyeColor": "specific eye color",
    "hairDescription": "detailed hair description",
    "facialMarkers": "moles, freckles, dimples, or other markers",
    "style": "casual/sporty/business casual/formal — pick what fits the scene",
    "features": "Key visual features including piercings, tattoos, glasses etc."
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

        // ═══ MULTI-REFERENCE PHOTO PACK ═══
        // Generate 6 reference photos showing the same person in different postures/scenes
        // This enables video generation to match the correct reference photo to the scene
        const FAL_KEY = process.env.FAL_KEY || ''
        const vp = profile.visualProfile || {}
        const genderWord = selectedGender === 'male' ? 'man' : 'woman'
        const age = vp.ageRange || '28'

        // Extract Visual DNA from constitution for brand-consistent avatar
        const constitution = project.marketing_constitution as Record<string, unknown> | undefined
        const visualDna = (constitution?.visualDna as string) || ''

        const appearance = (profile.appearanceDescription || '').substring(0, 300)
        const dnaKeywords = visualDna ? `, ${visualDna}` : ''

        // ─── SECTOR-AWARE STYLING ───
        // Adjust appearance emphasis based on industry
        const sectorStyles: Record<string, string> = {
            'beauty': 'glowing healthy skin, well-groomed, subtle natural makeup, radiant complexion, photogenic',
            'fitness': 'athletic build, healthy glow, sporty energy, strong posture, confident expression',
            'technology': 'smart casual style, clean-cut, modern and professional, approachable',
            'fashion': 'stylish and trendy, fashion-forward, well-coordinated outfit, editorial feel',
            'food': 'warm and inviting, homey apron or casual chef style, friendly smile',
            'health': 'clean and healthy look, warm calming presence, trustworthy expression',
            'education': 'approachable and intelligent, smart casual, warm and friendly',
            'ecommerce': 'modern lifestyle look, aspirational but relatable, casual chic',
            'finance': 'professional and polished, business casual, confident and trustworthy',
            'realestate': 'polished professional, business attire, confident smile',
            'travel': 'adventurous casual look, sun-kissed, relaxed and happy',
            'automotive': 'modern casual, confident stance, clean-cut appearance',
        }
        const sectorStyle = sector ? (sectorStyles[sector] || 'attractive, well-groomed, photogenic') : 'attractive, well-groomed, photogenic'

        // Use user-selected environment if available, otherwise use defaults per photo type
        const userEnvLabel = environment || ''

        // ─── Reference Photo Configurations ───
        // Each config creates a DISTINCTLY DIFFERENT photo: different body position, different environment, different outfit
        const photoConfigs = [
            {
                type: 'portrait' as const,
                scene: userEnvLabel || 'bright airy room with soft natural window light, clean minimal background',
                posture: 'standing straight facing camera, arms relaxed at sides, confident open body language, warm genuine smile, eyes wide open looking directly into lens',
                framing: 'IMPORTANT: Show from HEAD to WAIST. Upper body portrait. NOT just face. Arms and hands must be visible',
                outfit: 'casual stylish top, well-fitted',
            },
            {
                type: 'sitting' as const,
                scene: 'cozy café interior, warm amber lighting, wooden table with coffee cup and pastry, other customers softly blurred behind',
                posture: 'sitting at a café table, both hands wrapped around a coffee cup, leaning slightly forward with elbows on table, relaxed friendly smile, looking at camera',
                framing: 'IMPORTANT: Show from HEAD to WAIST. Table and hands clearly visible. NOT just face',
                outfit: 'cozy sweater or casual blouse, accessories like a watch or bracelet',
            },
            {
                type: 'standing' as const,
                scene: 'bright modern kitchen with white countertop, morning sunlight streaming through window, fresh fruit and plants visible',
                posture: 'standing behind kitchen counter, one hand resting on countertop, other hand holding a glass, body turned slightly at 3/4 angle, warm smile',
                framing: 'IMPORTANT: Show from HEAD to HIPS. Full upper body with counter visible. Wide framing. NOT close-up',
                outfit: 'casual comfortable home clothes, simple t-shirt or blouse',
            },
            {
                type: 'walking' as const,
                scene: 'sunny tree-lined city sidewalk, buildings and shops softly blurred behind, golden afternoon light, urban atmosphere',
                posture: 'walking toward camera on sidewalk, mid-stride with one foot forward, bag over shoulder, looking at camera with natural candid smile, hair slightly moving',
                framing: 'IMPORTANT: Show from HEAD to KNEES. Full walking pose visible. Wide shot showing street behind. NOT just face',
                outfit: 'casual street style outfit, denim jacket or light coat, sunglasses on head',
            },
            {
                type: 'office' as const,
                scene: 'modern home office with MacBook on desk, desk lamp, coffee mug, bookshelf in background, soft daylight from window',
                posture: 'sitting at desk in an office chair, one hand on laptop keyboard, turned toward camera, professional confident expression, slight smile',
                framing: 'IMPORTANT: Show from HEAD to WAIST. Desk, laptop, and hands clearly visible. NOT just face',
                outfit: 'business casual, neat blouse or button-up shirt',
            },
            {
                type: 'outdoor' as const,
                scene: 'green park with trees and grass, warm golden hour sunlight, nature background with soft bokeh, peaceful atmosphere',
                posture: 'sitting on a wooden park bench, legs crossed, one arm resting on bench back, relaxed and happy expression, looking at camera',
                framing: 'IMPORTANT: Show from HEAD to KNEES. Full seated pose on bench visible. Park setting clearly shown. NOT just face',
                outfit: 'relaxed weekend outfit, light jacket or casual dress',
            },
        ]

        // Build prompts for all 6 photos — SECTOR-AWARE, ATTRACTIVE, WIDE FRAMING
        const photoPrompts = photoConfigs.map(config => ({
            type: config.type,
            scene: config.scene,
            posture: config.posture,
            prompt: `Photo of an attractive ${genderWord} aged ${age}. ${sectorStyle}. ${appearance || 'naturally beautiful'}. Wearing ${config.outfit}.

BODY POSITION: ${config.posture}.
ENVIRONMENT: ${config.scene}.
FRAMING: ${config.framing}.

The photo should look like a high-quality Instagram photo taken by a friend on an iPhone. Natural lighting from the environment. The person looks confident, approachable, and camera-ready. Eyes are OPEN and looking at the camera. Warm, genuine expression.

CRITICAL FRAMING RULE: This is a MEDIUM-WIDE shot. The person's FULL UPPER BODY must be visible including arms, hands, and torso. Do NOT crop tightly on the face. The person should occupy 50-60% of the frame, with the environment clearly visible around them.

Style: social media influencer photo, Instagram aesthetic, natural lighting, candid but polished, aspirational lifestyle${dnaKeywords}.

AVOID: extreme close-up, face-only, headshot, cropped at neck, ugly, unflattering, closed eyes, sleeping, frowning, blurry, cartoon, CGI, 3D render, watermark, text, deformed, extra limbs, bad anatomy`,
        }))

        // Generate all 6 photos in parallel for speed
        interface ReferencePhoto {
            url: string
            type: 'portrait' | 'sitting' | 'standing' | 'walking' | 'office' | 'outdoor'
            scene: string
            posture: string
        }
        let referencePhotos: ReferencePhoto[] = []
        let avatarUrl = ''

        try {
            if (FAL_KEY) {
                console.log(`[Influencer] Generating ${photoPrompts.length} reference photos in parallel...`)

                const photoResults = await Promise.allSettled(
                    photoPrompts.map(async (config) => {
                        const falResponse = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Key ${FAL_KEY}`,
                            },
                            body: JSON.stringify({
                                prompt: config.prompt,
                                aspect_ratio: '9:16',
                                resolution: '1K',
                                num_images: 1,
                                output_format: 'png',
                                safety_tolerance: '2',
                            }),
                        })

                        if (!falResponse.ok) {
                            const errText = await falResponse.text().catch(() => '')
                            throw new Error(`fal.ai error ${falResponse.status}: ${errText}`)
                        }

                        const falData = await falResponse.json()
                        const url = falData.images?.[0]?.url || ''
                        if (!url) throw new Error('Empty URL from fal.ai')

                        return {
                            url,
                            type: config.type,
                            scene: config.scene,
                            posture: config.posture,
                        } as ReferencePhoto
                    })
                )

                // Collect successful results
                referencePhotos = photoResults
                    .filter((r): r is PromiseFulfilledResult<ReferencePhoto> => r.status === 'fulfilled')
                    .map(r => r.value)

                console.log(`[Influencer] ✅ Generated ${referencePhotos.length}/${photoPrompts.length} reference photos`)

                // Use portrait as main avatar, fallback to first available
                const portraitPhoto = referencePhotos.find(p => p.type === 'portrait')
                avatarUrl = portraitPhoto?.url || referencePhotos[0]?.url || ''

                // Log any failures
                photoResults.forEach((r, i) => {
                    if (r.status === 'rejected') {
                        console.warn(`[Influencer] ⚠️ Photo ${photoConfigs[i].type} failed:`, r.reason)
                    }
                })
            } else {
                console.warn('FAL_KEY not set, skipping reference photo generation')
            }
        } catch (imgErr) {
            console.error('Reference photo generation failed:', imgErr)
        }

        // Fallback: use a placeholder if all photos failed
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
                reference_photos: referencePhotos,
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
