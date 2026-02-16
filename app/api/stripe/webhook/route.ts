import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getPlanConfig, PlanType } from '@/lib/services/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
        }

        let event: Stripe.Event
        try {
            event = constructWebhookEvent(body, signature)
        } catch (err) {
            console.error('[Stripe Webhook] Signature verification failed:', err)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const supabase = await createServiceRoleClient()

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId
                const plan = session.metadata?.plan as PlanType

                if (!userId || !plan) {
                    console.error('[Stripe Webhook] Missing metadata in session')
                    break
                }

                const planConfig = getPlanConfig()[plan]
                const customerId = session.customer as string
                const subscriptionId = session.subscription as string

                // Upsert subscription record
                await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        plan: plan,
                        status: 'active',
                        video_limit: planConfig.videoLimit,
                        influencer_limit: planConfig.influencerLimit,
                        videos_used_this_month: 0,
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' })

                console.log(`[Stripe Webhook] ✅ Subscription created: user=${userId} plan=${plan}`)
                break
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice
                const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string

                if (subscriptionId) {
                    // Reset monthly video count on successful payment
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('id')
                        .eq('stripe_subscription_id', subscriptionId)
                        .single()

                    if (sub) {
                        await supabase
                            .from('subscriptions')
                            .update({
                                videos_used_this_month: 0,
                                status: 'active',
                                current_period_start: new Date().toISOString(),
                                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                updated_at: new Date().toISOString(),
                            })
                            .eq('stripe_subscription_id', subscriptionId)

                        console.log(`[Stripe Webhook] ✅ Monthly reset for subscription ${subscriptionId}`)
                    }
                }
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                const subscriptionId = subscription.id

                // Downgrade to free
                await supabase
                    .from('subscriptions')
                    .update({
                        plan: 'free',
                        status: 'canceled',
                        video_limit: getPlanConfig().free.videoLimit,
                        influencer_limit: getPlanConfig().free.influencerLimit,
                        stripe_subscription_id: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', subscriptionId)

                console.log(`[Stripe Webhook] ✅ Subscription canceled → free: ${subscriptionId}`)
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                const subscriptionId = subscription.id
                const status = subscription.status

                if (status === 'past_due' || status === 'unpaid') {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscriptionId)

                    console.log(`[Stripe Webhook] ⚠️ Subscription past_due: ${subscriptionId}`)
                }
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Stripe Webhook] Error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}
