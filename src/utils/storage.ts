import { supabase } from "@/integrations/supabase/client";

const uploadCaptureImage = async (imageFile: File): Promise<string> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Användaren måste vara inloggad för att ladda upp bilder");
  }

  // Create a unique filename
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const userId = user.id;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error: uploadError } = await supabase.storage
    .from('captures')
    .upload(filePath, imageFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(`Kunde inte ladda upp bilden: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('captures')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const uploadCaptureFromDataUrl = async (dataUrl: string): Promise<string> => {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Create file from blob
  const file = new File([blob], `capture-${Date.now()}.jpeg`, {
    type: 'image/jpeg'
  });

  return uploadCaptureImage(file);
};
