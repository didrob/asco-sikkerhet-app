import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProcedures, ProcedureWithProgress } from '@/hooks/useProcedures';
import { useSiteContext } from '@/contexts/SiteContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

function ProcedureCard({ procedure }: { procedure: ProcedureWithProgress }) {
  const statusConfig = {
    not_started: {
      label: 'Ikke startet',
      variant: 'secondary' as const,
      icon: AlertCircle,
      className: 'text-muted-foreground',
    },
    in_progress: {
      label: 'Påbegynt',
      variant: 'default' as const,
      icon: Clock,
      className: 'text-primary',
    },
    completed: {
      label: 'Fullført',
      variant: 'outline' as const,
      icon: CheckCircle2,
      className: 'text-green-600',
    },
  };

  const status = statusConfig[procedure.status_label];
  const StatusIcon = status.icon;

  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{procedure.title}</CardTitle>
              {procedure.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {procedure.description}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant={status.variant} className="shrink-0">
            <StatusIcon className={`mr-1 h-3 w-3 ${status.className}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {procedure.due_date && (
              <span>
                Frist: {format(new Date(procedure.due_date), 'PPP', { locale: nb })}
              </span>
            )}
          </div>
          {procedure.progress && (
            <span className="text-muted-foreground">
              Sist aktivitet: {format(new Date(procedure.progress.last_activity_at), 'PPP', { locale: nb })}
            </span>
          )}
          {procedure.completion && (
            <span className="text-green-600">
              Fullført: {format(new Date(procedure.completion.completed_at), 'PPP', { locale: nb })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProcedureListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProcedureList() {
  const { currentSite } = useSiteContext();
  const { data: procedures, isLoading, error } = useProcedures(currentSite?.id || null);

  if (!currentSite) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Du er ikke tildelt noen sites ennå. Kontakt administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ProcedureListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <p className="text-destructive">Kunne ikke laste prosedyrer. Prøv igjen senere.</p>
        </CardContent>
      </Card>
    );
  }

  if (!procedures || procedures.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Ingen prosedyrer tilgjengelig for denne siten ennå.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {procedures.map(procedure => (
        <Link key={procedure.id} to={`/procedures/${procedure.id}`} className="block">
          <ProcedureCard procedure={procedure} />
        </Link>
      ))}
    </div>
  );
}
