import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type AuditLogEntry = Tables<'audit_log'>;

export interface AuditLogFilters {
  resourceType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit_log', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const limit = filters?.limit ?? 100;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
}

export function useAuditLogCount(filters?: Omit<AuditLogFilters, 'limit' | 'offset'>) {
  return useQuery({
    queryKey: ['audit_log_count', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true });

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { count, error } = await query;
      
      if (error) throw error;
      return count ?? 0;
    },
  });
}
