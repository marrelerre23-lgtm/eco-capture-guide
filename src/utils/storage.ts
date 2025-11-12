import { supabase } from "@/integrations/supabase/client";

export const uploadCaptureImage = async (imageFile: File): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Användaren måste vara inloggad för att ladda upp bilder");
  }

  // Create a unique filename
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const userId = (await user).data.user?.id;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('captures')
    .upload(filePath, imageFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Kunde inte ladda upp bilden: ${error.message}`);
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

export const deleteImage = async (imageUrl: string): Promise<void> => {
  // Extract file path from URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(-2).join('/'); // Get userId/filename

  const { error } = await supabase.storage
    .from('captures')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    throw new Error(`Kunde inte ta bort bilden: ${error.message}`);
  }
};

export const uploadAvatarImage = async (imageFile: File): Promise<string> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error("Användaren måste vara inloggad för att ladda upp bilder");
  }

  // Create a unique filename
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const userId = user.data.user.id;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage (overwrites existing avatar)
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, imageFile, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Kunde inte ladda upp profilbilden: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};