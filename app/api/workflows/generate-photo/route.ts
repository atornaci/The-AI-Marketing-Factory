import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/workflows/generate-photo
 * 
 * Generates a new reference photo for an existing influencer
 * using PuLID (fal-ai/pulid) to preserve facial identity.
 * 
 * The influencer's existing avatar is used as face reference,
 * and a new scene is generated based on user-selected options.
 */

// Location presets with detailed scene descriptions
const LOCATION_PRESETS: Record<string, string> = {
    'cafe': 'cozy café interior, warm amber lighting, wooden table with coffee cup, pastries, other customers softly blurred behind, warm inviting atmosphere',
    'kitchen': 'bright modern kitchen, white countertop, morning sunlight streaming through window, fresh fruit and plants visible, clean and homey',
    'office': 'modern home office, MacBook on desk, desk lamp, coffee mug, bookshelf in background, soft daylight from window, professional workspace',
    'park': 'green park with trees and grass, warm golden hour sunlight, nature background with soft bokeh, dappled light through leaves, peaceful atmosphere',
    'street': 'sunny tree-lined city sidewalk, buildings and shops softly blurred, golden afternoon light, urban atmosphere, vibrant street life',
    'beach': 'beautiful beach at golden hour, soft sand, turquoise ocean waves in background, warm sunset light, tropical paradise feeling',
    'gym': 'modern fitness gym interior, workout equipment softly blurred behind, bright lighting, motivational atmosphere, active energy',
    'bedroom': 'cozy bedroom with natural morning light, soft bedding visible, warm and intimate atmosphere, relaxed home setting',
    'restaurant': 'elegant restaurant interior, soft candlelight, wine glasses on table, warm ambient glow, upscale dining atmosphere',
    'car': 'inside a car, driver seat perspective, dashboard visible, natural daylight through windshield, realistic car interior',
    'rooftop': 'rooftop terrace with city skyline, golden hour warm light, slight breeze, urban panorama softly blurred behind',
    'library': 'cozy library corner, bookshelves filled with books, warm reading lamp, quiet studious atmosphere, rich wooden tones',
}

// Outfit presets
const OUTFIT_PRESETS: Record<string, string> = {
    'casual': 'casual everyday clothes, simple stylish t-shirt or blouse, well-fitted, relaxed and approachable',
    'sporty': 'athletic sportswear, fitted workout top, sporty and energetic look, active lifestyle',
    'professional': 'professional business attire, neat blazer or button-up shirt, polished and confident',
    'elegant': 'elegant evening outfit, sophisticated dress or stylish formal wear, classy and refined',
    'homewear': 'comfortable home clothes, cozy sweater or soft loungewear, relaxed and natural',
    'streetwear': 'trendy streetwear, denim jacket or hoodie, sneakers style, urban fashion-forward',
}

// Hairstyle presets
const HAIRSTYLE_PRESETS: Record<string, string> = {
    'natural': '', // Keep original hairstyle
    'ponytail': 'hair pulled back in a high ponytail',
    'straight': 'long straight sleek hair',
    'wavy': 'soft wavy flowing hair',
    'short': 'short cropped modern hairstyle',
    'bun': 'elegant hair bun updo',
    'braids': 'hair in casual braids',
}

// Pose presets
const POSE_PRESETS: Record<string, { posture: string; framing: string; type: string }> = {
    'sitting': {
        posture: 'sitting comfortably, relaxed posture, leaning slightly forward, hands visible',
        framing: 'medium shot from head to waist, sitting position clear',
        type: 'sitting',
    },
    'standing': {
        posture: 'standing confidently, natural relaxed stance, arms at sides or one hand on hip',
        framing: 'medium shot from head to hips, full upper body visible',
        type: 'standing',
    },
    'walking': {
        posture: 'walking toward camera, mid-stride, natural movement, candid energy',
        framing: 'medium-wide shot from head to knees, walking motion visible',
        type: 'walking',
    },
}

