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

        // Use service role client to bypass RLS for deletion
        const adminClient = await createServiceRoleClient()

        // Verify ownership: video must belong to a project owned by this user
        const { data: video } = await adminClient
            .from('videos')
            .select('id, project_id')
            .eq('id', id)
            .single()

        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 })
        }

        const { data: project } = await adminClient
            .from('projects')
            .select('id')
            .eq('id', video.project_id)
            .eq('user_id', user.id)
            .single()

        if (!project) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        // Delete the video
        const { error } = await adminClient
            .from('videos')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Video delete DB error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Video delete error:', error)
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
    }
}
