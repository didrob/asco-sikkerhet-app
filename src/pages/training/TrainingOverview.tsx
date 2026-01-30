import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Mail,
  PlayCircle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSites } from '@/hooks/useSites';
import { 
  useTrainingOverview, 
  useOverdueAssignments, 
  useRoleCompliance 
} from '@/hooks/useTrainingOverview';
import { useCourseStats, useInProgressAssignments, CourseStats } from '@/hooks/useCourseStats';
import { useReminderStats } from '@/hooks/useTrainingReminders';
import { CourseStatsTable } from '@/components/training/CourseStatsTable';
import { OverdueTable } from '@/components/training/OverdueTable';
import { InProgressTable } from '@/components/training/InProgressTable';
import { CourseDetailSheet } from '@/components/training/CourseDetailSheet';
import { ReminderDialog } from '@/components/training/ReminderDialog';
import { OverdueAssignment } from '@/hooks/useTrainingOverview';
import { CourseAssignmentDetail } from '@/hooks/useCourseStats';

export default function TrainingOverview() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<CourseStats | null>(null);
  const [reminderRecipients, setReminderRecipients] = useState<Array<{
    assignmentId: string;
    userId: string;
    userName: string;
    courseTitle: string;
    daysOverdue: number;
    dueDate: string;
  }>>([]);
  
  const { data: sites } = useSites();
  const { data: siteStats, isLoading: statsLoading } = useTrainingOverview();
  const { data: overdueAssignments, isLoading: overdueLoading } = useOverdueAssignments(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );
  const { data: complianceIssues, isLoading: complianceLoading } = useRoleCompliance(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );
  const { data: courseStats, isLoading: coursesLoading } = useCourseStats(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );
  const { data: inProgressAssignments, isLoading: inProgressLoading } = useInProgressAssignments(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );
  const { data: reminderStats } = useReminderStats(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );

  const filteredStats = selectedSiteId === 'all' 
    ? siteStats 
    : siteStats?.filter(s => s.siteId === selectedSiteId);

  const totalStats = filteredStats?.reduce((acc, site) => ({
    totalUsers: acc.totalUsers + site.totalUsers,
    totalAssignments: acc.totalAssignments + site.totalAssignments,
    completedCount: acc.completedCount + site.completedCount,
    passedCount: acc.passedCount + site.passedCount,
    overdueCount: acc.overdueCount + site.overdueCount,
  }), { totalUsers: 0, totalAssignments: 0, completedCount: 0, passedCount: 0, overdueCount: 0 });

  const overallCompletionRate = totalStats && totalStats.totalAssignments > 0
    ? Math.round((totalStats.completedCount / totalStats.totalAssignments) * 100)
    : 0;

  // Calculate totals from course stats
  const courseTotals = courseStats?.reduce((acc, c) => ({
    courses: acc.courses + 1,
    sent: acc.sent + c.totalSent,
    completed: acc.completed + c.completed,
    inProgress: acc.inProgress + c.inProgress,
    overdue: acc.overdue + c.overdue,
  }), { courses: 0, sent: 0, completed: 0, inProgress: 0, overdue: 0 });

  const handleSelectCourse = (courseId: string) => {
    const course = courseStats?.find(c => c.courseId === courseId);
    if (course) {
      setSelectedCourse(course);
    }
  };

  const handleSendReminderFromOverdue = (selected: OverdueAssignment[]) => {
    setReminderRecipients(selected.map(a => ({
      assignmentId: `${a.userId}:${a.courseId}`, // We'll need to look up the actual assignment ID
      userId: a.userId,
      userName: a.userName,
      courseTitle: a.courseTitle,
      daysOverdue: a.daysOverdue,
      dueDate: a.dueDate,
    })));
  };

  const handleSendReminderFromSheet = (assignments: CourseAssignmentDetail[]) => {
    if (!selectedCourse) return;
    setReminderRecipients(assignments.map(a => ({
      assignmentId: a.assignmentId,
      userId: a.userId,
      userName: a.userName,
      courseTitle: selectedCourse.courseTitle,
      daysOverdue: a.daysOverdue || 0,
      dueDate: a.dueDate || '',
    })));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Opplæringsoversikt</h1>
            <p className="text-muted-foreground">
              Sporing av opplæring, fullføringsrate og påminnelser.
            </p>
          </div>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-[200px]">
              <Building2 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Velg lokasjon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle lokasjoner</SelectItem>
              {sites?.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive kurs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{courseTotals?.courses || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sendt ut</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStats?.totalAssignments || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullført</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {totalStats?.completedCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overallCompletionRate}% fullføringsrate
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pågående</CardTitle>
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {inProgressLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {inProgressAssignments?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forfalt</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  {totalStats?.overdueCount || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purringer</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderStats?.total || 0}</div>
              {reminderStats?.thisWeek !== undefined && reminderStats.thisWeek > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +{reminderStats.thisWeek} denne uken
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Kursoversikt
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Forfalte
              {(totalStats?.overdueCount || 0) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {totalStats?.overdueCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inprogress" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Pågående
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Kursoversikt</CardTitle>
                <CardDescription>
                  Klikk på et kurs for å se detaljer og sende påminnelser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CourseStatsTable 
                  courses={courseStats} 
                  isLoading={coursesLoading}
                  onSelectCourse={handleSelectCourse}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-destructive" />
                  Forfalte tildelinger
                </CardTitle>
                <CardDescription>
                  Brukere som ikke har fullført innen fristen - velg og send påminnelse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OverdueTable
                  assignments={overdueAssignments}
                  isLoading={overdueLoading}
                  onSendReminder={handleSendReminderFromOverdue}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inprogress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                  Pågående opplæring
                </CardTitle>
                <CardDescription>
                  Brukere som har startet men ikke fullført opplæringen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InProgressTable
                  assignments={inProgressAssignments}
                  isLoading={inProgressLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Manglende obligatorisk opplæring
                </CardTitle>
                <CardDescription>
                  Brukere som mangler kurs påkrevd for sin rolle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {complianceLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : complianceIssues && complianceIssues.length > 0 ? (
                  <div className="space-y-2">
                    {complianceIssues.map((issue, i) => (
                      <div 
                        key={i}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{issue.userName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{issue.role}</Badge>
                            <Badge variant="secondary">{issue.siteName}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mangler: {issue.missingCourses.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                    <p className="font-medium">Alle har påkrevd opplæring</p>
                    <p className="text-sm">Ingen compliance-problemer oppdaget</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Site Comparison - only show when "all" is selected */}
        {selectedSiteId === 'all' && (
          <Card>
            <CardHeader>
              <CardTitle>Lokasjonssammenligning</CardTitle>
              <CardDescription>
                Fullføringsrate per lokasjon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lokasjon</TableHead>
                      <TableHead className="text-right">Brukere</TableHead>
                      <TableHead className="text-right">Tildelinger</TableHead>
                      <TableHead className="text-right">Fullført</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteStats?.map((site) => (
                      <TableRow key={site.siteId}>
                        <TableCell className="font-medium">{site.siteName}</TableCell>
                        <TableCell className="text-right">{site.totalUsers}</TableCell>
                        <TableCell className="text-right">{site.totalAssignments}</TableCell>
                        <TableCell className="text-right">{site.completedCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {site.completionRate}%
                            {site.completionRate >= 80 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : site.completionRate < 50 ? (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Progress 
                            value={site.completionRate} 
                            className={site.completionRate < 50 ? '[&>div]:bg-destructive' : ''}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Course Detail Sheet */}
      <CourseDetailSheet
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onSendReminder={handleSendReminderFromSheet}
      />

      {/* Reminder Dialog */}
      <ReminderDialog
        open={reminderRecipients.length > 0}
        onOpenChange={(open) => {
          if (!open) setReminderRecipients([]);
        }}
        recipients={reminderRecipients}
      />
    </AppLayout>
  );
}
