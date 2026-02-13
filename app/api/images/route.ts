import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { abacusAI } from '@/lib/services/abacus-ai'

export const maxDuration = 120 // 2 minutes for image generation

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const body = await req.json()
        const { projectId, prompt, imageType, platform, withBrandOverlay } = body

        if (!projectId || !prompt || !imageType || !platform) {
            return NextResponse.json(
                { error: 'Missing required fields: projectId, prompt, imageType, platform' },
                { status: 400 }
            )
        }

        // Get project for brand context
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Build brand context
        const brandContext = `${project.name}: ${project.description || project.value_proposition || ''}`
        const brandColors = (project.brand_colors as string[]) || []

        // Generate the image
        const result = await abacusAI.generateMarketingImage({
            prompt,
            imageType,
            platform,
            brandColors: withBrandOverlay ? brandColors : [],
            brandContext,
        })

        if (!result.imageUrl) {
            return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
        }

        // Save to database
        const { data: imageRecord, error: insertError } = await supabase
            .from('generated_images')
            .insert({
                project_id: projectId,
                image_type: imageType,
                prompt: result.enhancedPrompt,
                image_url: result.imageUrl,
                width: result.width,
                height: result.height,
                platform,
                brand_colors: brandColors,
                has_logo: withBrandOverlay || false,
                status: 'ready',
                metadata: {
                    originalPrompt: prompt,
                    enhancedPrompt: result.enhancedPrompt,
                },
            })
            .select()
            .single()

        if (insertError) {
            console.error('DB insert error:', insertError)
            // Still return the image even if DB fails
            return NextResponse.json({
                success: true,
                image: {
                    imageUrl: result.imageUrl,
                    width: result.width,
                    height: result.height,
                    prompt: result.enhancedPrompt,
                },
                dbError: insertError.message,
            })
        }

        return NextResponse.json({
            success: true,
            image: imageRecord,
        })
    } catch (error) {
        console.error('Image generation error:', error)
        return NextResponse.json(
            { error: 'Image generation failed', details: String(error) },
            { status: 500 }
        )
    }
}

// GET — fetch all generated images for a project
export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const imageType = searchParams.get('imageType')

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
        }

        let query = supabase
            .from('generated_images')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (imageType) {
            query = query.eq('image_type', imageType)
        }

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ images: data || [] })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch images', details: String(error) },
            { status: 500 }
        )
    }
}

// DELETE — delete a generated image
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('imageId')

        if (!imageId) {
            return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
        }

        const { error } = await supabase
            .from('generated_images')
            .delete()
            .eq('id', imageId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete image', details: String(error) },
            { status: 500 }
        )
    }
}
