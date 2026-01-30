import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/contexts/SiteContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function SiteSelector() {
  const { currentSite, sites, setCurrentSite, isLoading } = useSiteContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Laster sites...</span>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Ingen sites tildelt</span>
      </div>
    );
  }

  if (sites.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">{currentSite?.name}</p>
          {currentSite?.location && (
            <p className="text-xs text-muted-foreground">{currentSite.location}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{currentSite?.name || 'Velg site'}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dine sites
          </p>
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
  );
}
