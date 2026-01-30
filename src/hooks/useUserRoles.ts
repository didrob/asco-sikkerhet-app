import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';

type UserRole = Tables<'user_roles'>;
type AppRole = Enums<'app_role'>;

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user!.id,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });
}

export function useHasRole(role: AppRole, siteId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['has_role', user?.id, role, siteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: role,
        _site_id: siteId || null,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });
}

export function useCanManageProcedures(siteId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can_manage_procedures', user?.id, siteId],
    queryFn: async () => {
      if (!siteId) return false;
      
      const { data, error } = await supabase.rpc('can_manage_procedures', {
        _user_id: user!.id,
        _site_id: siteId,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user && !!siteId,
  });
}

export function useIsAuditor() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is_auditor', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'auditor')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useIsExternalClient() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is_external_client', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'external_client')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useIsGovernanceUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is_governance_user', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .in('role', ['auditor', 'external_client']);

      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!user,
  });
}
