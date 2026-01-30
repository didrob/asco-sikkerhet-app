import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, BarChart3, FileSearch, Award, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeLogo } from '@/components/ThemeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAuditor } from '@/hooks/useUserRoles';

interface GovernanceLayoutProps {
  children: ReactNode;
}

export function GovernanceLayout({ children }: GovernanceLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAuditor } = useIsAuditor();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <ThemeLogo className="h-8 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Governance Center</h1>
              <p className="text-xs text-muted-foreground">Eksternt innsyn</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logg ut
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container px-4">
          <div className="flex items-center gap-2 py-2">
            <NavLink to="/governance" end className={navLinkClasses}>
              <BarChart3 className="h-4 w-4" />
              Compliance
            </NavLink>
            
            {isAuditor && (
              <NavLink to="/governance/audit" className={navLinkClasses}>
                <FileSearch className="h-4 w-4" />
                Revisjon
              </NavLink>
            )}
            
            <NavLink to="/governance/certificates" className={navLinkClasses}>
              <Award className="h-4 w-4" />
              Sertifikater
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Prosedyrehub Governance Portal</p>
          <p className="mt-1">All data er konfidensiell og underlagt taushetsplikt.</p>
        </div>
      </footer>
    </div>
  );
}
