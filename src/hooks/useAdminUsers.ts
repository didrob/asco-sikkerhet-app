import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

type UserRole = Tables<'user_roles'>;
type UserRoleInsert = TablesInsert<'user_roles'>;
type UserSiteAssignment = Tables<'user_site_assignments'>;

interface UserWithDetails {
  id: string;
  email: string;
  profile: Tables<'profiles'> | null;
  roles: UserRole[];
  site_assignments: UserSiteAssignment[];
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      // Get all profiles (which are linked to auth.users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get all site assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_site_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      // Map data together
      const rolesMap = new Map<string, UserRole[]>();
      roles?.forEach(role => {
        const existing = rolesMap.get(role.user_id) || [];
        rolesMap.set(role.user_id, [...existing, role]);
      });

      const assignmentsMap = new Map<string, UserSiteAssignment[]>();
      assignments?.forEach(assignment => {
        const existing = assignmentsMap.get(assignment.user_id) || [];
        assignmentsMap.set(assignment.user_id, [...existing, assignment]);
      });

      return (profiles || []).map(profile => ({
        id: profile.id,
        email: '', // We don't have access to auth.users email from client
        profile,
        roles: rolesMap.get(profile.id) || [],
        site_assignments: assignmentsMap.get(profile.id) || [],
      })) as UserWithDetails[];
    },
  });
}

export function useAssignUserToSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, siteId }: { userId: string; siteId: string }) => {
      const { data, error } = await supabase
        .from('user_site_assignments')
        .insert({
          user_id: userId,
          site_id: siteId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    },
  });
}

export function useRemoveUserFromSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, siteId }: { userId: string; siteId: string }) => {
      const { error } = await supabase
        .from('user_site_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('site_id', siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
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
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    },
  });
}
