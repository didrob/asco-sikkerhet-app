import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Procedure = Tables<'procedures'>;
type ProcedureProgress = Tables<'procedure_progress'>;

export interface ProcedureDetail extends Procedure {
  progress: ProcedureProgress | null;
}

export function useProcedure(procedureId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['procedure', procedureId, user?.id],
    queryFn: async () => {
      // Fetch the procedure
      const { data: procedure, error: procedureError } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', procedureId!)
        .single();

      if (procedureError) throw procedureError;

      // Fetch user's progress for this procedure
      const { data: progress, error: progressError } = await supabase
        .from('procedure_progress')
        .select('*')
        .eq('user_id', user!.id)
        .eq('procedure_id', procedureId!)
        .maybeSingle();

      if (progressError) throw progressError;

      return {
        ...procedure,
        progress,
      } as ProcedureDetail;
    },
    enabled: !!user && !!procedureId,
  });
}
