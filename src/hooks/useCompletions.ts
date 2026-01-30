import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CompletionWithDetails {
  id: string;
  procedure_id: string;
  user_id: string;
  completed_at: string;
  expires_at: string | null;
  signature_text: string | null;
  signature_storage_path: string | null;
  procedure?: {
    id: string;
    title: string;
    description: string | null;
    site_id: string;
  };
}

export function useUserCompletions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_completions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('procedure_completions')
        .select(`
          *,
          procedure:procedures(id, title, description, site_id)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return data.map(completion => ({
        ...completion,
        procedure: completion.procedure as CompletionWithDetails['procedure'],
      })) as CompletionWithDetails[];
    },
    enabled: !!user,
  });
}

export function useCompletion(completionId: string | null) {
  return useQuery({
    queryKey: ['completion', completionId],
    queryFn: async () => {
      if (!completionId) return null;

      const { data, error } = await supabase
        .from('procedure_completions')
        .select(`
          *,
          procedure:procedures(id, title, description, site_id)
        `)
        .eq('id', completionId)
        .single();

      if (error) throw error;

      return {
        ...data,
        procedure: data.procedure as CompletionWithDetails['procedure'],
      } as CompletionWithDetails;
    },
    enabled: !!completionId,
  });
}

export function useAllCompletions() {
  return useQuery({
    queryKey: ['all_completions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_completions')
        .select(`
          *,
          procedure:procedures(id, title, description, site_id)
        `)
        .order('completed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data.map(completion => ({
        ...completion,
        procedure: completion.procedure as CompletionWithDetails['procedure'],
      })) as CompletionWithDetails[];
    },
  });
}
