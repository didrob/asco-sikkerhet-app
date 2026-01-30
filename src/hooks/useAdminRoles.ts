import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';

export interface RoleWithDetails {
  id: string;
  user_id: string;
  site_id: string;
  role: Enums<'app_role'>;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    job_title: string | null;
    department: string | null;
  } | null;
  site: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

export interface UserForRoleMatrix {
  id: string;
  full_name: string | null;
  job_title: string | null;
  department: string | null;
  roles: {
    id: string;
    site_id: string;
    role: Enums<'app_role'>;
  }[];
}

export function useAllRoles() {
  return useQuery({
    queryKey: ['all_roles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for these roles
      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department')
        .in('id', userIds);

      // Fetch sites
      const siteIds = [...new Set(roles.map(r => r.site_id))];
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name, location')
        .in('id', siteIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const sitesMap = new Map(sites?.map(s => [s.id, s]) || []);

      return roles.map(role => ({
        ...role,
        user: profilesMap.get(role.user_id) || null,
        site: sitesMap.get(role.site_id) || null,
      })) as RoleWithDetails[];
    },
  });
}

export function useRolesBySite(siteId: string | null) {
  return useQuery({
    queryKey: ['roles_by_site', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('site_id', siteId);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(roles.map(r => r.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return roles.map(role => ({
        ...role,
        user: profilesMap.get(role.user_id) || null,
      }));
    },
    enabled: !!siteId,
  });
}

export function useUsersForRoleMatrix() {
  return useQuery({
    queryKey: ['users_for_role_matrix'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, site_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const rolesMap = new Map<string, { id: string; site_id: string; role: Enums<'app_role'> }[]>();
      roles?.forEach(role => {
        const existing = rolesMap.get(role.user_id) || [];
        rolesMap.set(role.user_id, [...existing, { id: role.id, site_id: role.site_id, role: role.role }]);
      });

      return (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.id) || [],
      })) as UserForRoleMatrix[];
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      siteId, 
      role 
    }: { 
      userId: string; 
      siteId: string; 
      role: Enums<'app_role'>;
    }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          site_id: siteId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles_by_site'] });
      queryClient.invalidateQueries({ queryKey: ['users_for_role_matrix'] });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles_by_site'] });
      queryClient.invalidateQueries({ queryKey: ['users_for_role_matrix'] });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    },
  });
}

export function useToggleRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      siteId, 
      role,
      currentRoleId,
    }: { 
      userId: string; 
      siteId: string; 
      role: Enums<'app_role'>;
      currentRoleId: string | null;
    }) => {
      if (currentRoleId) {
        // Remove the role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', currentRoleId);

        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add the role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            site_id: siteId,
            role,
          })
          .select()
          .single();

        if (error) throw error;
        return { action: 'added' as const, data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles_by_site'] });
      queryClient.invalidateQueries({ queryKey: ['users_for_role_matrix'] });
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    },
  });
}
