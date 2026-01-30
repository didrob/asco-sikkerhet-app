import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlayCircle,
  Mail,
  Users
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseAssignments, CourseAssignmentDetail } from '@/hooks/useCourseStats';
import { CourseStats } from '@/hooks/useCourseStats';

interface CourseDetailSheetProps {
  course: CourseStats | null;
  onClose: () => void;
  onSendReminder: (assignments: CourseAssignmentDetail[]) => void;
}

export function CourseDetailSheet({ course, onClose, onSendReminder }: CourseDetailSheetProps) {
  const { data: assignments, isLoading } = useCourseAssignments(course?.courseId || null);
  const [selectedOverdue, setSelectedOverdue] = useState<Set<string>>(new Set());

  if (!course) return null;

  const completed = assignments?.filter(a => a.status === 'completed') || [];
  const overdue = assignments?.filter(a => a.status === 'overdue') || [];
  const inProgress = assignments?.filter(a => a.status === 'in_progress') || [];
  const notStarted = assignments?.filter(a => a.status === 'not_started') || [];

  const toggleOverdueSelect = (id: string) => {
    const newSelected = new Set(selectedOverdue);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOverdue(newSelected);
  };

  const selectAllOverdue = () => {
    if (selectedOverdue.size === overdue.length) {
      setSelectedOverdue(new Set());
    } else {
      setSelectedOverdue(new Set(overdue.map(a => a.assignmentId)));
    }
  };

  const handleSendReminder = () => {
    const selected = overdue.filter(a => selectedOverdue.has(a.assignmentId));
    onSendReminder(selected);
    setSelectedOverdue(new Set());
  };

  return (
    <Sheet open={!!course} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{course.courseTitle}</SheetTitle>
          <SheetDescription>{course.siteName}</SheetDescription>
        </SheetHeader>

        {/* KPI Summary */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{course.totalSent}</div>
            <div className="text-xs text-muted-foreground">Sendt</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-green-50 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600">{course.completed}</div>
            <div className="text-xs text-muted-foreground">Fullført</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-blue-50 dark:bg-blue-950">
            <div className="text-2xl font-bold text-blue-600">{course.inProgress}</div>
            <div className="text-xs text-muted-foreground">Pågående</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-red-50 dark:bg-red-950">
            <div className="text-2xl font-bold text-destructive">{course.overdue}</div>
            <div className="text-xs text-muted-foreground">Forfalt</div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['overdue']} className="mt-6">
            {/* Overdue Section */}
            <AccordionItem value="overdue">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>Forfalt ({overdue.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {overdue.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Ingen forfalte tildelinger
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedOverdue.size === overdue.length}
                          onCheckedChange={selectAllOverdue}
                        />
                        <span className="text-sm text-muted-foreground">Velg alle</span>
                      </div>
                      {selectedOverdue.size > 0 && (
                        <Button size="sm" onClick={handleSendReminder} className="gap-1">
                          <Mail className="h-3 w-3" />
                          Send purring ({selectedOverdue.size})
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {overdue.map(a => (
                        <div 
                          key={a.assignmentId}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <Checkbox
                            checked={selectedOverdue.has(a.assignmentId)}
                            onCheckedChange={() => toggleOverdueSelect(a.assignmentId)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{a.userName}</p>
                            {a.reminderCount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {a.reminderCount} purring(er) sendt
                              </p>
                            )}
                          </div>
                          <Badge variant="destructive">
                            {a.daysOverdue} {a.daysOverdue === 1 ? 'dag' : 'dager'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* In Progress Section */}
            <AccordionItem value="inprogress">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                  <span>Pågående ({inProgress.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {inProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Ingen har startet uten å fullføre
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inProgress.map(a => (
                      <div 
                        key={a.assignmentId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <p className="font-medium">{a.userName}</p>
                        {a.dueDate && (
                          <span className="text-sm text-muted-foreground">
                            Frist: {new Date(a.dueDate).toLocaleDateString('nb-NO')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Not Started Section */}
            <AccordionItem value="notstarted">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Ikke startet ({notStarted.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {notStarted.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Alle har startet kurset
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notStarted.map(a => (
                      <div 
                        key={a.assignmentId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <p className="font-medium">{a.userName}</p>
                        {a.dueDate && (
                          <span className="text-sm text-muted-foreground">
                            Frist: {new Date(a.dueDate).toLocaleDateString('nb-NO')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Completed Section */}
            <AccordionItem value="completed">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Fullført ({completed.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {completed.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Ingen har fullført ennå
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completed.map(a => (
                      <div 
                        key={a.assignmentId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{a.userName}</p>
                          {a.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(a.completedAt).toLocaleDateString('nb-NO')}
                            </p>
                          )}
                        </div>
                        {a.score !== null && a.score !== undefined && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {a.score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </SheetContent>
    </Sheet>
  );
}
