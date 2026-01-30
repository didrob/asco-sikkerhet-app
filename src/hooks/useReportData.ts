import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompletionStats {
  procedureId: string;
  procedureTitle: string;
  totalUsers: number;
  completedCount: number;
  completionRate: number;
  totalViews: number;
  uniqueViewers: number;
}

export interface UserCompletion {
  userId: string;
  userName: string;
  email: string;
  proceduresCompleted: number;
  proceduresTotal: number;
  lastCompletion: string | null;
}

export interface TimelineData {
  date: string;
  completions: number;
}

export function useCompletionStats(siteId: string | null) {
  return useQuery({
    queryKey: ['completion-stats', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      // Fetch procedures for the site
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('id, title')
        .eq('site_id', siteId)
        .eq('status', 'published');

      if (procError) throw procError;
      if (!procedures?.length) return [];

      // Fetch users assigned to this site
      const { data: siteUsers, error: usersError } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId);

      if (usersError) throw usersError;
      const totalUsers = siteUsers?.length || 0;

      // Fetch completions for these procedures
      const procedureIds = procedures.map(p => p.id);
      const { data: completions, error: compError } = await supabase
        .from('procedure_completions')
        .select('procedure_id, user_id')
        .in('procedure_id', procedureIds);

      if (compError) throw compError;

      // Fetch views for these procedures
      const { data: views, error: viewsError } = await supabase
        .from('procedure_views')
        .select('procedure_id, user_id')
        .in('procedure_id', procedureIds);

      if (viewsError) throw viewsError;

      // Calculate stats per procedure
      const stats: CompletionStats[] = procedures.map(proc => {
        const procCompletions = completions?.filter(c => c.procedure_id === proc.id) || [];
        const uniqueUsers = new Set(procCompletions.map(c => c.user_id)).size;
        
        const procViews = views?.filter(v => v.procedure_id === proc.id) || [];
        const totalViews = procViews.length;
        const uniqueViewers = new Set(procViews.map(v => v.user_id)).size;
        
        return {
          procedureId: proc.id,
          procedureTitle: proc.title,
          totalUsers,
          completedCount: uniqueUsers,
          completionRate: totalUsers > 0 ? Math.round((uniqueUsers / totalUsers) * 100) : 0,
          totalViews,
          uniqueViewers,
        };
      });

      return stats;
    },
    enabled: !!siteId,
  });
}

export function useUserCompletions(siteId: string | null) {
  return useQuery({
    queryKey: ['user-completions', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      // Fetch users assigned to this site with their profiles
      const { data: siteUsers, error: usersError } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId);

      if (usersError) throw usersError;
      if (!siteUsers?.length) return [];

      const userIds = siteUsers.map(u => u.user_id);

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch published procedures for the site
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('id')
        .eq('site_id', siteId)
        .eq('status', 'published');

      if (procError) throw procError;
      const totalProcedures = procedures?.length || 0;
      const procedureIds = procedures?.map(p => p.id) || [];

      // Fetch completions for these users and procedures
      const { data: completions, error: compError } = await supabase
        .from('procedure_completions')
        .select('user_id, procedure_id, completed_at')
        .in('user_id', userIds)
        .in('procedure_id', procedureIds);

      if (compError) throw compError;

      // Build user completion data
      const userCompletions: UserCompletion[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const userComps = completions?.filter(c => c.user_id === userId) || [];
        const uniqueProcedures = new Set(userComps.map(c => c.procedure_id)).size;
        const lastCompletion = userComps.length > 0 
          ? userComps.sort((a, b) => 
              new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
            )[0].completed_at
          : null;

        return {
          userId,
          userName: profile?.full_name || 'Ukjent bruker',
          email: '',
          proceduresCompleted: uniqueProcedures,
          proceduresTotal: totalProcedures,
          lastCompletion,
        };
      });

      return userCompletions.sort((a, b) => b.proceduresCompleted - a.proceduresCompleted);
    },
    enabled: !!siteId,
  });
}

export function useCompletionTimeline(siteId: string | null, days: number = 30) {
  return useQuery({
    queryKey: ['completion-timeline', siteId, days],
    queryFn: async () => {
      if (!siteId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch procedures for the site
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('id')
        .eq('site_id', siteId);

      if (procError) throw procError;
      const procedureIds = procedures?.map(p => p.id) || [];

      // Fetch completions within the time range
      const { data: completions, error: compError } = await supabase
        .from('procedure_completions')
        .select('completed_at')
        .in('procedure_id', procedureIds)
        .gte('completed_at', startDate.toISOString());

      if (compError) throw compError;

      // Group by date
      const dateMap = new Map<string, number>();
      
      // Initialize all days with 0
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, 0);
      }

      // Count completions per day
      completions?.forEach(c => {
        const dateStr = c.completed_at.split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      });

      // Convert to array and sort by date
      const timeline: TimelineData[] = Array.from(dateMap.entries())
        .map(([date, completions]) => ({ date, completions }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return timeline;
    },
    enabled: !!siteId,
  });
}

export function useTotalStats(siteId: string | null) {
  const { data: completionStats } = useCompletionStats(siteId);
  const { data: userCompletions } = useUserCompletions(siteId);

  const totalCompleted = completionStats?.reduce((sum, s) => sum + s.completedCount, 0) || 0;
  const averageRate = completionStats?.length 
    ? Math.round(completionStats.reduce((sum, s) => sum + s.completionRate, 0) / completionStats.length)
    : 0;
  const usersAt100 = userCompletions?.filter(u => 
    u.proceduresTotal > 0 && u.proceduresCompleted === u.proceduresTotal
  ).length || 0;

  return {
    totalCompleted,
    averageRate,
    usersAt100,
    totalUsers: userCompletions?.length || 0,
    totalProcedures: completionStats?.length || 0,
  };
}
