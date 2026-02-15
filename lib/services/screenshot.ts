// =========================================
// Screenshot Capture Service
// Captures website screenshots via API
// =========================================

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Capture a screenshot of a website using a screenshot API service
 * Using screenshotone.com or similar API for server-side capture
 */
export async function captureWebsite(url: string): Promise<Buffer> {
    // Use a headless browser screenshot API
    // This avoids running Puppeteer in serverless environments
    const screenshotApiUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1440&viewport_height=900&format=png&full_page=false&delay=3`

    const response = await fetch(screenshotApiUrl, {
        headers: {
            'Authorization': `Bearer ${process.env.SCREENSHOT_API_KEY || ''}`,
        },
    })

    if (!response.ok) {
        // Fallback: try a free thumbnail service
        const fallbackUrl = `https://image.thum.io/get/width/1440/crop/900/${url}`
        const fallbackResponse = await fetch(fallbackUrl)

        if (!fallbackResponse.ok) {
            throw new Error('Failed to capture screenshot')
        }

        const buffer = await fallbackResponse.arrayBuffer()
        return Buffer.from(buffer)
    }

    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer)
}

/**
 * Capture multiple pages/views of a website
 */
export async function captureMultiplePages(
    baseUrl: string,
    paths: string[] = ['/', '/about', '/features', '/pricing']
): Promise<Array<{ path: string; buffer: Buffer }>> {
    const results: Array<{ path: string; buffer: Buffer }> = []

    for (const path of paths) {
        try {
            const fullUrl = new URL(path, baseUrl).toString()
            const buffer = await captureWebsite(fullUrl)
            results.push({ path, buffer })
        } catch (error) {
            console.error(`Failed to capture ${path}:`, error)
        }
    }

    return results
}

/**
 * Upload screenshot to Supabase Storage
 */
export async function uploadScreenshot(
    buffer: Buffer,
    projectId: string,
    fileName: string
): Promise<string> {
    const supabase = await createServiceRoleClient()

    const filePath = `${projectId}/${fileName}`

    const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, buffer, {
            contentType: 'image/png',
            upsert: true,
        })

    if (error) {
        throw new Error(`Failed to upload screenshot: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Upload any media file (audio, video, etc.) to Supabase Storage
 */
export async function uploadMediaToStorage(
    buffer: Buffer,
    projectId: string,
    fileName: string,
    contentType: string = 'audio/mpeg'
): Promise<string> {
    const supabase = await createServiceRoleClient()
    const filePath = `${projectId}/${fileName}`

    const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, buffer, {
            contentType,
            upsert: true,
        })

    if (error) {
        throw new Error(`Media upload failed: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Scrape basic website information
 */
export async function scrapeWebsiteInfo(url: string): Promise<{
    title: string
    description: string
    content: string
    favicon: string
}> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AIMarketingFactory/1.0)',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`)
        }

        const html = await response.text()

        // Extract basic info using regex (server-side)
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)
        const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["'](.*?)["']/i)

        // Strip HTML tags for content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        const bodyContent = bodyMatch ? bodyMatch[1] : html
        const textContent = bodyContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 3000) // Limit content length

        let faviconUrl = ''
        if (faviconMatch && faviconMatch[1]) {
            faviconUrl = faviconMatch[1].startsWith('http')
                ? faviconMatch[1]
                : new URL(faviconMatch[1], url).toString()
        }

        return {
            title: titleMatch ? titleMatch[1].trim() : '',
            description: descMatch ? descMatch[1].trim() : '',
            content: textContent,
            favicon: faviconUrl,
        }
    } catch (error) {
        console.error('Scrape failed:', error)
        return {
            title: '',
            description: '',
            content: '',
            favicon: '',
        }
    }
}

/**
 * Scrape product images from a website
 * Extracts meaningful product/hero images, filters out icons and UI elements
 */
