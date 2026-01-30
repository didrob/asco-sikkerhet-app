import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Procedure = Tables<'procedures'>;
type ProcedureProgress = Tables<'procedure_progress'>;
type ProcedureCompletion = Tables<'procedure_completions'>;

export interface ProcedureWithProgress extends Procedure {
  progress: ProcedureProgress | null;
  completion: ProcedureCompletion | null;
  status_label: 'not_started' | 'in_progress' | 'completed';
}

export function useProcedures(siteId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['procedures', siteId, user?.id],
    queryFn: async () => {
      // Fetch published procedures for the site
      const { data: procedures, error: proceduresError } = await supabase
        .from('procedures')
        .select('*')
        .eq('site_id', siteId!)
        .eq('status', 'published')
        .order('title');

      if (proceduresError) throw proceduresError;

      // Fetch user's progress for these procedures
      const { data: progressData, error: progressError } = await supabase
        .from('procedure_progress')
        .select('*')
        .eq('user_id', user!.id)
        .in('procedure_id', procedures?.map(p => p.id) || []);

      if (progressError) throw progressError;

      // Fetch user's completions for these procedures
      const { data: completionsData, error: completionsError } = await supabase
        .from('procedure_completions')
        .select('*')
        .eq('user_id', user!.id)
        .in('procedure_id', procedures?.map(p => p.id) || []);

      if (completionsError) throw completionsError;

      // Map progress and completions to procedures
      const progressMap = new Map(progressData?.map(p => [p.procedure_id, p]) || []);
      const completionMap = new Map(completionsData?.map(c => [c.procedure_id, c]) || []);

      return (procedures || []).map(procedure => {
        const progress = progressMap.get(procedure.id) || null;
        const completion = completionMap.get(procedure.id) || null;
        
        let status_label: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        if (completion) {
          status_label = 'completed';
        } else if (progress) {
          status_label = 'in_progress';
        }

        return {
          ...procedure,
          progress,
          completion,
          status_label,
        } as ProcedureWithProgress;
      });
    },
    enabled: !!user && !!siteId,
  });
}

export function useProcedureStats(siteId: string | null) {
  const { data: procedures, isLoading } = useProcedures(siteId);

  const stats = {
    total: procedures?.length || 0,
    completed: procedures?.filter(p => p.status_label === 'completed').length || 0,
    inProgress: procedures?.filter(p => p.status_label === 'in_progress').length || 0,
    notStarted: procedures?.filter(p => p.status_label === 'not_started').length || 0,
  };

  return { stats, isLoading };
}
