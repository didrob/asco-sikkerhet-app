import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteContext } from '@/contexts/SiteContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Sun, Moon, CloudSun } from 'lucide-react';

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

export function WelcomeCard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { currentSite, isLoading: siteLoading } = useSiteContext();

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'bruker';
  const firstName = displayName.split(' ')[0];

  if (profileLoading || siteLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GreetingIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {greeting.text}, {firstName}!
            </CardTitle>
            <CardDescription>
              {currentSite ? (
                <>Velkommen til {currentSite.name}</>
              ) : (
                <>Velkommen til Prosedyrehub</>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Her finner du dine sikkerhetsprosedyrer og opplæringsmateriell. 
          Fullfør prosedyrene for å sikre at du er oppdatert på gjeldende rutiner.
        </p>
      </CardContent>
    </Card>
  );
}
