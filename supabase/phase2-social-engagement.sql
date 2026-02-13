-- ═══════════════════════════════════════
-- AI Marketing Factory — Phase 2 Migration
-- Social connections, published content, engagement logs
-- ═══════════════════════════════════════

-- ── 1. social_connections ──
-- Sosyal medya hesap bağlantıları
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','linkedin','twitter')),
  access_token TEXT,
  refresh_token TEXT,
  account_name TEXT,
  account_id TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social connections"
  ON social_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social connections"
  ON social_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social connections"
  ON social_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social connections"
  ON social_connections FOR DELETE
  USING (auth.uid() = user_id);


-- ── 2. published_content ──
-- Yayınlanan/zamanlanmış içerikler
CREATE TABLE IF NOT EXISTS published_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('video','image','carousel','story','reel')),
  source_id UUID,
  source_table TEXT CHECK (source_table IN ('videos','generated_images','carousel_sets')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','linkedin','twitter')),
  caption TEXT,
  hashtags TEXT[],
  post_url TEXT,
  post_id TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed')),
  error_message TEXT,
  engagement JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE published_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own published content"
  ON published_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own published content"
  ON published_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own published content"
  ON published_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own published content"
  ON published_content FOR DELETE
  USING (auth.uid() = user_id);


-- ── 3. engagement_logs ──
-- Etkileşim botu yanıt logları
CREATE TABLE IF NOT EXISTS engagement_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','linkedin','twitter')),
  post_id TEXT,
  comment_author TEXT,
  comment_text TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative','spam')),
  auto_replied BOOLEAN DEFAULT true,
  replied_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagement logs"
  ON engagement_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engagement logs"
  ON engagement_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── 4. maintenance_tasks ──
-- n8n → Antigravity tetikleme için bakım görevleri
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'error_fix','dependency_update','workflow_optimize',
    'api_fallback','performance_tune','feature_request'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  detected_by TEXT DEFAULT 'n8n',
  error_log JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance tasks"
  ON maintenance_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage maintenance tasks"
  ON maintenance_tasks FOR ALL
  USING (auth.role() = 'service_role');


-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_social_connections_project ON social_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_published_content_project ON published_content(project_id);
CREATE INDEX IF NOT EXISTS idx_published_content_status ON published_content(status);
CREATE INDEX IF NOT EXISTS idx_published_content_scheduled ON published_content(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_engagement_logs_project ON engagement_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_engagement_logs_platform ON engagement_logs(platform);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status) WHERE status = 'pending';
