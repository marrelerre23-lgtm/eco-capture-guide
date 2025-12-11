-- Drop the overly permissive policy that allows all users to view all capture images
DROP POLICY IF EXISTS "Users can view all capture images" ON storage.objects;

-- Ensure the correct policy exists (only view own captures)
-- This is a no-op if the policy already exists from previous migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can view own captures'
  ) THEN
    CREATE POLICY "Users can view own captures"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'captures' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;