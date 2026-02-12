-- =========================================
-- THE AI MARKETING FACTORY
-- Supabase Database Schema
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. PROJECTS TABLE
-- Stores analyzed web projects
-- =========================================
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  favicon_url TEXT,
  target_audience JSONB DEFAULT '{}',
  value_proposition TEXT,
  competitors JSONB DEFAULT '[]',
  marketing_constitution JSONB DEFAULT '{}',
  language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en', 'es', 'de', 'fr')),
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. AI INFLUENCERS TABLE
-- AI influencer characters for each project
-- =========================================
CREATE TABLE ai_influencers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT,
  appearance_description TEXT,
  voice_id TEXT, -- ElevenLabs voice ID
  voice_name TEXT,
  visual_profile JSONB DEFAULT '{}', -- Abacus.AI character settings
  sample_video_url TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 3. VIDEOS TABLE
-- Generated marketing videos
-- =========================================
CREATE TABLE videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES ai_influencers(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'linkedin')),
  title TEXT,
  script TEXT,
  audio_url TEXT, -- ElevenLabs generated audio
  video_url TEXT, -- Final rendered video
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en', 'es', 'de', 'fr')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scripting', 'voicing', 'rendering', 'ready', 'published', 'failed')),
  publish_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. ASSETS TABLE
-- Screenshots, logos, and other visual assets
-- =========================================
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('screenshot', 'logo', 'custom', 'generated')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 5. WORKFLOW RUNS TABLE
-- Track autonomous workflow execution
-- =========================================
CREATE TABLE workflow_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('analysis', 'influencer_creation', 'video_generation', 'full_pipeline')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step TEXT,
  steps_completed JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_url ON projects(url);
CREATE INDEX idx_influencers_project_id ON ai_influencers(project_id);
CREATE INDEX idx_videos_project_id ON videos(project_id);
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_workflow_runs_project_id ON workflow_runs(project_id);

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- AI Influencers: Via project ownership
CREATE POLICY "Users can view own influencers" ON ai_influencers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_influencers.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own influencers" ON ai_influencers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_influencers.project_id AND projects.user_id = auth.uid())
  );

-- Videos: Via project ownership
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = videos.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own videos" ON videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = videos.project_id AND projects.user_id = auth.uid())
  );

-- Assets: Via project ownership
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own assets" ON assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

-- Workflow Runs: Via project ownership
CREATE POLICY "Users can view own workflow runs" ON workflow_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = workflow_runs.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own workflow runs" ON workflow_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = workflow_runs.project_id AND projects.user_id = auth.uid())
  );

-- =========================================
-- UPDATED_AT TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON ai_influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
