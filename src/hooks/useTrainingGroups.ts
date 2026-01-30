import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TrainingGroup {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: TrainingGroupMember[];
  member_count?: number;
}

export interface TrainingGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_at: string;
  added_by: string | null;
  email?: string; // Populated when needed for email sending
  profile?: {
    id: string;
    full_name: string | null;
    job_title: string | null;
    avatar_url: string | null;
  };
}

// Fetch all groups for a site
export function useTrainingGroups() {
  const { currentSite } = useSiteContext();

  return useQuery({
    queryKey: ['training_groups', currentSite?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_groups')
        .select(`
          *,
          members:training_group_members(
            id,
            user_id,
            added_at
          )
        `)
        .eq('site_id', currentSite!.id)
        .order('name');

      if (error) throw error;

      // Add member count
      return (data || []).map(group => ({
        ...group,
        member_count: group.members?.length || 0,
      })) as TrainingGroup[];
    },
    enabled: !!currentSite,
  });
}

// Fetch single group with members and profiles
export function useTrainingGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['training_group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_groups')
        .select(`
          *,
          members:training_group_members(
            id,
            user_id,
            added_at,
            added_by
          )
        `)
        .eq('id', groupId!)
        .single();

      if (error) throw error;

      // Fetch profiles for members
      if (data.members?.length) {
        const userIds = data.members.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, job_title, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        data.members = data.members.map((m: any) => ({
          ...m,
          profile: profileMap.get(m.user_id),
        }));
      }

      return data as TrainingGroup;
    },
    enabled: !!groupId,
  });
}

// Create group
export function useCreateTrainingGroup() {
  const queryClient = useQueryClient();
  const { currentSite } = useSiteContext();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (group: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('training_groups')
        .insert({
          ...group,
          site_id: currentSite!.id,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      toast.success('Gruppe opprettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke opprette gruppe: ' + error.message);
    },
  });
}

// Update group
export function useUpdateTrainingGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('training_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      queryClient.invalidateQueries({ queryKey: ['training_group', data.id] });
      toast.success('Gruppe oppdatert');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere gruppe: ' + error.message);
    },
  });
}

// Delete group
export function useDeleteTrainingGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('training_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      toast.success('Gruppe slettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke slette gruppe: ' + error.message);
    },
  });
}

// Add member to group
export function useAddGroupMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('training_group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          added_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      queryClient.invalidateQueries({ queryKey: ['training_group', variables.groupId] });
      toast.success('Medlem lagt til');
    },
    onError: (error) => {
      toast.error('Kunne ikke legge til medlem: ' + error.message);
    },
  });
}

// Remove member from group
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('training_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      queryClient.invalidateQueries({ queryKey: ['training_group', variables.groupId] });
      toast.success('Medlem fjernet');
    },
    onError: (error) => {
      toast.error('Kunne ikke fjerne medlem: ' + error.message);
    },
  });
}

// Add multiple members to group
export function useAddGroupMembers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      const { error } = await supabase
        .from('training_group_members')
        .insert(
          userIds.map(userId => ({
            group_id: groupId,
            user_id: userId,
            added_by: user!.id,
          }))
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training_groups'] });
      queryClient.invalidateQueries({ queryKey: ['training_group', variables.groupId] });
      toast.success(`${variables.userIds.length} medlemmer lagt til`);
    },
    onError: (error) => {
      toast.error('Kunne ikke legge til medlemmer: ' + error.message);
    },
  });
}
