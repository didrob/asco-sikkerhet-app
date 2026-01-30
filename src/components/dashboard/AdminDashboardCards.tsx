import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Users, FileText, Shield, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export function AdminDashboardCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [sitesResult, usersResult, proceduresResult, rolesResult] = await Promise.all([
        supabase.from('sites').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('procedures').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
      ]);

      return {
        sites: sitesResult.count ?? 0,
        users: usersResult.count ?? 0,
        procedures: proceduresResult.count ?? 0,
        roles: rolesResult.count ?? 0,
      };
    },
  });

  const cards = [
    {
      title: 'Sites',
      value: stats?.sites ?? 0,
      icon: Building2,
      href: '/admin/sites',
      color: 'text-blue-500',
    },
    {
      title: 'Brukere',
      value: stats?.users ?? 0,
      icon: Users,
      href: '/admin/users',
      color: 'text-green-500',
    },
    {
      title: 'Prosedyrer',
      value: stats?.procedures ?? 0,
      icon: FileText,
      href: '/procedures/manage',
      color: 'text-orange-500',
    },
    {
      title: 'Rolletildelinger',
      value: stats?.roles ?? 0,
      icon: Shield,
      href: '/admin/roles',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Systemstatistikk</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/audit">
            Aktivitetslogg
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="transition-colors hover:bg-accent/50">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
