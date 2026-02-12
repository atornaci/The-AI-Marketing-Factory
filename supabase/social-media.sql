-- =========================================
-- Social Media Integration Tables
-- Run this in Supabase SQL Editor
-- =========================================

-- Social media account connections
CREATE TABLE IF NOT EXISTS social_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'twitter')),
    account_id TEXT,
    account_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Publish history / audit trail
CREATE TABLE IF NOT EXISTS publish_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'failed', 'scheduled', 'pending')),
    post_id TEXT,
    post_url TEXT,
    error_message TEXT,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social connections"
    ON social_connections FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own publish history"
    ON publish_history FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_history_video ON publish_history(video_id);
CREATE INDEX IF NOT EXISTS idx_publish_history_user ON publish_history(user_id);
