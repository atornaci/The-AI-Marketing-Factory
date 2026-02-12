import { NextRequest, NextResponse } from 'next/server'
import { onboardProject } from '@/lib/workflows/autonomous-marketing'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            )
        }

        // Get authenticated user
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Run onboarding workflow
        const result = await onboardProject(url, user.id)

        // Save to database
        const { data: project, error: dbError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                url,
                name: result.analysis.name,
                description: result.analysis.description,
                value_proposition: result.analysis.valueProposition,
                target_audience: result.analysis.targetAudience,
                competitors: result.analysis.competitors,
                marketing_constitution: result.constitution,
                analysis_status: 'completed',
            })
            .select()
            .single()

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`)
        }

        // Save screenshots as assets
        for (const screenshotUrl of result.screenshots) {
            await supabase.from('assets').insert({
                project_id: project.id,
                asset_type: 'screenshot',
                file_name: `screenshot-${Date.now()}.png`,
                file_path: screenshotUrl,
            })
        }

        return NextResponse.json({
            success: true,
            project,
            analysis: result.analysis,
            constitution: result.constitution,
        })
    } catch (error) {
        console.error('Onboarding error:', error)
        return NextResponse.json(
            { error: 'Onboarding failed', details: String(error) },
            { status: 500 }
        )
    }
}
