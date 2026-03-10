import { useState } from 'react';
import { ChevronDown, User, LogOut, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeLogo } from '@/components/ThemeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/layout/MobileNav';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSiteContext } from '@/contexts/SiteContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { currentSite, sites, setCurrentSite } = useSiteContext();

  const displayName = profile?.full_name || user?.email || 'Bruker';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card dark:glass-panel dark:border-white/10">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile Nav + Logo and App Name */}
        <div className="flex items-center gap-3">
          <MobileNav />
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

        {/* Search, User Dropdown and Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Søk...</span>
            <kbd className="ml-2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <span className="hidden text-sm sm:inline">{displayName}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Min konto</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                  <User className="h-4 w-4" />
                  Min profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logg ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Global Search Dialog */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  );
}
