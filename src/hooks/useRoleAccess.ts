import { useIsAdmin, useCanManageProcedures, useUserRoles, useIsAuditor, useIsExternalClient } from '@/hooks/useUserRoles';
import type { Enums } from '@/integrations/supabase/types';

type AppRole = Enums<'app_role'>;

export interface RoleAccess {
  isLoading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isOperator: boolean;
  isViewer: boolean;
  isAuditor: boolean;
  isExternalClient: boolean;
  isGovernanceUser: boolean;
  canExecuteProcedures: boolean;
  canManageProcedures: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSites: boolean;
  canAccessSettings: boolean;
  canManageRoles: boolean;
  canAccessSystem: boolean; // For System admin section (admin only)
}

export function useRoleAccess(siteId?: string | null): RoleAccess {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: canManage, isLoading: manageLoading } = useCanManageProcedures(siteId ?? null);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles();
  const { data: isAuditor, isLoading: auditorLoading } = useIsAuditor();
  const { data: isExternalClient, isLoading: externalLoading } = useIsExternalClient();

  const hasRoleForSite = (role: AppRole): boolean => {
    if (!siteId || !userRoles) return false;
    return userRoles.some(r => r.site_id === siteId && r.role === role);
  };

  const isLoading = adminLoading || manageLoading || rolesLoading || auditorLoading || externalLoading;

  // Determine specific roles for the current site
  const isSupervisorForSite = hasRoleForSite('supervisor');
  const isOperatorForSite = hasRoleForSite('operator');
  const isViewerForSite = hasRoleForSite('viewer');

  // Hierarchy: admin > supervisor > operator > viewer
  const isSupervisor = isSupervisorForSite && !isAdmin;
  const isOperator = isOperatorForSite && !isSupervisorForSite && !isAdmin;
  const isViewer = isViewerForSite && !isOperatorForSite && !isSupervisorForSite && !isAdmin;

  // Governance users (auditor or external_client)
  const isGovernanceUser = !!isAuditor || !!isExternalClient;

  return {
    isLoading,
    isAdmin: !!isAdmin,
    isSupervisor,
    isOperator,
    isViewer,
    isAuditor: !!isAuditor,
    isExternalClient: !!isExternalClient,
    isGovernanceUser,
    // Operators and above can execute procedures
    canExecuteProcedures: !!isAdmin || !!canManage || isOperatorForSite,
    // Supervisors and admin can manage procedures
    canManageProcedures: !!isAdmin || !!canManage,
    // Supervisors and admin can view reports
    canViewReports: !!isAdmin || !!canManage,
    // Only admin can manage users, sites, settings, and roles
    canManageUsers: !!isAdmin,
    canManageSites: !!isAdmin,
    canAccessSettings: !!isAdmin,
    canManageRoles: !!isAdmin,
    // Only admin can access System section
    canAccessSystem: !!isAdmin,
  };
}
