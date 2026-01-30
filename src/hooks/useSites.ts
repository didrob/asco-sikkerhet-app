import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Site = Tables<'sites'>;

export function useSites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sites', user?.id],
    queryFn: async () => {
      // Get user's assigned sites via the user_site_assignments table
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          user_site_assignments!inner(user_id)
        `)
        .eq('user_site_assignments.user_id', user!.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      
      // Remove the join data from the result
      return (data || []).map(({ user_site_assignments, ...site }) => site) as Site[];
    },
    enabled: !!user,
  });
}

export function useSite(siteId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId!)
        .single();

      if (error) throw error;
      return data as Site;
    },
    enabled: !!user && !!siteId,
  });
}
