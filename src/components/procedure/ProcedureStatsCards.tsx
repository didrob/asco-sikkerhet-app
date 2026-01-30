import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle2, FileEdit, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcedureStats } from '@/hooks/useProcedures';

interface ProcedureStatsCardsProps {
  stats: ProcedureStats;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  iconClassName?: string;
  valueClassName?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconClassName, valueClassName }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className={cn("text-2xl font-bold", valueClassName)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className={cn("h-5 w-5 text-primary", iconClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProcedureStatsCards({ stats, isLoading }: ProcedureStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Totalt" 
        value={stats.total} 
        icon={FileText} 
      />
      <StatCard 
        title="Publisert" 
        value={stats.published}
        icon={CheckCircle2}
        iconClassName="text-green-600"
        valueClassName="text-green-600"
      />
      <StatCard 
        title="Utkast" 
        value={stats.draft}
        icon={FileEdit}
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-600"
      />
      <StatCard 
        title="Arkivert" 
        value={stats.archived}
        icon={Archive}
        iconClassName="text-muted-foreground"
      />
    </div>
  );
}
