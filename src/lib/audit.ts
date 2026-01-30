import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'publish' 
  | 'archive' 
  | 'complete' 
  | 'assign' 
  | 'remove';

export type AuditResourceType = 
  | 'procedure' 
  | 'role' 
  | 'site_assignment' 
  | 'user' 
  | 'site';

interface LogAuditParams {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  metadata?: Json;
}

/**
 * Log an action to the audit log table.
 * This function should be called after important actions like:
 * - Creating, publishing, archiving procedures
 * - Completing procedures
 * - Assigning/removing roles
 * - Adding/removing users from sites
 */
export async function logAudit({
  action,
  resourceType,
  resourceId,
  metadata,
}: LogAuditParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log audit entry: No authenticated user');
      return;
    }

    const { error } = await supabase.from('audit_log').insert([{
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata ?? {},
    }]);

    if (error) {
      console.error('Failed to log audit entry:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Helper function to format audit action for display
 */
export function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    create: 'Opprettet',
    update: 'Oppdatert',
    delete: 'Slettet',
    publish: 'Publisert',
    archive: 'Arkivert',
    complete: 'Fullført',
    assign: 'Tildelt',
    remove: 'Fjernet',
  };
  return actionMap[action] || action;
}

/**
 * Helper function to format resource type for display
 */
export function formatResourceType(resourceType: string): string {
  const resourceMap: Record<string, string> = {
    procedure: 'Prosedyre',
    role: 'Rolle',
    site_assignment: 'Site-tilknytning',
    user: 'Bruker',
    site: 'Site',
  };
  return resourceMap[resourceType] || resourceType;
}
