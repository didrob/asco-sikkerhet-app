import { ArrowRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { ProcedureOverviewStats } from '@/hooks/useProcedureOverview';

interface ProcedureCompletionTableProps {
  procedures: ProcedureOverviewStats[] | undefined;
  isLoading: boolean;
  onSelectProcedure: (procedureId: string) => void;
  showOnlyPublished?: boolean;
}

export function ProcedureCompletionTable({ 
  procedures, 
  isLoading, 
  onSelectProcedure,
  showOnlyPublished = true
}: ProcedureCompletionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const filteredProcedures = showOnlyPublished 
    ? procedures?.filter(p => p.status === 'published')
    : procedures;

  if (!filteredProcedures?.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>Ingen prosedyrer funnet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prosedyre</TableHead>
          <TableHead className="text-right">Brukere</TableHead>
          <TableHead className="text-right">Fullført</TableHead>
          <TableHead className="text-right">Pågående</TableHead>
          <TableHead className="w-[120px]">Rate</TableHead>
          <TableHead className="text-right">Oppdatert</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredProcedures.map((procedure) => (
          <TableRow 
            key={procedure.procedureId}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectProcedure(procedure.procedureId)}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="font-medium">{procedure.title}</div>
                {procedure.status !== 'published' && (
                  <Badge variant="secondary" className="text-xs">
                    {procedure.status === 'draft' ? 'Utkast' : 'Arkivert'}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">{procedure.totalUsers}</TableCell>
            <TableCell className="text-right">
              <span className="text-green-600 font-medium">{procedure.completedCount}</span>
              <span className="text-muted-foreground text-sm ml-1">
                ({procedure.completionRate}%)
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-blue-600">{procedure.inProgressCount}</span>
            </TableCell>
            <TableCell>
              <Progress 
                value={procedure.completionRate} 
                className={
                  procedure.completionRate < 50 
                    ? '[&>div]:bg-destructive' 
                    : procedure.completionRate >= 80 
                    ? '[&>div]:bg-green-600' 
                    : ''
                }
              />
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(procedure.updatedAt), { 
                addSuffix: true, 
                locale: nb 
              })}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
