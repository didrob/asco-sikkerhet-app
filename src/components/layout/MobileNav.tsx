import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Shield, 
  User, 
  Building2, 
  Settings, 
  FileText,
  LayoutDashboard,
  BarChart3,
  Crown,
  BookOpen,
  Users,
  History,
  Cog,
  Activity,
  Bot
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsAdmin, useCanManageProcedures } from '@/hooks/useUserRoles';
import { useSiteContext } from '@/contexts/SiteContext';
import { ThemeLogo } from '@/components/ThemeLogo';
import { NavSection } from './NavSection';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();
  const { currentSite } = useSiteContext();
  const { data: canManage } = useCanManageProcedures(currentSite?.id || null);

  // Automatisk lukking ved navigasjon
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground dark:bg-cyan-500/20 dark:text-cyan-400'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-white/10 dark:hover:text-cyan-300'
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Åpne meny</span>
        </Button>
      </SheetTrigger>
        <SheetContent side="left" className="w-72 overflow-y-auto p-0 dark:glass-panel dark:border-white/10">
        <SheetHeader className="border-b border-border dark:border-white/10 p-4">
          <SheetTitle className="flex items-center gap-2">
            <ThemeLogo className="h-8 w-auto" />
            <span>Prosedyrehub</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-2 p-4">
          {/* Dashboard */}
          <div className="space-y-1">
            <NavLink to="/" className={navLinkClasses} end>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
          </div>

          {/* PROSEDYRER */}
          <div className="mt-4">
            <NavSection title="Prosedyrer" icon={FileText}>
              <NavLink to="/procedures" className={navLinkClasses}>
                <FileText className="h-4 w-4" />
                Bla i prosedyrer
              </NavLink>
              {canManage && (
                <NavLink to="/procedures/manage" className={navLinkClasses}>
                  <Shield className="h-4 w-4" />
                  Administrer prosedyrer
                </NavLink>
              )}
            </NavSection>
          </div>

          {/* KURS */}
          <div className="mt-2">
            <NavSection title="Kurs" icon={BookOpen}>
              <NavLink to="/training" className={navLinkClasses}>
                <BookOpen className="h-4 w-4" />
                Mine kurs
              </NavLink>

              <NavLink to="/training/history" className={navLinkClasses}>
                <History className="h-4 w-4" />
                Min kurshistorikk
              </NavLink>

              {canManage && (
                <>
                  <NavLink to="/training/manage" className={navLinkClasses}>
                    <Settings className="h-4 w-4" />
                    Administrer kurs
                  </NavLink>

                  <NavLink to="/training/groups" className={navLinkClasses}>
                    <Users className="h-4 w-4" />
                    Grupper
                  </NavLink>

                  <NavLink to="/training/overview" className={navLinkClasses}>
                    <BarChart3 className="h-4 w-4" />
                    Opplæringsoversikt
                  </NavLink>
                </>
              )}
            </NavSection>
          </div>

          {/* RAPPORTER - kun HMS/admin */}
          {canManage && (
            <div className="mt-2">
              <NavSection title="Rapporter" icon={BarChart3}>
                <NavLink to="/admin/reports" className={navLinkClasses}>
                  <BarChart3 className="h-4 w-4" />
                  Rapporter
                </NavLink>
              </NavSection>
            </div>
          )}

          {/* SYSTEM - kun global admin */}
          {isAdmin && (
            <div className="mt-2">
              <NavSection title="System" icon={Cog}>
                <NavLink to="/admin/users" className={navLinkClasses}>
                  <User className="h-4 w-4" />
                  Brukere
                </NavLink>

                <NavLink to="/admin/sites" className={navLinkClasses}>
                  <Building2 className="h-4 w-4" />
                  Lokasjoner
                </NavLink>

                <NavLink to="/admin/roles" className={navLinkClasses}>
                  <Crown className="h-4 w-4" />
                  Roller
                </NavLink>

                <NavLink to="/admin/audit" className={navLinkClasses}>
                  <FileText className="h-4 w-4" />
                  Endringslogg
                </NavLink>

                <NavLink to="/system/stats" className={navLinkClasses}>
                  <Activity className="h-4 w-4" />
                  Brukerstatistikk
                </NavLink>

                <NavLink to="/system/ai" className={navLinkClasses}>
                  <Bot className="h-4 w-4" />
                  AI-tilgang
                </NavLink>

                <NavLink to="/admin/settings" className={navLinkClasses}>
                  <Settings className="h-4 w-4" />
                  Innstillinger
                </NavLink>
              </NavSection>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto border-t border-border pt-4">
            <p className="px-3 text-xs text-muted-foreground">
              Prosedyrehub v1.0
            </p>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
