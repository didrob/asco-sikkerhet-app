import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  uniqueUsers: number;
  totalProcedureViews: number;
  avgReadDuration: number;
  proceduresCompleted: number;
  coursesCompleted: number;
  dailyActivity: { 
    date: string; 
    views: number; 
    completions: number;
    uniqueUsers: number;
  }[];
  siteAdoption: { 
    siteId: string; 
    siteName: string; 
    totalUsers: number; 
    activeUsers: number; 
    adoptionRate: number;
  }[];
  topUsers: { 
    userId: string; 
    userName: string; 
    views: number; 
    completions: number; 
    courses: number;
  }[];
  topProcedures: {
    procedureId: string;
    procedureTitle: string;
    views: number;
  }[];
}

export function useUserStats(days: number = 7) {
  return useQuery({
    queryKey: ['user_stats', days],
    queryFn: async (): Promise<UserStats> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();
      
      // Fetch procedure views
      const { data: views, error: viewsError } = await supabase
        .from('procedure_views')
        .select('user_id, viewed_at, duration_seconds, procedure_id')
        .gte('viewed_at', startDateStr);
      
      if (viewsError) throw viewsError;
      
      // Fetch procedure completions
      const { data: procCompletions, error: procError } = await supabase
        .from('procedure_completions')
        .select('user_id, completed_at, procedure_id')
        .gte('completed_at', startDateStr);
      
      if (procError) throw procError;
      
      // Fetch course completions (passed)
      const { data: courseCompletions, error: courseError } = await supabase
        .from('training_assignments')
        .select('user_id, completed_at')
        .eq('passed', true)
        .gte('completed_at', startDateStr);
      
      if (courseError) throw courseError;
      
      // Fetch sites and user assignments for adoption rate
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id, name')
        .eq('active', true);
      
      if (sitesError) throw sitesError;
      
      const { data: siteAssignments, error: assignError } = await supabase
        .from('user_site_assignments')
        .select('user_id, site_id');
      
      if (assignError) throw assignError;
      
      // Fetch profiles for user names
      const allUserIds = new Set([
        ...(views?.map(v => v.user_id) || []),
        ...(procCompletions?.map(c => c.user_id) || []),
        ...(courseCompletions?.map(c => c.user_id) || []),
      ]);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(allUserIds));
      
      if (profilesError) throw profilesError;
      
      // Fetch procedures for titles
      const procedureIds = new Set(views?.map(v => v.procedure_id) || []);
      const { data: procedures, error: proceduresError } = await supabase
        .from('procedures')
        .select('id, title')
        .in('id', Array.from(procedureIds));
      
      if (proceduresError) throw proceduresError;
      
      // Calculate unique users
      const uniqueUsers = allUserIds.size;
      
      // Calculate views stats
      const totalProcedureViews = views?.length || 0;
      const totalDuration = views?.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) || 0;
      const avgReadDuration = totalProcedureViews > 0 ? Math.round(totalDuration / totalProcedureViews) : 0;
      
      // Calculate daily activity
      const dateMap = new Map<string, { views: number; completions: number; users: Set<string> }>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { views: 0, completions: 0, users: new Set() });
      }
      
      views?.forEach(view => {
        const dateStr = view.viewed_at.split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
          entry.views++;
          entry.users.add(view.user_id);
        }
      });
      
      procCompletions?.forEach(comp => {
        const dateStr = comp.completed_at.split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
          entry.completions++;
          entry.users.add(comp.user_id);
        }
      });
      
      const dailyActivity = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          views: data.views,
          completions: data.completions,
          uniqueUsers: data.users.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate site adoption
      const siteAdoption = sites?.map(site => {
        const siteUserIds = siteAssignments
          ?.filter(a => a.site_id === site.id)
          .map(a => a.user_id) || [];
        
        const activeUserIds = new Set(
          [...(views || []), ...(procCompletions || [])]
            .filter(item => siteUserIds.includes(item.user_id))
            .map(item => item.user_id)
        );
        
        return {
          siteId: site.id,
          siteName: site.name,
          totalUsers: siteUserIds.length,
          activeUsers: activeUserIds.size,
          adoptionRate: siteUserIds.length > 0 
            ? Math.round((activeUserIds.size / siteUserIds.length) * 100) 
            : 0,
        };
      }) || [];
      
      // Calculate top users
      const userStatsMap = new Map<string, { views: number; completions: number; courses: number }>();
      
      views?.forEach(view => {
        const stats = userStatsMap.get(view.user_id) || { views: 0, completions: 0, courses: 0 };
        stats.views++;
        userStatsMap.set(view.user_id, stats);
      });
      
      procCompletions?.forEach(comp => {
        const stats = userStatsMap.get(comp.user_id) || { views: 0, completions: 0, courses: 0 };
        stats.completions++;
        userStatsMap.set(comp.user_id, stats);
      });
      
      courseCompletions?.forEach(comp => {
        const stats = userStatsMap.get(comp.user_id) || { views: 0, completions: 0, courses: 0 };
        stats.courses++;
        userStatsMap.set(comp.user_id, stats);
      });
      
      const topUsers = Array.from(userStatsMap.entries())
        .map(([userId, stats]) => ({
          userId,
          userName: profiles?.find(p => p.id === userId)?.full_name || 'Ukjent',
          ...stats,
        }))
        .sort((a, b) => (b.views + b.completions * 10 + b.courses * 20) - (a.views + a.completions * 10 + a.courses * 20))
        .slice(0, 10);
      
      // Calculate top procedures by views
      const procedureViewsMap = new Map<string, number>();
      views?.forEach(view => {
        procedureViewsMap.set(view.procedure_id, (procedureViewsMap.get(view.procedure_id) || 0) + 1);
      });
      
      const topProcedures = Array.from(procedureViewsMap.entries())
        .map(([procedureId, viewCount]) => ({
          procedureId,
          procedureTitle: procedures?.find(p => p.id === procedureId)?.title || 'Ukjent',
          views: viewCount,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      
      return {
        uniqueUsers,
        totalProcedureViews,
        avgReadDuration,
        proceduresCompleted: procCompletions?.length || 0,
        coursesCompleted: courseCompletions?.length || 0,
        dailyActivity,
        siteAdoption,
        topUsers,
        topProcedures,
      };
    },
  });
}

// Format duration in seconds to readable string
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}t ${remainingMinutes}m`;
}
