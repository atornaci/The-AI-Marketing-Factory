/**
 * Simple in-memory rate limiter for API routes.
 * 
 * Uses a sliding window approach with per-user (or per-IP) tracking.
 * Note: In a multi-instance/serverless setup, use Redis instead.
 * For a single Docker container, this works well.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in seconds */
    windowSeconds: number;
}

/**
 * Pre-configured rate limit tiers for different API types
 */
export const RATE_LIMITS = {
    /** AI generation endpoints (expensive) — 5 requests per 10 minutes */
    AI_GENERATION: { maxRequests: 5, windowSeconds: 600 } as RateLimitConfig,

    /** Photo generation — 10 requests per 10 minutes */
    PHOTO_GENERATION: { maxRequests: 10, windowSeconds: 600 } as RateLimitConfig,

    /** Standard API calls — 30 requests per minute */
    STANDARD: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,

    /** Auth endpoints — 10 requests per minute (prevent brute force) */
    AUTH: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
} as const;

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
}

/**
 * Check if a request should be rate limited.
 * 
 * @param identifier - Unique identifier (user ID, IP, or combined)
 * @param endpoint - Endpoint name for grouping (e.g., 'create-influencer')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 * 
 * @example
 * ```ts
 * const result = checkRateLimit(userId, 'create-influencer', RATE_LIMITS.AI_GENERATION);
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: `Rate limit exceeded. Try again in ${result.retryAfterSeconds}s` },
 *     { status: 429, headers: rateLimitHeaders(result) }
 *   );
 * }
 * ```
 */
export function checkRateLimit(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
): RateLimitResult {
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No existing entry or window expired — allow and start fresh
    if (!entry || now > entry.resetAt) {
        const resetAt = now + config.windowSeconds * 1000;
        rateLimitStore.set(key, { count: 1, resetAt });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt,
            retryAfterSeconds: 0,
        };
    }

    // Window still active
    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetAt: entry.resetAt,
            retryAfterSeconds: 0,
        };
    }

    // Rate limited
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterSeconds,
    };
}

/**
 * Generate standard rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
        "Retry-After": String(result.retryAfterSeconds),
    };
}
