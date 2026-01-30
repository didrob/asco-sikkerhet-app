import { LogOut, ChevronDown, User } from 'lucide-react';
import { ThemeLogo } from '@/components/ThemeLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSiteContext } from '@/contexts/SiteContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { currentSite, sites, setCurrentSite } = useSiteContext();

  const displayName = profile?.full_name || user?.email || 'Bruker';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3">
          <ThemeLogo className="h-10 w-auto" />
          <div className="hidden sm:block">
            <h1 className="font-semibold text-foreground">ASCO Prosedyrehub</h1>
            <p className="text-xs text-muted-foreground">Digital sikkerhetsoperasjoner</p>
          </div>
        </div>

        {/* Site Selector (center) */}
        {sites.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                {currentSite?.name || 'Velg site'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="space-y-1">
                {sites.map(site => (
                  <button
                    key={site.id}
                    onClick={() => setCurrentSite(site)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      currentSite?.id === site.id ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {site.name}
                    {site.location && (
                      <span className="ml-2 text-muted-foreground">({site.location})</span>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Single site display */}
        {sites.length === 1 && currentSite && (
          <div className="hidden text-center md:block">
            <p className="text-sm font-medium text-foreground">{currentSite.name}</p>
            {currentSite.location && (
              <p className="text-xs text-muted-foreground">{currentSite.location}</p>
            )}
          </div>
        )}

        {/* User Info and Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">Logget inn</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Logg ut">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
