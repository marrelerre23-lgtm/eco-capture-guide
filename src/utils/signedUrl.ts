import { supabase } from "@/integrations/supabase/client";

/**
 * Get a signed URL for a capture image.
 * Handles both new file paths and legacy public URLs.
 */
export const getSignedCaptureUrl = async (imageUrl: string): Promise<string> => {
  // If it's already a data URL, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If it's a legacy public URL, extract the path
  // Format: https://xxx.supabase.co/storage/v1/object/public/captures/userId/filename
  const publicUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/captures\/(.+)$/);
  const filePath = publicUrlMatch ? publicUrlMatch[1] : imageUrl;

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from('captures')
    .createSignedUrl(filePath, 3600);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating signed URL:', error);
    }
    // Fallback to original URL if signed URL fails
    return imageUrl;
  }

  return data.signedUrl;
};

