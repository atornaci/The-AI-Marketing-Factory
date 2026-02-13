-- =========================================
-- MIGRATION: Visual Content Generation
-- Adds tables for generated images and 
-- carousel sets, plus brand info to projects
-- =========================================

-- 1. Add brand info columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Update videos platform check to include youtube
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_platform_check;
ALTER TABLE videos ADD CONSTRAINT videos_platform_check 
  CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'youtube'));

-- =========================================
-- 3. GENERATED IMAGES TABLE
-- Stores all generated visual content
-- =========================================
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  carousel_set_id UUID,  -- NULL for non-carousel images
  image_type TEXT NOT NULL CHECK (image_type IN (
    'static_post', 'carousel_slide', 'thumbnail',
    'story', 'banner', 'custom'
  )),
  prompt TEXT,
  image_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'youtube')),
  brand_colors JSONB DEFAULT '[]',
  has_logo BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. CAROUSEL SETS TABLE
-- Groups carousel slides together
-- =========================================
CREATE TABLE IF NOT EXISTS carousel_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  slide_count INTEGER DEFAULT 0,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'youtube')),
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link carousel slides to carousel sets
ALTER TABLE generated_images 
  ADD CONSTRAINT fk_carousel_set 
  FOREIGN KEY (carousel_set_id) REFERENCES carousel_sets(id) ON DELETE CASCADE;

-- =========================================
-- 5. INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_generated_images_project ON generated_images(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(image_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_carousel ON generated_images(carousel_set_id);
CREATE INDEX IF NOT EXISTS idx_carousel_sets_project ON carousel_sets(project_id);

-- =========================================
-- 6. ROW LEVEL SECURITY
-- =========================================
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_sets ENABLE ROW LEVEL SECURITY;

-- Generated Images: Via project ownership
CREATE POLICY "Users can view own generated images" ON generated_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own generated images" ON generated_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_images.project_id AND projects.user_id = auth.uid())
  );

-- Carousel Sets: Via project ownership
CREATE POLICY "Users can view own carousel sets" ON carousel_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = carousel_sets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own carousel sets" ON carousel_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = carousel_sets.project_id AND projects.user_id = auth.uid())
  );

-- Service role bypass for API operations
CREATE POLICY "Service role full access to generated_images" ON generated_images
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to carousel_sets" ON carousel_sets
  FOR ALL USING (auth.role() = 'service_role');
