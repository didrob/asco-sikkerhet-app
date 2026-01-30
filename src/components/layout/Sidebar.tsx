import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  User, 
  Building2, 
  Settings, 
  FileText,
  LayoutDashboard,
  BarChart3,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin, useCanManageProcedures } from '@/hooks/useUserRoles';
import { useSiteContext } from '@/contexts/SiteContext';

export function Sidebar() {
  const { data: isAdmin } = useIsAdmin();
  const { currentSite } = useSiteContext();
  const { data: canManage } = useCanManageProcedures(currentSite?.id || null);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <nav className="flex h-[calc(100vh-4rem)] flex-col gap-2 p-4">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigasjon
          </p>
          
          <NavLink to="/" className={navLinkClasses} end>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>

          <NavLink to="/procedures" className={navLinkClasses}>
            <FileText className="h-4 w-4" />
            Prosedyrer
          </NavLink>

          <NavLink to="/profile" className={navLinkClasses}>
            <User className="h-4 w-4" />
            Min profil
          </NavLink>
        </div>

        {/* Admin/Manager section */}
        {(isAdmin || canManage) && (
          <div className="mt-6 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administrasjon
            </p>

            {canManage && (
              <>
                <NavLink to="/procedures/manage" className={navLinkClasses}>
                  <Shield className="h-4 w-4" />
                  Administrer prosedyrer
                </NavLink>

                <NavLink to="/admin/reports" className={navLinkClasses}>
                  <BarChart3 className="h-4 w-4" />
                  Rapporter
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin/sites" className={navLinkClasses}>
                  <Building2 className="h-4 w-4" />
                  Sites
                </NavLink>
                
                <NavLink to="/admin/users" className={navLinkClasses}>
                  <User className="h-4 w-4" />
                  Brukere
                </NavLink>

                <NavLink to="/admin/settings" className={navLinkClasses}>
                  <Settings className="h-4 w-4" />
                  Innstillinger
                </NavLink>
              </>
            )}
          </div>
        )}

        {/* Governance section - Admin only */}
        {isAdmin && (
          <div className="mt-6 space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Governance
            </p>
            
            <NavLink to="/admin/roles" className={navLinkClasses}>
              <Crown className="h-4 w-4" />
              Roller
            </NavLink>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto border-t border-border pt-4">
          <p className="px-3 text-xs text-muted-foreground">
            Prosedyrehub v1.0
          </p>
        </div>
      </nav>
    </aside>
  );
}
