import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProcedureViewStats {
  procedureId: string;
  procedureTitle: string;
  totalViews: number;
  uniqueUsers: number;
  avgDuration: number;
}

// Log a procedure view
export function useLogProcedureView() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (procedureId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('procedure_views')
        .insert({
          procedure_id: procedureId,
          user_id: user.id,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}

// Update view duration when leaving the page
export function useUpdateViewDuration() {
  return useMutation({
    mutationFn: async ({ viewId, durationSeconds }: { viewId: string; durationSeconds: number }) => {
      const { error } = await supabase
        .from('procedure_views')
        .update({ duration_seconds: durationSeconds })
        .eq('id', viewId);
      
      if (error) throw error;
    },
  });
}

// Get view stats for all procedures in a site (for reports)
export function useProcedureViewStats(siteId: string | null) {
  return useQuery({
    queryKey: ['procedure_view_stats', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      // First get procedures for the site
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('id, title')
        .eq('site_id', siteId)
        .eq('status', 'published');
      
      if (procError) throw procError;
      if (!procedures?.length) return [];
      
      const procedureIds = procedures.map(p => p.id);
      
      // Get all views for these procedures
      const { data: views, error: viewsError } = await supabase
        .from('procedure_views')
        .select('procedure_id, user_id, duration_seconds')
        .in('procedure_id', procedureIds);
      
      if (viewsError) throw viewsError;
      
      // Aggregate per procedure
      const statsMap = new Map<string, {
        procedureId: string;
        procedureTitle: string;
        totalViews: number;
        uniqueUsers: Set<string>;
        totalDuration: number;
      }>();
      
      procedures.forEach(proc => {
        statsMap.set(proc.id, {
          procedureId: proc.id,
          procedureTitle: proc.title,
          totalViews: 0,
          uniqueUsers: new Set(),
          totalDuration: 0,
        });
      });
      
      views?.forEach(view => {
        const stat = statsMap.get(view.procedure_id);
        if (stat) {
          stat.totalViews++;
          stat.uniqueUsers.add(view.user_id);
          stat.totalDuration += view.duration_seconds || 0;
        }
      });
      
      const stats: ProcedureViewStats[] = Array.from(statsMap.values()).map(stat => ({
        procedureId: stat.procedureId,
        procedureTitle: stat.procedureTitle,
        totalViews: stat.totalViews,
        uniqueUsers: stat.uniqueUsers.size,
        avgDuration: stat.totalViews > 0 ? Math.round(stat.totalDuration / stat.totalViews) : 0,
      }));
      
      return stats;
    },
    enabled: !!siteId,
  });
}

// Get total view stats for admin dashboard
export function useTotalViewStats(days: number = 30) {
  return useQuery({
    queryKey: ['total_view_stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: views, error } = await supabase
        .from('procedure_views')
        .select('id, user_id, viewed_at, duration_seconds')
        .gte('viewed_at', startDate.toISOString());
      
      if (error) throw error;
      
      const uniqueUsers = new Set(views?.map(v => v.user_id) || []).size;
      const totalViews = views?.length || 0;
      const totalDuration = views?.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) || 0;
      const avgDuration = totalViews > 0 ? Math.round(totalDuration / totalViews) : 0;
      
      // Group by date for chart
      const dateMap = new Map<string, { views: number; users: Set<string> }>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { views: 0, users: new Set() });
      }
      
      views?.forEach(view => {
        const dateStr = view.viewed_at.split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
          entry.views++;
          entry.users.add(view.user_id);
        }
      });
      
      const dailyActivity = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          views: data.views,
          uniqueUsers: data.users.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        uniqueUsers,
        totalViews,
        avgDuration,
        dailyActivity,
      };
    },
  });
}
