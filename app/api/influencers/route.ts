import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get all influencers for the user's projects
        const { data: influencers, error } = await supabase
            .from('ai_influencers')
            .select(`
                id,
                name,
                personality,
                backstory,
                avatar_url,
                project_id,
                created_at
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching influencers:', error)
            return NextResponse.json(
                { error: 'Failed to fetch influencers' },
                { status: 500 }
            )
        }

        return NextResponse.json({ influencers: influencers || [] })
    } catch (error) {
        console.error('Influencers API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
