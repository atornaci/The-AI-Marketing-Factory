import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Quick project creation — no URL analysis required.
 * Auto-creates a minimal project so users can immediately create influencers.
 */
export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json()

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Proje adı gerekli' },
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

        const { data: project, error: dbError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                url: '',
                name: name.trim(),
                description: description?.trim() || '',
                analysis_status: 'completed',
            })
            .select()
            .single()

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`)
        }

        return NextResponse.json({ success: true, project })
    } catch (error) {
        console.error('Quick project creation error:', error)
        return NextResponse.json(
            { error: 'Proje oluşturulamadı', details: String(error) },
            { status: 500 }
        )
    }
}
