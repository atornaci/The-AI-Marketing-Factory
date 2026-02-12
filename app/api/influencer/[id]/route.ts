import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Verify authentication
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Use service role client to bypass RLS
        const adminClient = await createServiceRoleClient()

        // Verify ownership
        const { data: influencer } = await adminClient
            .from('ai_influencers')
            .select('id, project_id')
            .eq('id', id)
            .single()

        if (!influencer) {
            return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
        }

        const { data: project } = await adminClient
            .from('projects')
            .select('id')
            .eq('id', influencer.project_id)
            .eq('user_id', user.id)
            .single()

        if (!project) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        // Delete the influencer
        const { error } = await adminClient
            .from('ai_influencers')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Influencer delete DB error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Influencer delete error:', error)
        return NextResponse.json({ error: 'Failed to delete influencer' }, { status: 500 })
    }
}