export async function POST(req: NextRequest) {
    try {
        const { influencerId, location, outfit, hairstyle, pose } = await req.json()

        if (!influencerId) {
            return NextResponse.json({ error: 'influencerId is required' }, { status: 400 })
        }

        // Auth check
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ═══ RATE LIMITING ═══
        const rateCheck = checkRateLimit(user.id, 'generate-photo', RATE_LIMITS.PHOTO_GENERATION)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
                { status: 429, headers: rateLimitHeaders(rateCheck) }
            )
        }

        // Get influencer data
        const { data: influencer, error: fetchError } = await supabase
            .from('ai_influencers')
            .select('*')
            .eq('id', influencerId)
            .single()

        if (fetchError || !influencer) {
            return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
        }

        const avatarUrl = influencer.avatar_url
        if (!avatarUrl) {
            return NextResponse.json({ error: 'Influencer has no avatar to use as face reference' }, { status: 400 })
        }

        const FAL_KEY = process.env.FAL_KEY
        if (!FAL_KEY) {
            return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
        }

        // Build the generation prompt from selected options
        const locationDesc = LOCATION_PRESETS[location] || LOCATION_PRESETS['cafe']
        const outfitDesc = OUTFIT_PRESETS[outfit] || OUTFIT_PRESETS['casual']
        const hairstyleDesc = HAIRSTYLE_PRESETS[hairstyle] || ''
        const poseConfig = POSE_PRESETS[pose] || POSE_PRESETS['sitting']

        const genderWord = influencer.gender === 'male' ? 'man' : 'woman'
        const vp = influencer.visual_profile || {}
        const vpData = vp as Record<string, unknown>
        const age = vpData.ageRange || '28'

        // ═══ IDENTITY-FIRST: Extract ethnicity/hair/eyes from visual profile ═══
        const ethnicity = (vpData.ethnicity as string) || ''
        const eyeColor = (vpData.eyeColor as string) || ''
        const hairDesc = (vpData.hairDescription as string) || ''
        const facialMarkers = (vpData.facialMarkers as string) || ''

        const identityParts = [
            ethnicity,
            hairDesc,
            eyeColor ? `${eyeColor} eyes` : '',
            facialMarkers,
        ].filter(Boolean)
        const identityString = identityParts.length > 0
            ? identityParts.join(', ')
            : (influencer.appearance_description || '').substring(0, 300)

        const prompt = `Photo of an attractive ${ethnicity ? ethnicity + ' ' : ''}${genderWord} aged ${age}. ${identityString}. ${outfitDesc}. ${hairstyleDesc ? hairstyleDesc + '.' : ''}

BODY POSITION: ${poseConfig.posture}.
ENVIRONMENT: ${locationDesc}.
FRAMING: ${poseConfig.framing}.

The photo should look like a high-quality Instagram photo taken by a friend on an iPhone. Natural lighting from the environment. The person looks confident, approachable, and camera-ready. Eyes are OPEN and looking at the camera. Warm, genuine expression.

CRITICAL FRAMING RULE: This is a MEDIUM-WIDE shot. The person's FULL UPPER BODY must be visible including arms, hands, and torso. Do NOT crop tightly on the face. The person should occupy 50-60% of the frame, with the environment clearly visible around them.

Style: social media influencer photo, Instagram aesthetic, natural lighting, candid but polished, aspirational lifestyle.

AVOID: extreme close-up, face-only, headshot, cropped at neck, ugly, unflattering, closed eyes, sleeping, frowning, blurry, cartoon, CGI, 3D render, anime, illustration, painting, watermark, text, deformed, extra limbs, bad anatomy`

        console.log(`[PhotoStudio] Generating photo for influencer ${influencer.name}`)
        console.log(`[PhotoStudio] Location: ${location}, Outfit: ${outfit}, Hair: ${hairstyle}, Pose: ${pose}`)

        // Call PuLID via fal.ai for identity-preserving generation
        const falResponse = await fetch('https://fal.run/fal-ai/pulid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${FAL_KEY}`,
            },
            body: JSON.stringify({
                reference_images: [{ image_url: avatarUrl }],
                prompt,
                negative_prompt: 'flaws in the eyes, flaws in the face, lowres, low quality, worst quality, artifacts, text, watermark, deformed, mutated, ugly, disfigured, blurry, cropped face, extreme close-up, face only, headshot only, cartoon, CGI, 3D render, anime, illustration, painting, digital art, unrealistic, plastic skin',
                num_images: 1,
                guidance_scale: 4.0,
                num_inference_steps: 20,
                image_size: { width: 768, height: 1024 }, // Portrait 3:4
                id_scale: 0.8,
                mode: 'fidelity',
            }),
        })

        if (!falResponse.ok) {
            const errText = await falResponse.text().catch(() => '')
            console.error(`[PhotoStudio] PuLID error: ${falResponse.status}`, errText)
            return NextResponse.json({ error: `Photo generation failed: ${falResponse.status}` }, { status: 500 })
        }

        const falData = await falResponse.json()
        const newPhotoUrl = falData.images?.[0]?.url || ''

        if (!newPhotoUrl) {
            return NextResponse.json({ error: 'No image URL returned from generation' }, { status: 500 })
        }

        console.log(`[PhotoStudio] ✅ Photo generated: ${newPhotoUrl}`)

        // Add to influencer's reference_photos array
        const existingPhotos = influencer.reference_photos || []
        const newPhoto = {
            url: newPhotoUrl,
            type: poseConfig.type,
            scene: LOCATION_PRESETS[location] ? location : 'custom',
            posture: pose,
            location: location,
            outfit: outfit,
            hairstyle: hairstyle,
            generated_at: new Date().toISOString(),
        }

        const updatedPhotos = [...existingPhotos, newPhoto]

        const { error: updateError } = await supabase
            .from('ai_influencers')
            .update({ reference_photos: updatedPhotos })
            .eq('id', influencerId)

        if (updateError) {
            console.error('[PhotoStudio] DB update error:', updateError)
            // Still return the photo even if DB update fails
        }

        return NextResponse.json({
            success: true,
            photo: newPhoto,
            totalPhotos: updatedPhotos.length,
        })

    } catch (err) {
        console.error('[PhotoStudio] Error:', err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
