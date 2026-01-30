import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadResult {
  url: string;
  path: string;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError(
      `Ugyldig filtype. Tillatte typer: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      `Filen er for stor. Maksimal størrelse er ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
}

export async function uploadProcedureMedia(
  file: File,
  procedureId: string
): Promise<UploadResult> {
  validateImageFile(file);

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${procedureId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('procedure-media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new UploadError(`Kunne ikke laste opp bilde: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('procedure-media')
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    path: fileName,
  };
}

export async function deleteProcedureMedia(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('procedure-media')
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new UploadError(`Kunne ikke slette bilde: ${error.message}`);
  }
}
