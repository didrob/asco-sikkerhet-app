import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserInvitation {
  id: string;
  email: string;
  full_name: string | null;
  temporary_password: string;
  invited_by: string | null;
  invited_at: string;
  expires_at: string;
  activated_at: string | null;
  status: string;
  site_id: string | null;
}

export function useUserInvitations() {
  return useQuery({
    queryKey: ['user-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as UserInvitation[];
    },
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['user-invitations', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as UserInvitation[];
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation: {
      email: string;
      full_name?: string;
      temporary_password: string;
      expires_at: Date;
      site_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: invitation.email.toLowerCase().trim(),
          full_name: invitation.full_name?.trim() || null,
          temporary_password: invitation.temporary_password,
          expires_at: invitation.expires_at.toISOString(),
          site_id: invitation.site_id || null,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
  });
}

export function useUpdateInvitationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'activated' | 'expired' }) => {
      const updateData: { status: string; activated_at?: string } = { status };
      
      if (status === 'activated') {
        updateData.activated_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('user_invitations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
  });
}

/**
 * Creates a user via the edge function
 */
export async function createUserViaEdgeFunction(
  email: string,
  password: string,
  fullName?: string,
  siteId?: string,
  role?: string
): Promise<{ success: boolean; user?: { id: string; email: string }; error?: string }> {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session?.access_token) {
    return { success: false, error: 'Ikke autentisert' };
  }

  const response = await supabase.functions.invoke('create-user', {
    body: {
      email,
      password,
      full_name: fullName,
      site_id: siteId,
      role,
    },
  });

  if (response.error) {
    return { success: false, error: response.error.message };
  }

  if (response.data?.error) {
    return { success: false, error: response.data.error };
  }

  return { success: true, user: response.data.user };
}
