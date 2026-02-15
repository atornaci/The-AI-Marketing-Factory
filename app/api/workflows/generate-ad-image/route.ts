import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { abacusAI } from '@/lib/services/abacus-ai'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { projectId, productImageUrl, platform, imageType } = body

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Auth check
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Fetch project data for brand context
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const constitution = project.marketing_constitution as Record<string, unknown> || {}
        const visualGuidelines = constitution.visualGuidelines as Record<string, unknown> || {}
        const brandColors = (visualGuidelines.colorPalette as string[]) || []
        const brandContext = `${project.name}: ${project.description || project.value_proposition || ''}`
        const visualDna = (constitution.visualDna as string) || ''
        const brandPersona = (constitution.brandPersona as string) || ''

        // Generate a prompt based on brand context
        const selectedPlatform = platform || 'instagram'
        const selectedType = imageType || 'static_post'

        // Build a product-aware prompt
        let prompt = `Professional marketing ad design for ${project.name}. `
        prompt += `Brand: ${brandContext}. `
        if (productImageUrl) {
            prompt += `Feature the product prominently. `
        }
        prompt += `Style: modern, eye-catching, social media ready. `
        prompt += `Platform: ${selectedPlatform}. `
        prompt += `Type: ${selectedType}. `

        // Use the existing generateMarketingImage method
        const result = await abacusAI.generateMarketingImage({
            prompt,
            imageType: selectedType,
            platform: selectedPlatform,
            brandColors,
            brandContext,
            visualDna,
            brandPersona,
            productContext: project.description || '',
            productImageUrl: productImageUrl || undefined,
        })

        if (!result.imageUrl) {
            return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
        }

        // Save the generated image as an asset
        await supabase.from('assets').insert({
            project_id: projectId,
            asset_type: 'generated',
            file_name: `ad-${selectedPlatform}-${selectedType}-${Date.now()}`,
            file_path: result.imageUrl,
            metadata: {
                source: 'ad_generator',
                platform: selectedPlatform,
                imageType: selectedType,
                width: result.width,
                height: result.height,
                enhancedPrompt: result.enhancedPrompt,
                productImageUrl: productImageUrl || null,
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                imageUrl: result.imageUrl,
                width: result.width,
                height: result.height,
                prompt: result.enhancedPrompt,
            }
        })
    } catch (error) {
        console.error('[AdImage] Generation error:', error)
        return NextResponse.json(
            { error: 'Ad image generation failed', details: String(error) },
            { status: 500 }
        )
    }
}
