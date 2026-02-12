// =========================================
// Database Type Definitions
// Mirrors Supabase schema for type safety
// =========================================

export interface Project {
    id: string
    user_id: string
    url: string
    name: string
    description: string | null
    favicon_url: string | null
    target_audience: {
        demographics: string[]
        interests: string[]
        painPoints: string[]
    }
    value_proposition: string | null
    competitors: string[]
    marketing_constitution: Record<string, unknown>
    analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed'
    created_at: string
    updated_at: string
}

export interface AIInfluencer {
    id: string
    project_id: string
    name: string
    personality: string | null
    appearance_description: string | null
    voice_id: string | null
    voice_name: string | null
    visual_profile: Record<string, unknown>
    sample_video_url: string | null
    avatar_url: string | null
    status: 'draft' | 'generating' | 'ready' | 'failed'
    created_at: string
    updated_at: string
}

export interface Video {
    id: string
    project_id: string
    influencer_id: string | null
    platform: 'instagram' | 'tiktok' | 'linkedin'
    title: string | null
    script: string | null
    audio_url: string | null
    video_url: string | null
    thumbnail_url: string | null
    duration_seconds: number | null
    status: 'draft' | 'scripting' | 'voicing' | 'rendering' | 'ready' | 'published' | 'failed'
    publish_date: string | null
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface Asset {
    id: string
    project_id: string
    asset_type: 'screenshot' | 'logo' | 'custom' | 'generated'
    file_name: string
    file_path: string
    file_size: number | null
    mime_type: string | null
    metadata: Record<string, unknown>
    created_at: string
}

export interface WorkflowRun {
    id: string
    project_id: string
    workflow_type: 'analysis' | 'influencer_creation' | 'video_generation' | 'full_pipeline'
    status: 'pending' | 'running' | 'completed' | 'failed'
    current_step: string | null
    steps_completed: string[]
    error_message: string | null
    started_at: string
    completed_at: string | null
}
