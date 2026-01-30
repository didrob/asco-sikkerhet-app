import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useProcedureRevisions,
  useRestoreRevision,
  type ProcedureRevision,
} from '@/hooks/useProcedureRevisions';
import { History, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RevisionHistoryProps {
  procedureId: string | undefined;
  currentVersion: string;
}

export function RevisionHistory({ procedureId, currentVersion }: RevisionHistoryProps) {
  const { data: revisions, isLoading } = useProcedureRevisions(procedureId);
  const restoreRevision = useRestoreRevision();

  const handleRestore = (revision: ProcedureRevision) => {
    if (procedureId) {
      restoreRevision.mutate({ procedureId, revision });
    }
  };

  if (!procedureId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <History className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Lagre prosedyren først for å se revisjonshistorikk.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!revisions || revisions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <History className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Ingen revisjoner ennå. Revisjoner opprettes automatisk når du lagrer endringer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Revisjonshistorikken viser alle tidligere versjoner av prosedyren. 
        Du kan gjenopprette en tidligere versjon ved å klikke på "Gjenopprett".
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Versjon</TableHead>
            <TableHead>Dato</TableHead>
            <TableHead>Endret av</TableHead>
            <TableHead>Sammendrag</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.map((revision, index) => {
            const isLatest = index === 0;
            const isCurrent = revision.version === currentVersion;
            
            return (
              <TableRow key={revision.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{revision.version}</span>
                    {isLatest && (
                      <Badge variant="secondary" className="text-xs">
                        Nyeste
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Gjeldende
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(revision.created_at), 'd. MMM yyyy, HH:mm', { locale: nb })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {revision.profile?.full_name || 'Ukjent'}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {revision.change_summary || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="mr-1 h-4 w-4" />
                          Gjenopprett
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Gjenopprett versjon {revision.version}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil gjenopprette prosedyren til versjon {revision.version}? 
                            Den nåværende versjonen vil bli lagret som en ny revisjon.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRestore(revision)}
                            disabled={restoreRevision.isPending}
                          >
                            {restoreRevision.isPending ? 'Gjenoppretter...' : 'Gjenopprett'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
