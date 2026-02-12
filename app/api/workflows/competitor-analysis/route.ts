import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { abacusAI } from '@/lib/services/abacus-ai'

export async function POST(req: NextRequest) {
    try {
        const { projectId } = await req.json()

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Auth check
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Get project data
        const adminClient = await createServiceRoleClient()
        const { data: project, error: projectError } = await adminClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const analysis = {
            name: project.name || '',
            description: project.description || '',
            valueProposition: project.value_proposition || '',
            targetAudience: project.target_audience || {},
            competitors: project.competitors || [],
            demographics: project.target_audience?.demographics || [],
            interests: project.target_audience?.interests || [],
            painPoints: project.target_audience?.painPoints || [],
            brandTone: project.marketing_constitution?.brandVoice || '',
            keywords: [],
        }

        const constitution = project.marketing_constitution || {
            brandVoice: '',
            contentPillars: [],
            messagingFramework: {},
            visualGuidelines: { colorPalette: [], mood: '', style: '' },
        }

        // Run competitor analysis via LLM
        const competitorAnalysis = await abacusAI.analyzeCompetitors(analysis, constitution)

        // Save to DB
        const { error: updateError } = await adminClient
            .from('projects')
            .update({ competitor_analysis: competitorAnalysis })
            .eq('id', projectId)

        if (updateError) {
            console.error('Failed to save competitor analysis:', updateError)
            return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: competitorAnalysis })
    } catch (error) {
        console.error('Competitor analysis error:', error)
        return NextResponse.json({ error: 'Failed to analyze competitors' }, { status: 500 })
    }
}
