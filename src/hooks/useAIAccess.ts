import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIAccess {
  id: string;
  user_id: string;
  enabled: boolean;
  features: string[];
  granted_by: string | null;
  granted_at: string;
}

export interface AIAccessWithProfile extends AIAccess {
  user_name: string;
  user_email?: string;
}

// Get all AI access entries (admin only)
export function useAIAccessList() {
  return useQuery({
    queryKey: ['ai_access_list'],
    queryFn: async (): Promise<AIAccessWithProfile[]> => {
      const { data: accessList, error } = await supabase
        .from('ai_access')
        .select('*')
        .order('granted_at', { ascending: false });
      
      if (error) throw error;
      
      if (!accessList?.length) return [];
      
      // Fetch profiles for user names
      const userIds = accessList.map(a => a.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      return accessList.map(access => ({
        ...access,
        user_name: profiles?.find(p => p.id === access.user_id)?.full_name || 'Ukjent',
      }));
    },
  });
}

// Grant or update AI access
export function useGrantAIAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      enabled, 
      features 
    }: { 
      userId: string; 
      enabled: boolean; 
      features?: string[];
    }) => {
      const { data: existing } = await supabase
        .from('ai_access')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('ai_access')
          .update({
            enabled,
            features: features || [],
            granted_by: user?.id,
            granted_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('ai_access')
          .insert({
            user_id: userId,
            enabled,
            features: features || [],
            granted_by: user?.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_access_list'] });
    },
  });
}

// Revoke AI access
export function useRevokeAIAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('ai_access')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_access_list'] });
    },
  });
}

// Check if current user has AI access
export function useHasAIAccess() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my_ai_access', user?.id],
    queryFn: async () => {
      if (!user?.id) return { enabled: false, features: [] };
      
      const { data, error } = await supabase
        .from('ai_access')
        .select('enabled, features')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return {
        enabled: data?.enabled ?? false,
        features: data?.features ?? [],
      };
    },
    enabled: !!user?.id,
  });
}
