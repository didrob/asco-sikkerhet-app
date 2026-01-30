import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteContext } from '@/contexts/SiteContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown, Sun, Moon, CloudSun } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { nb } from 'date-fns/locale';

export type PeriodOption = 7 | 14 | 30 | 90;

interface DashboardHeaderProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

const periodLabels: Record<PeriodOption, string> = {
  7: 'Siste 7 dager',
  14: 'Siste 14 dager',
  30: 'Siste 30 dager',
  90: 'Siste 90 dager',
};

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: 'God morgen', icon: Sun };
  } else if (hour >= 12 && hour < 18) {
    return { text: 'God ettermiddag', icon: CloudSun };
  } else {
    return { text: 'God kveld', icon: Moon };
  }
}

export function DashboardHeader({ selectedPeriod, onPeriodChange }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { currentSite, isLoading: siteLoading } = useSiteContext();

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'bruker';
  const firstName = displayName.split(' ')[0];

  const startDate = subDays(new Date(), selectedPeriod);
  const endDate = new Date();
  const dateRangeText = `${format(startDate, 'd MMM', { locale: nb })} - ${format(endDate, 'd MMM yyyy', { locale: nb })}`;

  if (profileLoading || siteLoading) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <GreetingIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {greeting.text}, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentSite ? (
              <>Her er en oversikt for {currentSite.name}</>
            ) : (
              <>Her er din aktivitetsoversikt</>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{periodLabels[selectedPeriod]}</span>
              <span className="sm:hidden">{selectedPeriod}d</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(periodLabels) as unknown as PeriodOption[]).map((period) => (
              <DropdownMenuItem
                key={period}
                onClick={() => onPeriodChange(Number(period) as PeriodOption)}
                className={selectedPeriod === Number(period) ? 'bg-accent' : ''}
              >
                {periodLabels[period]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="hidden items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
          <Calendar className="h-3.5 w-3.5" />
          <span>{dateRangeText}</span>
        </div>
      </div>
    </div>
  );
}
