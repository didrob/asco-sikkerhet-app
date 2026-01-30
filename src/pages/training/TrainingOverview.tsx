import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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

export default function TrainingOverview() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  
  const { data: sites } = useSites();
  const { data: siteStats, isLoading: statsLoading } = useTrainingOverview();
  const { data: overdueAssignments, isLoading: overdueLoading } = useOverdueAssignments(
    selectedSiteId !== 'all' ? selectedSiteId : undefined
  );
  const { data: complianceIssues, isLoading: complianceLoading } = useRoleCompliance(
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Opplæringsoversikt</h1>
            <p className="text-muted-foreground">
              Sporing av opplæring per lokasjon og rolle-compliance.
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt tildelt</CardTitle>
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
              <CardTitle className="text-sm font-medium">Fullføringsrate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{overallCompletionRate}%</div>
                  <Progress value={overallCompletionRate} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bestått</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {totalStats?.passedCount || 0}
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
        </div>

        {/* Site Comparison */}
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Overdue Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                Forfalt frist
              </CardTitle>
              <CardDescription>
                Brukere som ikke har fullført innen fristen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : overdueAssignments && overdueAssignments.length > 0 ? (
                <div className="space-y-2">
                  {overdueAssignments.slice(0, 10).map((assignment, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{assignment.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.courseTitle}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {assignment.daysOverdue} dager
                      </Badge>
                    </div>
                  ))}
                  {overdueAssignments.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{overdueAssignments.length - 10} flere
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <p>Ingen forfalte tildelinger</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Compliance */}
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
                  {complianceIssues.slice(0, 10).map((issue, i) => (
                    <div 
                      key={i}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{issue.userName}</p>
                        <Badge variant="outline">{issue.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mangler: {issue.missingCourses.join(', ')}
                      </p>
                    </div>
                  ))}
                  {complianceIssues.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{complianceIssues.length - 10} flere
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <p>Alle har påkrevd opplæring</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
