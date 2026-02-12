-- =========================================
-- SUPABASE STORAGE BUCKETS
-- =========================================

-- Project assets bucket (screenshots, logos, custom images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-assets',
  'project-assets',
  true,
  52428800, -- 50MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
);

-- Generated videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-videos',
  'generated-videos',
  true,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);

-- Audio files bucket (ElevenLabs generated speech)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  104857600, -- 100MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
);

-- Thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- =========================================
-- STORAGE POLICIES
-- =========================================

-- Project assets: authenticated users can upload/view
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-assets');

CREATE POLICY "Anyone can view assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-assets');

-- Generated videos: authenticated users can upload/view
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'generated-videos');

-- Audio files: authenticated users can upload/view
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Anyone can view audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'audio-files');

-- Thumbnails: authenticated users can upload/view
CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'thumbnails');
