import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcedureOverviewStats {
  procedureId: string;
  title: string;
  status: 'published' | 'draft' | 'archived';
  updatedAt: string;
  totalUsers: number;
  completedCount: number;
  inProgressCount: number;
  completionRate: number;
}

export interface ProcedureOverviewSummary {
  totalProcedures: number;
  publishedCount: number;
  draftCount: number;
  totalCompletions: number;
  totalInProgress: number;
  averageCompletionRate: number;
  procedures: ProcedureOverviewStats[];
}

export function useProcedureOverview(siteId: string | null) {
  return useQuery({
    queryKey: ['procedure-overview', siteId],
    queryFn: async (): Promise<ProcedureOverviewSummary> => {
      // Fetch all procedures for the site
      const { data: procedures, error: proceduresError } = await supabase
        .from('procedures')
        .select('id, title, status, updated_at')
        .eq('site_id', siteId!)
        .order('updated_at', { ascending: false });

      if (proceduresError) throw proceduresError;

      // Fetch all users assigned to this site
      const { data: siteUsers, error: usersError } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId!);

      if (usersError) throw usersError;

      const totalUsers = siteUsers?.length || 0;
      const procedureIds = procedures?.map(p => p.id) || [];

      // Fetch all completions for these procedures
      const { data: completions, error: completionsError } = await supabase
        .from('procedure_completions')
        .select('procedure_id, user_id')
        .in('procedure_id', procedureIds.length > 0 ? procedureIds : ['']);

      if (completionsError) throw completionsError;

      // Fetch all in-progress for these procedures
      const { data: progress, error: progressError } = await supabase
        .from('procedure_progress')
        .select('procedure_id, user_id')
        .in('procedure_id', procedureIds.length > 0 ? procedureIds : ['']);

      if (progressError) throw progressError;

      // Build maps for counting
      const completionsByProcedure = new Map<string, Set<string>>();
      const progressByProcedure = new Map<string, Set<string>>();

      completions?.forEach(c => {
        if (!completionsByProcedure.has(c.procedure_id)) {
          completionsByProcedure.set(c.procedure_id, new Set());
        }
        completionsByProcedure.get(c.procedure_id)!.add(c.user_id);
      });

      progress?.forEach(p => {
        if (!progressByProcedure.has(p.procedure_id)) {
          progressByProcedure.set(p.procedure_id, new Set());
        }
        progressByProcedure.get(p.procedure_id)!.add(p.user_id);
      });

      // Build overview per procedure
      const procedureStats: ProcedureOverviewStats[] = (procedures || []).map(proc => {
        const completedCount = completionsByProcedure.get(proc.id)?.size || 0;
        const inProgressCount = progressByProcedure.get(proc.id)?.size || 0;
        const completionRate = totalUsers > 0 
          ? Math.round((completedCount / totalUsers) * 100) 
          : 0;

        return {
          procedureId: proc.id,
          title: proc.title,
          status: proc.status as 'published' | 'draft' | 'archived',
          updatedAt: proc.updated_at,
          totalUsers,
          completedCount,
          inProgressCount,
          completionRate,
        };
      });

      // Calculate summary stats
      const publishedProcedures = procedureStats.filter(p => p.status === 'published');
      const totalCompletions = completions?.length || 0;
      const totalInProgress = progress?.length || 0;
      const averageCompletionRate = publishedProcedures.length > 0
        ? Math.round(
            publishedProcedures.reduce((sum, p) => sum + p.completionRate, 0) / 
            publishedProcedures.length
          )
        : 0;

      return {
        totalProcedures: procedureStats.length,
        publishedCount: publishedProcedures.length,
        draftCount: procedureStats.filter(p => p.status === 'draft').length,
        totalCompletions,
        totalInProgress,
        averageCompletionRate,
        procedures: procedureStats,
      };
    },
    enabled: !!siteId,
  });
}

export interface ProcedureUserDetail {
  userId: string;
  userName: string;
  status: 'completed' | 'in_progress' | 'not_started';
  completedAt: string | null;
  lastActivityAt: string | null;
}

export function useProcedureUsers(procedureId: string | null, siteId: string | null) {
  return useQuery({
    queryKey: ['procedure-users', procedureId, siteId],
    queryFn: async (): Promise<ProcedureUserDetail[]> => {
      if (!procedureId || !siteId) return [];

      // Get users assigned to this site
      const { data: siteUsers, error: usersError } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId);

      if (usersError) throw usersError;

      const userIds = siteUsers?.map(u => u.user_id) || [];
      if (userIds.length === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get completions for this procedure
      const { data: completions, error: completionsError } = await supabase
        .from('procedure_completions')
        .select('user_id, completed_at')
        .eq('procedure_id', procedureId)
        .in('user_id', userIds);

      if (completionsError) throw completionsError;

      // Get progress for this procedure
      const { data: progress, error: progressError } = await supabase
        .from('procedure_progress')
        .select('user_id, last_activity_at')
        .eq('procedure_id', procedureId)
        .in('user_id', userIds);

      if (progressError) throw progressError;

      const completionMap = new Map(completions?.map(c => [c.user_id, c]) || []);
      const progressMap = new Map(progress?.map(p => [p.user_id, p]) || []);

      return (profiles || []).map(profile => {
        const completion = completionMap.get(profile.id);
        const prog = progressMap.get(profile.id);

        let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
        if (completion) {
          status = 'completed';
        } else if (prog) {
          status = 'in_progress';
        }

        return {
          userId: profile.id,
          userName: profile.full_name || 'Ukjent bruker',
          status,
          completedAt: completion?.completed_at || null,
          lastActivityAt: prog?.last_activity_at || null,
        };
      }).sort((a, b) => {
        // Sort by status: completed first, then in_progress, then not_started
        const order = { completed: 0, in_progress: 1, not_started: 2 };
        return order[a.status] - order[b.status];
      });
    },
    enabled: !!procedureId && !!siteId,
  });
}
