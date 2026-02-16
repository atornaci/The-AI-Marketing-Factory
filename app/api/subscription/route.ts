import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getPlanConfig } from '@/lib/services/stripe'

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

        // Use service role to read subscriptions table
        const serviceClient = await createServiceRoleClient()
        const { data: subscription } = await serviceClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!subscription) {
            // No subscription record = free plan
            return NextResponse.json({
                plan: 'free',
                status: 'active',
                videoLimit: getPlanConfig().free.videoLimit,
                influencerLimit: getPlanConfig().free.influencerLimit,
                videosUsed: 0,
                videosRemaining: getPlanConfig().free.videoLimit,
            })
        }

        // ═══ ADMIN OVERRIDE ═══
        const ADMIN_EMAILS = ['atornaci91@gmail.com']
        const isAdmin = ADMIN_EMAILS.includes(user.email || '')

        if (isAdmin) {
            return NextResponse.json({
                plan: 'creator',
                status: 'active',
                videoLimit: 999,
                influencerLimit: 999,
                videosUsed: subscription?.videos_used_this_month ?? 0,
                videosRemaining: 999,
            })
        }

        return NextResponse.json({
            plan: subscription.plan,
            status: subscription.status,
            videoLimit: subscription.video_limit,
            influencerLimit: subscription.influencer_limit,
            videosUsed: subscription.videos_used_this_month,
            videosRemaining: Math.max(0, subscription.video_limit - subscription.videos_used_this_month),
            currentPeriodEnd: subscription.current_period_end,
            stripeCustomerId: subscription.stripe_customer_id,
        })
    } catch (error) {
        console.error('[Subscription] Error:', error)
        return NextResponse.json(
            { error: 'Failed to get subscription' },
            { status: 500 }
        )
    }
}
