import { supabase } from '../lib/supabase';

export async function uploadImage(file: File, folder: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('equipment-images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('equipment-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const path = url.split('/equipment-images/')[1];
  if (!path) return;

  await supabase.storage
    .from('equipment-images')
    .remove([path]);
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return 'Apenas imagens JPG, PNG ou WEBP são permitidas';
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'A imagem deve ter no máximo 5MB';
  }

  return null;
}
