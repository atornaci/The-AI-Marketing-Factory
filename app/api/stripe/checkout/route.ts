import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckoutSession, PLAN_CONFIG } from '@/lib/services/stripe'

export async function POST(req: NextRequest) {
    try {
        const { plan } = await req.json()

        if (!plan || !['starter', 'creator'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan. Must be starter or creator' },
                { status: 400 }
            )
        }

        // Verify auth
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Check if price ID is configured
        const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
        if (!planConfig.priceId) {
            return NextResponse.json(
                { error: 'Stripe price not configured for this plan' },
                { status: 500 }
            )
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000'

        const checkoutUrl = await createCheckoutSession(
            user.id,
            user.email || '',
            plan as 'starter' | 'creator',
            `${origin}/dashboard`,
            `${origin}/dashboard`,
        )

        return NextResponse.json({ url: checkoutUrl })
    } catch (error) {
        console.error('[Stripe Checkout] Error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
