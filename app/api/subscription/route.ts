import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { PLAN_CONFIG } from '@/lib/services/stripe'

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
                videoLimit: PLAN_CONFIG.free.videoLimit,
                influencerLimit: PLAN_CONFIG.free.influencerLimit,
                videosUsed: 0,
                videosRemaining: PLAN_CONFIG.free.videoLimit,
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
