// ═══════════════════════════════════════
// n8n Webhook Configuration
// ═══════════════════════════════════════
// All API calls go through n8n webhooks on Hostinger VPS
// instead of Vercel API routes.

export const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE || 'https://n8n.srv1140504.hstgr.cloud';

export const N8N_ENDPOINTS = {
    // Workflow webhooks
    onboard: `${N8N_BASE}/webhook/onboard`,
    createInfluencer: `${N8N_BASE}/webhook/create-influencer`,
    generateVideo: `${N8N_BASE}/webhook/generate-video`,
    competitorAnalysis: `${N8N_BASE}/webhook/competitor-analysis`,
    adCopy: `${N8N_BASE}/webhook/ad-copy`,

    // Image webhooks
    generateImage: `${N8N_BASE}/webhook/generate-image`,
    listImages: `${N8N_BASE}/webhook/list-images`,
    deleteImage: `${N8N_BASE}/webhook/delete-image`,

    // Other webhooks
    deleteInfluencer: `${N8N_BASE}/webhook/delete-influencer`,
    deleteVideo: `${N8N_BASE}/webhook/delete-video`,
    publishContent: `${N8N_BASE}/webhook/publish-content`,
    engagementBot: `${N8N_BASE}/webhook/engagement-bot`,
} as const;

export type N8NEndpoint = keyof typeof N8N_ENDPOINTS;
