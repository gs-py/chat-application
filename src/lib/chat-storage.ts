import { supabase } from '@/lib/supabase';

const BUCKET = 'chat-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function isImageFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_SIZE_BYTES;
}

export function getImageUploadError(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a JPEG, PNG, GIF, or WebP image.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Image must be under 5MB.';
  }
  return null;
}

/**
 * Uploads an image to chat-images bucket. Path: {conversationId}/{userId}/{timestamp}-{safeName}
 * Returns the public URL to store in message.image_url.
 */
export async function uploadChatImage(
  file: File,
  conversationId: string,
  userId: string
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${conversationId}/${userId}/${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
