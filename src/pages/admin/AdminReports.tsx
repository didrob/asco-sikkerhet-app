import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsAdmin, useCanManageProcedures } from '@/hooks/useUserRoles';
import { useSiteContext } from '@/contexts/SiteContext';
import { useCompletionStats, useUserCompletions, useCompletionTimeline, useTotalStats } from '@/hooks/useReportData';
import { Shield, BarChart3, Users, CheckCircle, TrendingUp, Download, Eye, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { currentSite } = useSiteContext();
  const { data: canManage, isLoading: manageLoading } = useCanManageProcedures(currentSite?.id || null);

  const { data: completionStats, isLoading: statsLoading } = useCompletionStats(currentSite?.id || null);
  const { data: userCompletions, isLoading: usersLoading } = useUserCompletions(currentSite?.id || null);
  const { data: timeline, isLoading: timelineLoading } = useCompletionTimeline(currentSite?.id || null);
  const totalStats = useTotalStats(currentSite?.id || null);

  const isLoading = adminLoading || manageLoading;
  const hasAccess = isAdmin || canManage;

  // Access check
  if (!isLoading && !hasAccess) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du må være administrator eller supervisor for å se rapporter.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleExportProcedures = () => {
    if (completionStats) {
      exportToCSV(
        completionStats.map(s => ({
          prosedyre: s.procedureTitle,
          visninger: s.totalViews,
          unike_lesere: s.uniqueViewers,
          fullfort: s.completedCount,
          totalt_brukere: s.totalUsers,
          fullforingsrate: `${s.completionRate}%`,
        })),
        `prosedyre-rapport-${format(new Date(), 'yyyy-MM-dd')}.csv`
      );
    }
  };

  const handleExportUsers = () => {
    if (userCompletions) {
      exportToCSV(
        userCompletions.map(u => ({
          bruker: u.userName,
          fullforte_prosedyrer: u.proceduresCompleted,
          totalt_prosedyrer: u.proceduresTotal,
          siste_fullfort: u.lastCompletion 
            ? format(new Date(u.lastCompletion), 'dd.MM.yyyy HH:mm', { locale: nb })
            : 'Ingen',
        })),
        `bruker-rapport-${format(new Date(), 'yyyy-MM-dd')}.csv`
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <BarChart3 className="h-6 w-6" />
              Rapporter
            </h1>
            <p className="text-muted-foreground">
              {currentSite ? `Statistikk for ${currentSite.name}` : 'Velg en site for å se rapporter'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportProcedures}
              disabled={!completionStats?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksporter prosedyrer
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportUsers}
              disabled={!userCompletions?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Eksporter brukere
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt fullført</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStats.totalCompleted}</div>
              )}
              <p className="text-xs text-muted-foreground">
                fullføringer registrert
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gjennomsnittlig rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStats.averageRate}%</div>
              )}
              <p className="text-xs text-muted-foreground">
                fullføringsrate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">100% fullført</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStats.usersAt100}</div>
              )}
              <p className="text-xs text-muted-foreground">
                av {totalStats.totalUsers} brukere
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prosedyrer</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStats.totalProcedures}</div>
              )}
              <p className="text-xs text-muted-foreground">
                publiserte prosedyrer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Completion Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fullføringsrate per prosedyre</CardTitle>
              <CardDescription>Prosentvis fullføring av hver prosedyre</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : completionStats?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={completionStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="procedureTitle" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Fullføringsrate']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Ingen data tilgjengelig
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fullføringer over tid</CardTitle>
              <CardDescription>Siste 30 dager</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : timeline?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: nb })}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Fullføringer']}
                      labelFormatter={(label) => format(new Date(label), 'dd. MMMM yyyy', { locale: nb })}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Ingen data tilgjengelig
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Procedure Stats with Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Prosedyre-statistikk
            </CardTitle>
            <CardDescription>Visninger og fullføringer per prosedyre</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : completionStats?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prosedyre</TableHead>
                    <TableHead className="text-right">Visninger</TableHead>
                    <TableHead className="text-right">Unike lesere</TableHead>
                    <TableHead className="text-right">Fullført</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionStats.map(stat => {
                    const readToCompletionRate = stat.uniqueViewers > 0 
                      ? Math.round((stat.completedCount / stat.uniqueViewers) * 100)
                      : 0;
                    const hasLowConversion = stat.uniqueViewers >= 5 && readToCompletionRate < 50;
                    
                    return (
                      <TableRow key={stat.procedureId}>
                        <TableCell className="font-medium">
                          {stat.procedureTitle}
                          {hasLowConversion && (
                            <AlertTriangle className="ml-2 inline h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">{stat.totalViews}</TableCell>
                        <TableCell className="text-right">{stat.uniqueViewers}</TableCell>
                        <TableCell className="text-right">{stat.completedCount}</TableCell>
                        <TableCell className="text-right">{stat.completionRate}%</TableCell>
                        <TableCell>
                          <Progress value={stat.completionRate} className="h-2 w-16" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Ingen prosedyrer på denne siten
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Completion Table */}
        <Card>
          <CardHeader>
            <CardTitle>Brukeroversikt</CardTitle>
            <CardDescription>Status per bruker på denne siten</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : userCompletions?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bruker</TableHead>
                    <TableHead>Fullført</TableHead>
                    <TableHead>Fremgang</TableHead>
                    <TableHead>Sist aktiv</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCompletions.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.userName}</TableCell>
                      <TableCell>
                        {user.proceduresCompleted} / {user.proceduresTotal}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={user.proceduresTotal > 0 
                              ? (user.proceduresCompleted / user.proceduresTotal) * 100 
                              : 0
                            } 
                            className="h-2 w-24" 
                          />
                          <span className="text-sm text-muted-foreground">
                            {user.proceduresTotal > 0 
                              ? Math.round((user.proceduresCompleted / user.proceduresTotal) * 100)
                              : 0
                            }%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastCompletion 
                          ? format(new Date(user.lastCompletion), 'dd.MM.yyyy HH:mm', { locale: nb })
                          : 'Ingen aktivitet'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Ingen brukere tilordnet denne siten
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
