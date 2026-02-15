// =========================================
// Social Connections — List & Delete
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET — List user's connected social accounts
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { data: connections, error } = await supabase
            .from('social_connections')
            .select('id, platform, account_name, account_id, connected_at, expires_at, project_id')
            .eq('user_id', user.id)
            .order('connected_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
        }

        return NextResponse.json({ connections: connections || [] })
    } catch (error) {
        console.error('Connections list error:', error)
        return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }
}

// DELETE — Disconnect a social account
export async function DELETE(req: NextRequest) {
    try {
        const { connectionId } = await req.json()

        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { error } = await supabase
            .from('social_connections')
            .delete()
            .eq('id', connectionId)
            .eq('user_id', user.id) // Ensure user owns this connection

        if (error) {
            return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Disconnect error:', error)
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }
}
