import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GovernanceStats {
  complianceRate: number;
  riskCoverage: number;
  totalUsers: number;
  certifiedUsers: number;
  totalProcedures: number;
  publishedProcedures: number;
  recentCertifications: {
    procedureTitle: string;
    completedAt: string;
    userName?: string;
  }[];
}

export function useGovernanceStats() {
  return useQuery({
    queryKey: ['governance_stats'],
    queryFn: async () => {
      // Get all users with site assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_site_assignments')
        .select('user_id');

      if (assignmentsError) throw assignmentsError;

      const uniqueUsers = [...new Set(assignments?.map(a => a.user_id) || [])];
      const totalUsers = uniqueUsers.length;

      // Get all completions
      const { data: completions, error: completionsError } = await supabase
        .from('procedure_completions')
        .select(`
          id,
          user_id,
          completed_at,
          procedure:procedures(title)
        `)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Get unique certified users
      const certifiedUserIds = [...new Set(completions?.map(c => c.user_id) || [])];
      const certifiedUsers = certifiedUserIds.length;

      // Get all procedures
      const { data: procedures, error: proceduresError } = await supabase
        .from('procedures')
        .select('id, status');

      if (proceduresError) throw proceduresError;

      const totalProcedures = procedures?.length || 0;
      const publishedProcedures = procedures?.filter(p => p.status === 'published').length || 0;

      // Calculate rates
      const complianceRate = totalUsers > 0 ? Math.round((certifiedUsers / totalUsers) * 100) : 0;
      const riskCoverage = totalProcedures > 0 ? Math.round((publishedProcedures / totalProcedures) * 100) : 0;

      // Get recent certifications (last 10)
      const recentCertifications = (completions || []).slice(0, 10).map(c => ({
        procedureTitle: (c.procedure as { title: string } | null)?.title || 'Ukjent prosedyre',
        completedAt: c.completed_at,
      }));

      return {
        complianceRate,
        riskCoverage,
        totalUsers,
        certifiedUsers,
        totalProcedures,
        publishedProcedures,
        recentCertifications,
      } as GovernanceStats;
    },
  });
}
