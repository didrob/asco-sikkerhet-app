import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';

export function SupervisorDashboardCards() {
  const { currentSite } = useSiteContext();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['supervisor-dashboard-stats', currentSite?.id],
    queryFn: async () => {
      if (!currentSite?.id) return null;

      const [usersResult, proceduresResult, completionsResult, progressResult] = await Promise.all([
        supabase
          .from('user_site_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', currentSite.id),
        supabase
          .from('procedures')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', currentSite.id)
          .eq('status', 'published'),
        supabase
          .from('procedure_completions')
          .select('*, procedures!inner(site_id)', { count: 'exact', head: true })
          .eq('procedures.site_id', currentSite.id),
        supabase
          .from('procedure_progress')
          .select('*, procedures!inner(site_id)', { count: 'exact', head: true })
          .eq('procedures.site_id', currentSite.id),
      ]);

      return {
        teamMembers: usersResult.count ?? 0,
        activeProcedures: proceduresResult.count ?? 0,
        completions: completionsResult.count ?? 0,
        inProgress: progressResult.count ?? 0,
      };
    },
    enabled: !!currentSite?.id,
  });

  if (!currentSite) return null;

  const cards = [
    {
      title: 'Teammedlemmer',
      value: stats?.teamMembers ?? 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Aktive prosedyrer',
      value: stats?.activeProcedures ?? 0,
      icon: FileText,
      color: 'text-green-500',
    },
    {
      title: 'Fullføringer',
      value: stats?.completions ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
    },
    {
      title: 'Pågående',
      value: stats?.inProgress ?? 0,
      icon: Clock,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Site-oversikt: {currentSite.name}
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/reports">
            Rapporter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
