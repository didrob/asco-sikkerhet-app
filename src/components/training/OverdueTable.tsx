import { useState } from 'react';
import { AlertTriangle, Mail, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OverdueAssignment } from '@/hooks/useTrainingOverview';

interface OverdueTableProps {
  assignments: OverdueAssignment[] | undefined;
  isLoading: boolean;
  onSendReminder: (selected: OverdueAssignment[]) => void;
}

export function OverdueTable({ assignments, isLoading, onSendReminder }: OverdueTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === assignments?.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assignments?.map(a => `${a.userId}:${a.courseId}`)));
    }
  };

  const handleSendReminder = () => {
    const selectedAssignments = assignments?.filter(
      a => selected.has(`${a.userId}:${a.courseId}`)
    ) || [];
    onSendReminder(selectedAssignments);
    setSelected(new Set());
  };

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
        <p className="font-medium">Ingen forfalte tildelinger</p>
        <p className="text-sm">Alle brukere er i rute med opplæringen sin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>{assignments.length} forfalte tildelinger</span>
        </div>
        {selected.size > 0 && (
          <Button onClick={handleSendReminder} size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Send purring til {selected.size} valgte
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selected.size === assignments.length && assignments.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Velg alle"
              />
            </TableHead>
            <TableHead>Bruker</TableHead>
            <TableHead>Kurs</TableHead>
            <TableHead className="text-right">Dager over</TableHead>
            <TableHead className="text-right">Frist</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => {
            const id = `${assignment.userId}:${assignment.courseId}`;
            return (
              <TableRow key={id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(id)}
                    onCheckedChange={() => toggleSelect(id)}
                    aria-label={`Velg ${assignment.userName}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{assignment.userName}</TableCell>
                <TableCell>{assignment.courseTitle}</TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={assignment.daysOverdue > 7 ? 'destructive' : 'secondary'}
                    className="font-mono"
                  >
                    {assignment.daysOverdue} {assignment.daysOverdue === 1 ? 'dag' : 'dager'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {new Date(assignment.dueDate).toLocaleDateString('nb-NO')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
