import Stripe from 'stripe'

// =========================================
// Stripe Client (lazy init to avoid build-time errors)
// =========================================
let _stripe: Stripe | null = null

function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY
        if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
        _stripe = new Stripe(key, {
            apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion,
        })
    }
    return _stripe
}

// =========================================
// Plan Configuration
// =========================================
export function getPlanConfig() {
    return {
        free: {
            name: 'Free',
            videoLimit: 2,
            influencerLimit: 1,
            priceId: null as string | null,
            price: 0,
        },
        starter: {
            name: 'Starter',
            videoLimit: 10,
            influencerLimit: 5,
            priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
            price: 39,
        },
        creator: {
            name: 'Creator',
            videoLimit: 30,
            influencerLimit: 999, // unlimited
            priceId: process.env.STRIPE_CREATOR_PRICE_ID || '',
            price: 99,
        },
    }
}

export type PlanConfig = ReturnType<typeof getPlanConfig>
export type PlanType = keyof PlanConfig

// =========================================
// Checkout Session
// =========================================
export async function createCheckoutSession(
    userId: string,
    userEmail: string,
    plan: 'starter' | 'creator',
    successUrl: string,
    cancelUrl: string,
): Promise<string> {
    const planConfig = getPlanConfig()[plan]

    if (!planConfig.priceId) {
        throw new Error(`No price ID configured for plan: ${plan}`)
    }

    const session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
            {
                price: planConfig.priceId,
                quantity: 1,
            },
        ],
        success_url: `${successUrl}?payment=success&plan=${plan}`,
        cancel_url: `${cancelUrl}?payment=cancelled`,
        metadata: {
            userId,
            plan,
        },
        subscription_data: {
            metadata: {
                userId,
                plan,
            },
        },
    })

    return session.url || ''
}

// =========================================
// Customer Portal
// =========================================
export async function createPortalSession(
    customerId: string,
    returnUrl: string,
): Promise<string> {
    const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })
    return session.url
}

// =========================================
// Webhook Signature Verification
// =========================================
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
): Stripe.Event {
    return getStripe().webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
    )
}

export { getStripe }
