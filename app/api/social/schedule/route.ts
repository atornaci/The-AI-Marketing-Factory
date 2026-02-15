// =========================================
// Schedule — CRUD for publish schedules
// =========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET — Get schedule for a project
export async function GET(req: NextRequest) {
    try {
        const projectId = req.nextUrl.searchParams.get('projectId')

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 })
        }

        let query = supabase
            .from('publish_schedules')
            .select('*')
            .eq('user_id', user.id)

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data: schedules, error } = await query.order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
        }

        return NextResponse.json({ schedules: schedules || [] })
    } catch (error) {
        console.error('Schedule fetch error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// POST — Create or update schedule
export async function POST(req: NextRequest) {
    try {
        const { projectId, platforms, frequency, publishTimes, isActive } = await req.json()

        if (!projectId || !platforms || !frequency || !publishTimes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 })
        }

        // Calculate next run time
        const nextRunAt = calculateNextRun(frequency, publishTimes)

        // Upsert — one schedule per project
        const { data, error } = await supabase
            .from('publish_schedules')
            .upsert(
                {
                    project_id: projectId,
                    user_id: user.id,
                    platforms,
                    frequency,
                    publish_times: publishTimes,
                    is_active: isActive ?? true,
                    next_run_at: nextRunAt,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'project_id,user_id' }
            )
            .select()
            .single()

        if (error) {
            console.error('Schedule save error:', error)
            return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
        }

        return NextResponse.json({ schedule: data })
    } catch (error) {
        console.error('Schedule error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// DELETE — Remove schedule
export async function DELETE(req: NextRequest) {
    try {
        const { scheduleId } = await req.json()

        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 })
        }

        const { error } = await supabase
            .from('publish_schedules')
            .delete()
            .eq('id', scheduleId)
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Schedule delete error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

// =========================================
// Utility: Calculate next run time
// =========================================
function calculateNextRun(frequency: string, publishTimes: unknown): string {
    const now = new Date()
    const istanbulOffset = 3 * 60 // UTC+3

    if (frequency === 'daily' && Array.isArray(publishTimes)) {
        // Find next time today or tomorrow
        for (const time of publishTimes.sort()) {
            const [hours, minutes] = (time as string).split(':').map(Number)
            const candidate = new Date(now)
            candidate.setUTCHours(hours - istanbulOffset / 60, minutes, 0, 0)

            if (candidate > now) return candidate.toISOString()
        }
        // All times passed today — schedule for first time tomorrow
        const [hours, minutes] = (publishTimes[0] as string).split(':').map(Number)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setUTCHours(hours - istanbulOffset / 60, minutes, 0, 0)
        return tomorrow.toISOString()
    }

    if (frequency === 'weekly' && typeof publishTimes === 'object' && !Array.isArray(publishTimes)) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const schedule = publishTimes as Record<string, string[]>

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(now)
            checkDate.setDate(checkDate.getDate() + i)
            const dayName = days[checkDate.getDay()]

            if (schedule[dayName]) {
                for (const time of schedule[dayName].sort()) {
                    const [hours, minutes] = time.split(':').map(Number)
                    const candidate = new Date(checkDate)
                    candidate.setUTCHours(hours - istanbulOffset / 60, minutes, 0, 0)
                    if (candidate > now) return candidate.toISOString()
                }
            }
        }
    }

    // Default: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
}
