import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface ProcedureRevision {
  id: string;
  procedure_id: string;
  version: string;
  content_snapshot: Json;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

export function useProcedureRevisions(procedureId: string | undefined) {
  return useQuery({
    queryKey: ['procedure-revisions', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      const { data: revisionsData, error } = await supabase
        .from('procedure_revisions')
        .select('*')
        .eq('procedure_id', procedureId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((revisionsData || []).filter(r => r.changed_by).map(r => r.changed_by as string))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (revisionsData || []).map(revision => ({
        ...revision,
        profile: revision.changed_by ? profileMap.get(revision.changed_by) || null : null,
      })) as ProcedureRevision[];
    },
    enabled: !!procedureId,
  });
}

export function useCreateRevision() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      procedureId,
      version,
      contentSnapshot,
      changeSummary,
    }: {
      procedureId: string;
      version: string;
      contentSnapshot: Record<string, unknown>;
      changeSummary?: string;
    }) => {
      if (!user) throw new Error('Ikke autentisert');

      const { data, error } = await supabase
        .from('procedure_revisions')
        .insert({
          procedure_id: procedureId,
          version,
          content_snapshot: contentSnapshot as unknown as Json,
          changed_by: user.id,
          change_summary: changeSummary || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-revisions', variables.procedureId] });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre revisjon',
        variant: 'destructive',
      });
      console.error('Create revision error:', error);
    },
  });
}

export function useRestoreRevision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      procedureId,
      revision,
    }: {
      procedureId: string;
      revision: ProcedureRevision;
    }) => {
      const snapshot = revision.content_snapshot as Record<string, unknown>;
      
      const { data, error } = await supabase
        .from('procedures')
        .update({
          title: snapshot.title as string,
          description: snapshot.description as string | null,
          content_blocks: snapshot.content_blocks as Json,
          category: snapshot.category as string | null,
          version: snapshot.version as string | null,
          tags: snapshot.tags as string[] | null,
        })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['procedure', data.id] });
      queryClient.invalidateQueries({ queryKey: ['procedure-revisions', data.id] });
      toast({
        title: 'Gjenopprettet',
        description: 'Prosedyren ble gjenopprettet til valgt versjon.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke gjenopprette versjon',
        variant: 'destructive',
      });
      console.error('Restore revision error:', error);
    },
  });
}
