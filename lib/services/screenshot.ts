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
        .from('project-assets')
        .upload(filePath, buffer, {
            contentType: 'image/png',
            upsert: true,
        })

    if (error) {
        throw new Error(`Failed to upload screenshot: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
        .from('project-assets')
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
