// =========================================
// API Connection Test Endpoint
// Tests OpenRouter, fal.ai, ElevenLabs, and Supabase connectivity
// =========================================

import { NextResponse } from 'next/server'

export async function GET() {
    const results: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        checks: {},
    }

    // Test 1: OpenRouter API
    try {
        const openRouterKey = process.env.OPENROUTER_API_KEY
        if (!openRouterKey) {
            results.checks = { ...results.checks as object, openRouter: { status: 'error', message: 'OPENROUTER_API_KEY not set' } }
        } else {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterKey}`,
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.5-haiku',
                    messages: [
                        { role: 'system', content: 'Respond with exactly: OK' },
                        { role: 'user', content: 'Health check. Reply with just OK.' },
                    ],
                    max_tokens: 10,
                    temperature: 0,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                const reply = data.choices?.[0]?.message?.content || ''
                results.checks = {
                    ...results.checks as object,
                    openRouter: {
                        status: 'connected',
                        model: data.model || 'anthropic/claude-3.5-haiku',
                        reply: reply.substring(0, 50),
                        usage: data.usage,
                    },
                }
            } else {
                const errorText = await response.text().catch(() => '')
                results.checks = {
                    ...results.checks as object,
                    openRouter: {
                        status: 'error',
                        httpStatus: response.status,
                        message: errorText.substring(0, 200),
                    },
                }
            }
        }
    } catch (error) {
        results.checks = { ...results.checks as object, openRouter: { status: 'error', message: String(error) } }
    }

    // Test 2: fal.ai API
    try {
        const falKey = process.env.FAL_KEY
        if (!falKey) {
            results.checks = { ...results.checks as object, falAI: { status: 'error', message: 'FAL_KEY not set' } }
        } else {
            results.checks = {
                ...results.checks as object,
                falAI: {
                    status: 'configured',
                    message: 'FAL_KEY is set',
                },
            }
        }
    } catch (error) {
        results.checks = { ...results.checks as object, falAI: { status: 'error', message: String(error) } }
    }

    // Test 3: ElevenLabs API
    try {
        const elevenKey = process.env.ELEVENLABS_API_KEY
        if (!elevenKey) {
            results.checks = { ...results.checks as object, elevenLabs: { status: 'error', message: 'ELEVENLABS_API_KEY not set' } }
        } else {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': elevenKey,
                },
            })

            if (response.ok) {
                const data = await response.json()
                results.checks = {
                    ...results.checks as object,
                    elevenLabs: {
                        status: 'connected',
                        voiceCount: data.voices?.length || 0,
                        sampleVoices: (data.voices || []).slice(0, 3).map((v: { name: string; voice_id: string }) => v.name),
                    },
                }
            } else {
                const errorText = await response.text().catch(() => '')
                results.checks = {
                    ...results.checks as object,
                    elevenLabs: {
                        status: 'error',
                        httpStatus: response.status,
                        message: errorText.substring(0, 200),
                    },
                }
            }
        }
    } catch (error) {
        results.checks = { ...results.checks as object, elevenLabs: { status: 'error', message: String(error) } }
    }

    // Test 4: Supabase
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseKey) {
            results.checks = { ...results.checks as object, supabase: { status: 'error', message: 'Supabase credentials not set' } }
        } else {
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
            })
            results.checks = {
                ...results.checks as object,
                supabase: {
                    status: response.ok ? 'connected' : 'error',
                    httpStatus: response.status,
                },
            }
        }
    } catch (error) {
        results.checks = { ...results.checks as object, supabase: { status: 'error', message: String(error) } }
    }

    return NextResponse.json(results)
}
