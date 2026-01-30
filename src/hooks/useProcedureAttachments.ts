import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProcedureAttachment {
  id: string;
  procedure_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

export function useProcedureAttachments(procedureId: string | undefined) {
  return useQuery({
    queryKey: ['procedure-attachments', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      const { data, error } = await supabase
        .from('procedure_attachments')
        .select('*')
        .eq('procedure_id', procedureId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ProcedureAttachment[];
    },
    enabled: !!procedureId,
  });
}

export function useUploadAttachment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      procedureId, 
      file, 
      description 
    }: { 
      procedureId: string; 
      file: File; 
      description?: string;
    }) => {
      if (!user) throw new Error('Ikke autentisert');

      // Validate file
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error('Ugyldig filtype. Tillatte typer: PDF, Word, Excel, PowerPoint, bilder og video.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Filen er for stor. Maksimal størrelse er 50MB.');
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${procedureId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('procedure-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new Error(`Kunne ikke laste opp fil: ${uploadError.message}`);

      // Create database record
      const { data, error } = await supabase
        .from('procedure_attachments')
        .insert({
          procedure_id: procedureId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          description: description || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('procedure-attachments').remove([fileName]);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-attachments', variables.procedureId] });
      toast({
        title: 'Lastet opp',
        description: 'Vedlegget ble lastet opp.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: error instanceof Error ? error.message : 'Kunne ikke laste opp vedlegg',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filePath, procedureId }: { id: string; filePath: string; procedureId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('procedure-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('procedure_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, procedureId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-attachments', data.procedureId] });
      toast({
        title: 'Slettet',
        description: 'Vedlegget ble slettet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette vedlegg',
        variant: 'destructive',
      });
      console.error('Delete attachment error:', error);
    },
  });
}

export function getAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('procedure-attachments')
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
