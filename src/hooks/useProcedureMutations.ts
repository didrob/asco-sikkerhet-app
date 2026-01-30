import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import type { Json } from '@/integrations/supabase/types';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'quiz' | 'checkpoint';
  content: Record<string, unknown>;
}

interface ProcedureInput {
  title: string;
  description?: string;
  site_id: string;
  status?: 'draft' | 'published' | 'archived';
  content_blocks?: ContentBlock[];
  due_date?: string | null;
  required_for_roles?: string[] | null;
}

export function useCreateProcedure() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ProcedureInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          title: input.title,
          description: input.description || null,
          site_id: input.site_id,
          status: input.status || 'draft',
          content_blocks: (input.content_blocks || []) as unknown as Json,
          due_date: input.due_date || null,
          required_for_roles: input.required_for_roles || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await logAudit({
        action: 'create',
        resourceType: 'procedure',
        resourceId: data.id,
        metadata: { title: input.title, siteId: input.site_id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({
        title: 'Opprettet',
        description: 'Prosedyren er opprettet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke opprette prosedyren',
        variant: 'destructive',
      });
      console.error('Create procedure error:', error);
    },
  });
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: ProcedureInput & { id: string }) => {
      const { data, error } = await supabase
        .from('procedures')
        .update({
          title: input.title,
          description: input.description || null,
          status: input.status,
          content_blocks: (input.content_blocks || []) as unknown as Json,
          due_date: input.due_date || null,
          required_for_roles: input.required_for_roles || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await logAudit({
        action: 'update',
        resourceType: 'procedure',
        resourceId: data.id,
        metadata: { title: input.title },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure', data.id] });
      toast({
        title: 'Lagret',
        description: 'Endringene er lagret.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre endringene',
        variant: 'destructive',
      });
      console.error('Update procedure error:', error);
    },
  });
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get procedure title before deletion for audit
      const { data: procedure } = await supabase
        .from('procedures')
        .select('title')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log to audit
      await logAudit({
        action: 'delete',
        resourceType: 'procedure',
        resourceId: id,
        metadata: { title: procedure?.title },
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast({
        title: 'Slettet',
        description: 'Prosedyren er slettet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette prosedyren',
        variant: 'destructive',
      });
      console.error('Delete procedure error:', error);
    },
  });
}

export function usePublishProcedure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('procedures')
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      await logAudit({
        action: 'publish',
        resourceType: 'procedure',
        resourceId: data.id,
        metadata: { title: data.title },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      queryClient.invalidateQueries({ queryKey: ['procedure', data.id] });
      toast({
        title: 'Publisert',
        description: 'Prosedyren er nå publisert.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke publisere prosedyren',
        variant: 'destructive',
      });
      console.error('Publish procedure error:', error);
    },
  });
}
