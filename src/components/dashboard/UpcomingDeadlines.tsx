import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';

export function UpcomingDeadlines() {
  const { currentSite } = useSiteContext();

  const { data: procedures, isLoading } = useQuery({
    queryKey: ['upcoming-deadlines', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return [];

      const { data, error } = await supabase
        .from('procedures')
        .select('id, title, due_date')
        .eq('site_id', currentSite.id)
        .eq('status', 'published')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!currentSite?.id,
  });

  const getDeadlineStatus = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();

    if (isPast(date)) {
      return { label: 'Forfalt', variant: 'destructive' as const, icon: AlertTriangle };
    }

    if (isWithinInterval(date, { start: now, end: addDays(now, 3) })) {
      return { label: 'Snart', variant: 'default' as const, icon: Clock };
    }

    return { label: 'Kommende', variant: 'secondary' as const, icon: Calendar };
  };

  if (!currentSite) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Kommende frister
        </CardTitle>
        <CardDescription>
          Prosedyrer med frist de neste dagene
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : procedures?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen prosedyrer med kommende frister
          </p>
        ) : (
          <div className="space-y-3">
            {procedures?.map((procedure) => {
              const status = getDeadlineStatus(procedure.due_date!);
              return (
                <Link
                  key={procedure.id}
                  to={`/procedures/${procedure.id}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <status.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{procedure.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(procedure.due_date!), 'dd. MMM', { locale: nb })}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
