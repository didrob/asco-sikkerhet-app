import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle2, Clock, Send, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcedureOverviewSummary } from '@/hooks/useProcedureOverview';

interface AdminProcedureStatsProps {
  data: ProcedureOverviewSummary | undefined;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconClassName?: string;
  valueClassName?: string;
}

function StatCard({ title, value, icon: Icon, iconClassName, valueClassName }: StatCardProps) {
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
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className={cn("h-5 w-5 text-primary", iconClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminProcedureStats({ data, isLoading }: AdminProcedureStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-10" />
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
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <StatCard 
        title="Totalt" 
        value={data?.totalProcedures || 0} 
        icon={FileText} 
      />
      <StatCard 
        title="Publisert" 
        value={data?.publishedCount || 0}
        icon={Send}
        iconClassName="text-green-600"
        valueClassName="text-green-600"
      />
      <StatCard 
        title="Utkast" 
        value={data?.draftCount || 0}
        icon={Clock}
        iconClassName="text-yellow-600"
        valueClassName="text-yellow-600"
      />
      <StatCard 
        title="Fullføringer" 
        value={data?.totalCompletions || 0}
        icon={CheckCircle2}
        iconClassName="text-blue-600"
        valueClassName="text-blue-600"
      />
      <StatCard 
        title="Snittrate" 
        value={`${data?.averageCompletionRate || 0}%`}
        icon={TrendingUp}
        iconClassName="text-primary"
      />
    </div>
  );
}
