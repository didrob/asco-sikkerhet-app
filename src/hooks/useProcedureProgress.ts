import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export function useStartProcedure() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (procedureId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if progress already exists
      const { data: existing } = await supabase
        .from('procedure_progress')
        .select('id')
        .eq('procedure_id', procedureId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Already started, just return
        return existing;
      }

      const { data, error } = await supabase
        .from('procedure_progress')
        .insert({
          procedure_id: procedureId,
          user_id: user.id,
          current_block_index: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, procedureId) => {
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke starte prosedyren',
        variant: 'destructive',
      });
      console.error('Start procedure error:', error);
    },
  });
}

export function useAdvanceBlock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      procedureId, 
      currentIndex,
      checkpointAnswer 
    }: { 
      procedureId: string; 
      currentIndex: number;
      checkpointAnswer?: { blockId: string; answer: unknown };
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get current progress to update checkpoint answers
      const { data: progress } = await supabase
        .from('procedure_progress')
        .select('checkpoint_answers')
        .eq('procedure_id', procedureId)
        .eq('user_id', user.id)
        .single();

      const existingAnswers = (progress?.checkpoint_answers as Record<string, unknown>) || {};
      const updatedAnswers = checkpointAnswer 
        ? { ...existingAnswers, [checkpointAnswer.blockId]: checkpointAnswer.answer }
        : existingAnswers;

      const { data, error } = await supabase
        .from('procedure_progress')
        .update({
          current_block_index: currentIndex + 1,
          last_activity_at: new Date().toISOString(),
          checkpoint_answers: updatedAnswers as Json,
        })
        .eq('procedure_id', procedureId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { procedureId }) => {
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke gå til neste steg',
        variant: 'destructive',
      });
      console.error('Advance block error:', error);
    },
  });
}

export function useCompleteProcedure() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      procedureId, 
      signatureText,
      signatureBlob 
    }: { 
      procedureId: string; 
      signatureText?: string;
      signatureBlob?: Blob;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let signatureStoragePath: string | null = null;

      // Upload signature to storage if provided
      if (signatureBlob) {
        const fileName = `${user.id}/${procedureId}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(fileName, signatureBlob, {
            contentType: 'image/png',
          });

        if (uploadError) throw uploadError;
        signatureStoragePath = fileName;
      }

      // Create completion record
      const { data, error } = await supabase
        .from('procedure_completions')
        .insert({
          procedure_id: procedureId,
          user_id: user.id,
          signature_text: signatureText || null,
          signature_storage_path: signatureStoragePath,
        })
        .select()
        .single();

      if (error) throw error;

      // Delete progress record since it's completed
      await supabase
        .from('procedure_progress')
        .delete()
        .eq('procedure_id', procedureId)
        .eq('user_id', user.id);

      return data;
    },
    onSuccess: (_, { procedureId }) => {
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({
        title: 'Fullført!',
        description: 'Prosedyren er nå fullført og signert.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke fullføre prosedyren',
        variant: 'destructive',
      });
      console.error('Complete procedure error:', error);
    },
  });
}