export async function scrapeProductImages(url: string, maxImages = 10): Promise<{
    images: Array<{ src: string; alt: string; score: number }>
    ogImage?: string
}> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`)
        }

        const html = await response.text()
        const baseUrl = new URL(url).origin

        // 1. Extract OG image (highest priority)
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i)
            || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["']/i)
        const ogImage = ogImageMatch ? resolveUrl(ogImageMatch[1], baseUrl) : undefined

        // 2. Extract all <img> tags with src and optional attributes
        const imgRegex = /<img[^>]*>/gi
        const imgTags = html.match(imgRegex) || []

        const candidates: Array<{ src: string; alt: string; score: number }> = []
        const seenUrls = new Set<string>()

        for (const tag of imgTags) {
            // Extract src
            const srcMatch = tag.match(/src=["'](.*?)["']/i)
            if (!srcMatch) continue

            let src = srcMatch[1]
            // Skip data URIs, SVGs, and tracking pixels
            if (src.startsWith('data:') || src.endsWith('.svg') || src.includes('pixel') || src.includes('tracking')) continue

            src = resolveUrl(src, baseUrl)

            // Deduplicate
            if (seenUrls.has(src)) continue
            seenUrls.add(src)

            // Extract alt text
            const altMatch = tag.match(/alt=["'](.*?)["']/i)
            const alt = altMatch ? altMatch[1].trim() : ''

            // Extract dimensions if available
            const widthMatch = tag.match(/width=["']?(\d+)/i)
            const heightMatch = tag.match(/height=["']?(\d+)/i)
            const width = widthMatch ? parseInt(widthMatch[1]) : 0
            const height = heightMatch ? parseInt(heightMatch[1]) : 0

            // Filter out tiny images (icons, buttons, spacers)
            if ((width > 0 && width < 100) || (height > 0 && height < 100)) continue
            // Filter common non-product patterns
            if (/logo|icon|avatar|badge|flag|arrow|spinner|loader|placeholder/i.test(src + ' ' + alt)) continue

            // Score the image for product relevance
            let score = 0
            // Large declared dimensions boost
            if (width >= 300 || height >= 300) score += 3
            if (width >= 500 || height >= 500) score += 2
            // Alt text with product-related words
            if (/product|ürün|item|shop|buy|price|fiyat|resim|foto|image/i.test(alt)) score += 3
            // Image in product-related paths
            if (/product|catalog|shop|item|upload|media\/image/i.test(src)) score += 3
            // High-quality image extensions
            if (/\.(jpg|jpeg|png|webp)/i.test(src)) score += 1
            // Alt text exists (real content images usually have alt)
            if (alt.length > 3) score += 1
            // Penalize common non-product patterns
            if (/banner|slider|hero|background|bg/i.test(src)) score -= 1
            // No dimensions or class info → neutral
            if (width === 0 && height === 0) score += 0

            candidates.push({ src, alt, score })
        }

        // 3. Also check for product schema images (JSON-LD)
        const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        let jsonLdMatch
        while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
            try {
                const jsonData = JSON.parse(jsonLdMatch[1])
                const schemaImages = extractSchemaImages(jsonData, baseUrl)
                for (const img of schemaImages) {
                    if (!seenUrls.has(img.src)) {
                        seenUrls.add(img.src)
                        candidates.push({ ...img, score: img.score + 5 }) // Schema images are high priority
                    }
                }
            } catch {
                // Invalid JSON-LD, skip
            }
        }

        // Sort by score (highest first) and take top N
        candidates.sort((a, b) => b.score - a.score)
        const topImages = candidates.slice(0, maxImages)

        console.log(`[Scraper] Found ${candidates.length} candidate images, returning top ${topImages.length} from ${url}`)

        return { images: topImages, ogImage }
    } catch (error) {
        console.error('[Scraper] Product image scraping failed:', error)
        return { images: [] }
    }
}

/** Resolve a potentially relative URL to absolute */
function resolveUrl(src: string, baseUrl: string): string {
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('//')) return 'https:' + src
    if (src.startsWith('/')) return baseUrl + src
    return baseUrl + '/' + src
}

/** Extract image URLs from JSON-LD schema data */
function extractSchemaImages(data: unknown, baseUrl: string): Array<{ src: string; alt: string; score: number }> {
    const images: Array<{ src: string; alt: string; score: number }> = []

    if (!data || typeof data !== 'object') return images

    const obj = data as Record<string, unknown>

    // Direct image property
    if (typeof obj.image === 'string') {
        images.push({ src: resolveUrl(obj.image, baseUrl), alt: (obj.name as string) || '', score: 5 })
    } else if (Array.isArray(obj.image)) {
        for (const img of obj.image) {
            if (typeof img === 'string') {
                images.push({ src: resolveUrl(img, baseUrl), alt: (obj.name as string) || '', score: 5 })
            } else if (img && typeof img === 'object' && (img as Record<string, unknown>).url) {
                images.push({ src: resolveUrl((img as Record<string, unknown>).url as string, baseUrl), alt: (obj.name as string) || '', score: 5 })
            }
        }
    }

    // Check for nested items (e.g., Product, ItemList)
    if (Array.isArray(obj.itemListElement)) {
        for (const item of obj.itemListElement) {
            images.push(...extractSchemaImages(item, baseUrl))
        }
    }
    if (obj.mainEntity) {
        images.push(...extractSchemaImages(obj.mainEntity, baseUrl))
    }

    return images
}
