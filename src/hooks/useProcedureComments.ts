import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProcedureComment {
  id: string;
  procedure_id: string;
  user_id: string;
  content: string;
  block_id: string | null;
  parent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: ProcedureComment[];
}

export function useProcedureComments(procedureId: string | undefined) {
  return useQuery({
    queryKey: ['procedure-comments', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];
      
      // Fetch comments
      const { data: commentsData, error } = await supabase
        .from('procedure_comments')
        .select('*')
        .eq('procedure_id', procedureId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for comments
      const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('procedure_comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          // Get profiles for replies
          const replyUserIds = [...new Set((replies || []).map(r => r.user_id))];
          const { data: replyProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', replyUserIds);
          
          const replyProfileMap = new Map(replyProfiles?.map(p => [p.id, p]) || []);

          return {
            ...comment,
            profile: profileMap.get(comment.user_id) || null,
            replies: (replies || []).map(reply => ({
              ...reply,
              profile: replyProfileMap.get(reply.user_id) || null,
            })),
          };
        })
      );

      return commentsWithReplies as ProcedureComment[];
    },
    enabled: !!procedureId,
  });
}

export function useCreateComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      procedureId,
      content,
      blockId,
      parentId,
    }: {
      procedureId: string;
      content: string;
      blockId?: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error('Ikke autentisert');

      const { data, error } = await supabase
        .from('procedure_comments')
        .insert({
          procedure_id: procedureId,
          user_id: user.id,
          content,
          block_id: blockId || null,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-comments', variables.procedureId] });
      toast({
        title: 'Kommentar lagt til',
        description: 'Kommentaren din ble lagret.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke legge til kommentar',
        variant: 'destructive',
      });
      console.error('Create comment error:', error);
    },
  });
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      procedureId,
    }: {
      id: string;
      status: 'open' | 'resolved';
      procedureId: string;
    }) => {
      const { data, error } = await supabase
        .from('procedure_comments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-comments', result.procedureId] });
      toast({
        title: result.data.status === 'resolved' ? 'Markert som løst' : 'Gjenåpnet',
        description: result.data.status === 'resolved' 
          ? 'Kommentaren ble markert som løst.' 
          : 'Kommentaren ble gjenåpnet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere kommentar',
        variant: 'destructive',
      });
      console.error('Update comment error:', error);
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, procedureId }: { id: string; procedureId: string }) => {
      const { error } = await supabase
        .from('procedure_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, procedureId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-comments', result.procedureId] });
      toast({
        title: 'Slettet',
        description: 'Kommentaren ble slettet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette kommentar',
        variant: 'destructive',
      });
      console.error('Delete comment error:', error);
    },
  });
}
