import { NextRequest, NextResponse } from 'next/server'
import { createInfluencer } from '@/lib/workflows/autonomous-marketing'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Allow up to 2 minutes for influencer creation
export const maxDuration = 120

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

        // Run influencer creation workflow
        const result = await createInfluencer(
            {
                name: project.name,
                description: project.description || '',
                valueProposition: project.value_proposition || '',
                targetAudience: project.target_audience || { demographics: [], interests: [], painPoints: [] },
                competitors: project.competitors || [],
                brandTone: 'professional',
                keywords: [],
            },
            project.marketing_constitution || {
                brandVoice: 'Professional',
                contentPillars: [],
                messagingFramework: { hook: '', problem: '', solution: '', cta: '' },
                visualGuidelines: { colorPalette: [], mood: '', style: '' },
            }
        )

        // Save influencer to database
        const { data: influencer, error: dbError } = await supabase
            .from('ai_influencers')
            .insert({
                project_id: projectId,
                name: result.profile.name,
                personality: result.profile.personality,
                backstory: result.profile.backstory || '',
                appearance_description: result.profile.appearanceDescription,
                voice_id: result.voiceId,
                voice_name: result.voiceName,
                visual_profile: result.profile.visualProfile,
                avatar_url: result.avatarUrl || null,
                gender: gender || 'female',
                status: 'ready',
            })
            .select()
            .single()

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`)
        }

        return NextResponse.json({
            success: true,
            influencer,
        })
    } catch (error) {
        console.error('Influencer creation error:', error)
        return NextResponse.json(
            { error: 'Influencer creation failed', details: String(error) },
            { status: 500 }
        )
    }
}
