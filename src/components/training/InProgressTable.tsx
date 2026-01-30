import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InProgressAssignment {
  assignmentId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  startedAt: string | null;
  daysStarted: number;
  dueDate: string | null;
  daysUntilDue: number | null;
}

interface InProgressTableProps {
  assignments: InProgressAssignment[] | undefined;
  isLoading: boolean;
}

export function InProgressTable({ assignments, isLoading }: InProgressTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!assignments?.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
        <p className="font-medium">Ingen pågående opplæring</p>
        <p className="text-sm">Ingen brukere har startet ufullført opplæring</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PlayCircle className="h-4 w-4 text-blue-600" />
        <span>{assignments.length} pågående opplæringer</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bruker</TableHead>
            <TableHead>Kurs</TableHead>
            <TableHead className="text-right">Startet</TableHead>
            <TableHead className="text-right">Tid igjen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.assignmentId}>
              <TableCell className="font-medium">{assignment.userName}</TableCell>
              <TableCell>{assignment.courseTitle}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {assignment.daysStarted === 0 
                  ? 'I dag'
                  : assignment.daysStarted === 1
                    ? '1 dag siden'
                    : `${assignment.daysStarted} dager siden`
                }
              </TableCell>
              <TableCell className="text-right">
                {assignment.daysUntilDue === null ? (
                  <span className="text-muted-foreground">Ingen frist</span>
                ) : assignment.daysUntilDue < 0 ? (
                  <Badge variant="destructive">Forfalt</Badge>
                ) : assignment.daysUntilDue === 0 ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    I dag
                  </Badge>
                ) : assignment.daysUntilDue <= 3 ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {assignment.daysUntilDue} {assignment.daysUntilDue === 1 ? 'dag' : 'dager'}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">
                    {assignment.daysUntilDue} dager
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
