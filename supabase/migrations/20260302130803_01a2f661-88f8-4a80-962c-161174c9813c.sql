
-- Create public bucket for exercise media
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exercise-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'exercise-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'exercise-media' AND auth.role() = 'authenticated');
