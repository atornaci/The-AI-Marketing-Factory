import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
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

        // ═══ RATE LIMITING ═══
        const rateCheck = checkRateLimit(user.id, 'create-influencer', RATE_LIMITS.AI_GENERATION)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
                { status: 429, headers: rateLimitHeaders(rateCheck) }
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

        // ═══ IDENTITY-FIRST APPEARANCE ═══
        // Extract key identity markers from visual profile and put them FIRST in the prompt
        // This prevents the image model from defaulting to a single ethnicity
        const ethnicity = vp.ethnicity || ''
        const eyeColor = vp.eyeColor || ''
        const hairDesc = vp.hairDescription || ''
        const facialMarkers = vp.facialMarkers || ''

        // Build identity string: ethnicity + hair + eyes (most visually impactful features)
        const identityParts = [
            ethnicity,
            hairDesc,
            eyeColor ? `${eyeColor} eyes` : '',
            facialMarkers,
        ].filter(Boolean)
        const identityString = identityParts.length > 0
            ? identityParts.join(', ')
            : (profile.appearanceDescription || '').substring(0, 300)

        const dnaKeywords = visualDna ? `, ${visualDna}` : ''

        // ─── SECTOR-AWARE STYLING ───
        // Adjust appearance emphasis AND clothing based on industry
        const sectorStyles: Record<string, { style: string; outfits: Record<string, string> }> = {
            'beauty': {
                style: 'glowing healthy skin, well-groomed, subtle natural makeup, radiant complexion, photogenic',
                outfits: {
                    portrait: 'elegant satin blouse with delicate gold necklace, fresh dewy makeup look',
                    sitting: 'chic wrap dress or silk camisole, pearl earrings, polished nails',
                    standing: 'tailored midi skirt with fitted knit top, layered bracelets',
                    walking: 'flowy sundress with strappy sandals, oversized sunglasses',
                    office: 'structured blazer over lace-trimmed camisole, statement ring',
                    outdoor: 'wide-brim hat, linen shirt dress, minimal gold jewelry',
                },
            },
            'fitness': {
                style: 'athletic build, healthy glow, sporty energy, strong posture, confident expression, toned physique',
                outfits: {
                    portrait: 'fitted compression top with zip-up collar, sports watch, toned arms visible',
                    sitting: 'performance tank top, towel around neck, water bottle nearby',
                    standing: 'matching workout set (sports bra + high-waist leggings), cross-training shoes',
                    walking: 'running shorts and breathable mesh top, running sneakers, fitness tracker',
                    office: 'athletic polo shirt, clean sporty joggers, smart fitness watch',
                    outdoor: 'lightweight windbreaker over sports tank, running shoes, sweatband',
                },
            },
            'technology': {
                style: 'smart casual style, clean-cut, modern and professional, tech-savvy vibe',
                outfits: {
                    portrait: 'slim-fit henley shirt, premium headphones around neck, smart watch',
                    sitting: 'crisp button-down with rolled-up sleeves, minimalist watch, laptop visible',
                    standing: 'modern quarter-zip pullover, dark chinos, clean white sneakers',
                    walking: 'bomber jacket over graphic tee, slim jeans, AirPods in ear',
                    office: 'fitted crew-neck sweater over collared shirt, glasses, clean desk setup',
                    outdoor: 'tech-wear jacket with hidden pockets, dark joggers, futuristic sneakers',
                },
            },
            'fashion': {
                style: 'stylish and trendy, fashion-forward, well-coordinated outfit, editorial feel, haute couture inspired',
                outfits: {
                    portrait: 'designer structured blazer with statement brooch, silk scarf draped elegantly',
                    sitting: 'tailored co-ord set in bold color, designer bag visible, layered gold chains',
                    standing: 'runway-inspired outfit: oversized coat over fitted turtleneck, leather boots',
                    walking: 'street-style look: trench coat, designer sunglasses, crossbody bag, pointed heels',
                    office: 'power suit in unexpected color (burgundy, emerald), statement earrings',
                    outdoor: 'curated casual: cashmere cardigan, wide-leg trousers, luxury loafers',
                },
            },
            'food': {
                style: 'warm and inviting, homey chef style, friendly smile, food-lover energy',
                outfits: {
                    portrait: 'clean chef coat slightly open over plain t-shirt, warm smile, flour dusting on hands',
                    sitting: 'linen apron over casual shirt, wooden table with ingredients visible',
                    standing: 'rolled-sleeve chambray shirt, canvas apron, cooking utensil in hand',
                    walking: 'casual flannel shirt, jeans, carrying a basket of fresh produce',
                    office: 'smart casual — fitted V-neck sweater, clean apron hanging nearby',
                    outdoor: 'casual chef look: henley shirt, outdoor BBQ or garden setting',
                },
            },
            'travel': {
                style: 'adventurous look, sun-kissed skin, relaxed and happy, explorer aesthetic',
                outfits: {
                    portrait: 'safari-style linen shirt, adventure watch, slight sunburn, travel-worn look',
                    sitting: 'relaxed tropical shirt, woven bracelet, passport/map visible on table',
                    standing: 'cargo vest over fitted tee, hiking boots, backpack slung over one shoulder',
                    walking: 'lightweight travel jacket, comfortable walking shoes, crossbody travel bag',
                    office: 'smart casual — linen blazer, earth tones, world map in background',
                    outdoor: 'adventure gear: windbreaker, hiking pants, sunglasses on head, scenic backdrop',
                },
            },
            'gaming': {
                style: 'trendy streetwear, expressive, youthful energy, gamer culture aesthetic',
                outfits: {
                    portrait: 'oversized graphic hoodie with gaming art, RGB headset around neck',
                    sitting: 'vintage band tee, gaming chair visible, LED-lit desk setup background',
                    standing: 'streetwear: oversized bomber jacket, cargo pants, chunky sneakers',
                    walking: 'tech-wear: black utility vest, joggers, futuristic sneakers',
                    office: 'casual gamer: comfortable hoodie, gaming peripherals on desk',
                    outdoor: 'urban streetwear: puffer jacket, beanie, high-top sneakers',
                },
            },
            'music': {
                style: 'edgy artistic style, bold accessories, creative expressive look, musician energy',
                outfits: {
                    portrait: 'vintage leather jacket, layered necklaces, tousled hair, concert vibes',
                    sitting: 'band tee or silk shirt, rings on multiple fingers, guitar visible',
                    standing: 'stage-ready: custom jacket with patches, boots, statement belt',
                    walking: 'rock-inspired: distressed denim, vintage boots, headphones around neck',
                    office: 'creative studio: open flannel over band tee, vinyl records in background',
                    outdoor: 'festival look: oversized sunglasses, layered jewelry, leather boots',
                },
            },
            'education': {
                style: 'approachable and friendly, smart casual, trustworthy and intellectual appearance',
                outfits: {
                    portrait: 'clean Oxford shirt with subtle pattern, reading glasses, warm smile',
                    sitting: 'cardigan over collared shirt, books and notebook on table',
                    standing: 'blazer with elbow patches, dress pants, comfortable loafers',
                    walking: 'smart casual: polo shirt, messenger bag, corduroys',
                    office: 'professional teacher: button-up, tie loosened, whiteboard behind',
                    outdoor: 'campus casual: cable knit sweater, khakis, comfortable walking shoes',
                },
            },
            'health': {
                style: 'clean and healthy look, natural glow, calming presence, wellness aesthetic',
                outfits: {
                    portrait: 'soft earth-tone linen top, jade or crystal pendant, serene expression',
                    sitting: 'comfortable yoga-inspired outfit, meditation cushion, candles nearby',
                    standing: 'flowy bamboo-fabric wrap top, comfortable wide-leg pants, barefoot or sandals',
                    walking: 'light activewear, walking shoes, yoga mat carrier bag',
                    office: 'wellness professional: clean white coat or soft pastel blouse, calming decor',
                    outdoor: 'nature wellness: organic cotton outfit, garden or nature setting',
                },
            },
            'finance': {
                style: 'polished and authoritative, sharp grooming, confidence and trust',
                outfits: {
                    portrait: 'tailored navy suit jacket, crisp white shirt, luxury watch, power tie loosened',
                    sitting: 'sharp dress shirt with French cuffs, cufflinks, leather portfolio on table',
                    standing: 'full three-piece suit, polished Oxford shoes, confident power pose',
                    walking: 'business formal: topcoat over suit, leather briefcase in hand',
                    office: 'executive look: fitted blazer, dress shirt no tie, corner office setting',
                    outdoor: 'weekend banker: cashmere sweater, chinos, premium leather shoes',
                },
            },
            'lifestyle': {
                style: 'effortlessly stylish, warm and relatable, aspirational but achievable look',
                outfits: {
                    portrait: 'cozy oversized cardigan with delicate necklace, warm coffee in hand',
                    sitting: 'casual linen shirt and tailored shorts, woven hat nearby',
                    standing: 'breezy maxi dress or fitted jeans with tucked-in white tee',
                    walking: 'boho-chic: flowy kimono over tank top, crossbody bag, sandals',
                    office: 'elevated casual: silk blouse, high-waist trousers, minimal jewelry',
                    outdoor: 'weekend vibes: knit sweater, boyfriend jeans, canvas sneakers',
                },
            },
        }

        // Default outfits for unknown sectors — diverse and varied
        const defaultOutfits: Record<string, string> = {
            portrait: 'fitted crew-neck top in solid color, minimal accessories, clean modern look',
            sitting: 'casual button-down shirt, watch, relaxed but put-together',
            standing: 'light jacket over plain tee, well-fitted pants, clean sneakers',
            walking: 'casual layered outfit, comfortable shoes, crossbody bag',
            office: 'smart casual blazer, clean shirt, professional but approachable',
            outdoor: 'weather-appropriate casual wear, comfortable shoes, natural look',
        }

        const sectorKey = sector?.toLowerCase() || ''
        const sectorConfig = sectorStyles[sectorKey]
        const sectorStyle = sectorConfig?.style || 'stylish, modern, approachable look'
        let sectorOutfits = sectorConfig?.outfits || defaultOutfits

        // Use user-selected environment if available, otherwise use defaults per photo type
        const userEnvLabel = environment || ''

        // ─── ENVIRONMENT-AWARE OUTFIT OVERRIDES ───
        // When user selects a specific environment, override outfits to match that setting
        // This prevents mismatches like "satin blouse in a gym"
        const envKey = environment?.toLowerCase() || ''
        const environmentOutfitOverrides: Record<string, Record<string, string>> = {
            'gym': {
                portrait: 'sports bra or fitted athletic tank top, high ponytail, fitness watch, toned arms visible',
                sitting: 'performance tank top, towel around neck, water bottle nearby, workout gloves',
                standing: 'matching workout set (sports bra + high-waist leggings), cross-training shoes',
                walking: 'running shorts and breathable mesh top, running sneakers, fitness tracker',
                office: 'athletic zip-up hoodie over sports top, clean joggers, smart fitness watch',
                outdoor: 'lightweight windbreaker over sports tank, running shoes, sweatband',
            },
            'park': {
                portrait: 'casual athleisure outfit, comfortable sneakers, crossbody bag',
                sitting: 'relaxed sundress or casual shorts with fitted tee, sunglasses',
                standing: 'breezy casual wear: linen top, comfortable pants, clean sneakers',
                walking: 'activewear leggings and lightweight hoodie, running shoes',
                office: 'smart casual with nature-inspired accessories',
                outdoor: 'casual outdoor wear, comfortable walking shoes, light layers',
            },
            'restaurant': {
                portrait: 'elegant blouse or smart dress, delicate jewelry, polished look',
                sitting: 'chic dinner outfit, statement necklace, well-styled hair',
                standing: 'cocktail-appropriate dress or tailored outfit, heels',
                walking: 'smart casual evening wear, clutch bag, styled hair',
                office: 'business dinner attire, structured blazer, elegant accessories',
                outdoor: 'upscale casual: silk top, tailored pants, designer sandals',
            },
            'cafe': {
                portrait: 'cozy knit sweater or casual blouse, minimal jewelry, warm aesthetic',
                sitting: 'relaxed chic: oversized cardigan, delicate necklace, coffee in hand',
                standing: 'casual layered look: fitted tee under open shirt, jeans',
                walking: 'casual weekend look: light jacket, crossbody bag, comfortable shoes',
                office: 'smart casual: cotton shirt, clean pants, modern watch',
                outdoor: 'relaxed outdoor café look: sunglasses, linen top, straw bag',
            },
        }

        // If environment matches an override, use it instead of sector outfits
        if (envKey && environmentOutfitOverrides[envKey]) {
            sectorOutfits = environmentOutfitOverrides[envKey]
        }

        // ═══ PHOTO CONFIGS ═══
        // 6 reference photos with different postures + SECTOR-SPECIFIC outfits
        const photoConfigs = [
            {
                type: 'portrait' as const,
                scene: userEnvLabel || 'modern, well-lit indoor space',
                posture: 'standing, facing camera, slight head tilt',
                framing: 'Medium shot from waist up. Full arms and torso visible. Background visible.',
                outfit: sectorOutfits.portrait || defaultOutfits.portrait,
            },
            {
                type: 'sitting' as const,
                scene: userEnvLabel || 'stylish café with soft lighting',
                posture: 'sitting comfortably, leaning slightly forward, engaged expression',
                framing: 'Medium shot from waist up. Table and surroundings visible.',
                outfit: sectorOutfits.sitting || defaultOutfits.sitting,
            },
            {
                type: 'standing' as const,
                scene: userEnvLabel || 'urban street or park',
                posture: 'standing naturally, one hand relaxed, confident posture',
                framing: 'Full body or 3/4 shot. Environment clearly visible.',
                outfit: sectorOutfits.standing || defaultOutfits.standing,
            },
            {
                type: 'walking' as const,
                scene: userEnvLabel || 'tree-lined sidewalk or waterfront',
                posture: 'mid-stride walking, looking at camera with a smile',
                framing: 'Full body shot. Motion and environment visible.',
                outfit: sectorOutfits.walking || defaultOutfits.walking,
            },
            {
                type: 'office' as const,
                scene: 'modern office or co-working space with clean desk',
                posture: 'sitting at desk or standing near whiteboard, professional pose',
                framing: 'Medium shot. Desk/workspace visible in background.',
                outfit: sectorOutfits.office || defaultOutfits.office,
            },
            {
                type: 'outdoor' as const,
                scene: 'rooftop, garden, or scenic outdoor location',
                posture: 'standing relaxed, arms crossed or hands in pockets, wind-swept look',
                framing: '3/4 shot. Sky and scenery visible behind.',
                outfit: sectorOutfits.outdoor || defaultOutfits.outdoor,
            },
        ]

        // Build prompts for all 6 photos — SECTOR-AWARE, ATTRACTIVE, WIDE FRAMING
        const photoPrompts = photoConfigs.map(config => ({
            type: config.type,
            scene: config.scene,
            posture: config.posture,
            prompt: `Photo of an attractive ${ethnicity ? ethnicity + ' ' : ''}${genderWord} aged ${age}, wearing ${config.outfit}. ${identityString}. ${sectorStyle}.

CLOTHING (CRITICAL — MUST MATCH EXACTLY): ${config.outfit}. The outfit MUST be clearly visible and match this description precisely. Do NOT substitute with different clothing.

BODY POSITION: ${config.posture}.
ENVIRONMENT: ${config.scene}.
FRAMING: ${config.framing}.

The photo should look like a high-quality Instagram photo taken by a friend on an iPhone. Natural lighting from the environment. The person looks confident, approachable, and camera-ready. Eyes are OPEN and looking at the camera. Warm, genuine expression.

CRITICAL FRAMING RULE: This is a MEDIUM-WIDE shot. The person's FULL UPPER BODY must be visible including arms, hands, and torso. Do NOT crop tightly on the face. The person should occupy 50-60% of the frame, with the environment clearly visible around them.

Style: social media influencer photo, Instagram aesthetic, natural lighting, candid but polished, aspirational lifestyle${dnaKeywords}.

AVOID: wrong clothing, mismatched outfit, formal wear in gym, casual blouse in athletic setting, extreme close-up, face-only, headshot, cropped at neck, ugly, unflattering, closed eyes, sleeping, frowning, blurry, cartoon, CGI, 3D render, watermark, text, deformed, extra limbs, bad anatomy`,
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
