-- Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id = 'captures';
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Create RLS policies for captures bucket
-- Users can view their own captures
CREATE POLICY "Users can view own captures"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'captures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload to their own folder
CREATE POLICY "Users can upload own captures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'captures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own captures
CREATE POLICY "Users can update own captures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'captures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own captures
CREATE POLICY "Users can delete own captures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'captures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for avatars bucket
-- Anyone can view avatars (public read)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload to their own avatar folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);