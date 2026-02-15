-- ═══════════════════════════════════════
-- Publish Schedules — Otomatik yayın zamanlama
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS publish_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms TEXT[] DEFAULT '{}',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','custom')),
  publish_times JSONB NOT NULL DEFAULT '["10:00"]',
  -- daily: ["10:00","19:00"]
  -- weekly: {"mon":["10:00"],"wed":["19:00"],"fri":["10:00"]}
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE publish_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
  ON publish_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON publish_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON publish_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON publish_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can read all (for n8n cron)
CREATE POLICY "Service role can read all schedules"
  ON publish_schedules FOR SELECT
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_publish_schedules_project ON publish_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_publish_schedules_active ON publish_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_publish_schedules_next_run ON publish_schedules(next_run_at) WHERE is_active = true;
