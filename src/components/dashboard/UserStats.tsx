import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProcedureStats } from '@/hooks/useProcedures';
import { useSiteContext } from '@/contexts/SiteContext';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClassName?: string;
  description?: string;
}

function StatCard({ title, value, icon: Icon, iconClassName, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UserStats() {
  const { currentSite } = useSiteContext();
  const { stats, isLoading } = useProcedureStats(currentSite?.id || null);

  if (!currentSite) {
    return null;
  }

  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Totalt antall"
        value={stats.total}
        icon={FileText}
        iconClassName="text-primary"
        description="prosedyrer"
      />
      <StatCard
        title="Fullført"
        value={stats.completed}
        icon={CheckCircle2}
        iconClassName="text-green-600"
        description="prosedyrer fullført"
      />
      <StatCard
        title="Påbegynt"
        value={stats.inProgress}
        icon={Clock}
        iconClassName="text-blue-600"
        description="under arbeid"
      />
      <StatCard
        title="Ikke startet"
        value={stats.notStarted}
        icon={AlertCircle}
        iconClassName="text-muted-foreground"
        description="venter på deg"
      />
    </div>
  );
}
