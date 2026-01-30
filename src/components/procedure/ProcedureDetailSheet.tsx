import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlayCircle
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
import { Skeleton } from '@/components/ui/skeleton';
import { useProcedureUsers, type ProcedureOverviewStats } from '@/hooks/useProcedureOverview';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ProcedureDetailSheetProps {
  procedure: ProcedureOverviewStats | null;
  siteId: string | null;
  onClose: () => void;
}

export function ProcedureDetailSheet({ procedure, siteId, onClose }: ProcedureDetailSheetProps) {
  const { data: users, isLoading } = useProcedureUsers(
    procedure?.procedureId || null, 
    siteId
  );

  if (!procedure) return null;

  const completed = users?.filter(u => u.status === 'completed') || [];
  const inProgress = users?.filter(u => u.status === 'in_progress') || [];
  const notStarted = users?.filter(u => u.status === 'not_started') || [];

  return (
    <Sheet open={!!procedure} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{procedure.title}</SheetTitle>
          <SheetDescription>
            Sist oppdatert {formatDistanceToNow(new Date(procedure.updatedAt), { 
              addSuffix: true, 
              locale: nb 
            })}
          </SheetDescription>
        </SheetHeader>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="rounded-lg border p-3 text-center bg-green-50 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600">{procedure.completedCount}</div>
            <div className="text-xs text-muted-foreground">Fullført</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-blue-50 dark:bg-blue-950">
            <div className="text-2xl font-bold text-blue-600">{procedure.inProgressCount}</div>
            <div className="text-xs text-muted-foreground">Pågående</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {procedure.totalUsers - procedure.completedCount - procedure.inProgressCount}
            </div>
            <div className="text-xs text-muted-foreground">Ikke startet</div>
          </div>
        </div>

        <div className="mt-2 text-center">
          <span className="text-sm text-muted-foreground">
            Fullføringsrate: <span className="font-medium">{procedure.completionRate}%</span>
          </span>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['completed']} className="mt-6">
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
                    {completed.map(user => (
                      <div 
                        key={user.userId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <p className="font-medium">{user.userName}</p>
                        {user.completedAt && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.completedAt).toLocaleDateString('nb-NO')}
                          </span>
                        )}
                      </div>
                    ))}
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
                    {inProgress.map(user => (
                      <div 
                        key={user.userId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <p className="font-medium">{user.userName}</p>
                        {user.lastActivityAt && (
                          <span className="text-sm text-muted-foreground">
                            Sist aktiv: {formatDistanceToNow(new Date(user.lastActivityAt), { 
                              addSuffix: true, 
                              locale: nb 
                            })}
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
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Ikke startet ({notStarted.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {notStarted.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Alle har startet prosedyren
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notStarted.map(user => (
                      <div 
                        key={user.userId}
                        className="rounded-lg border p-3"
                      >
                        <p className="font-medium">{user.userName}</p>
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
