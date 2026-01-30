import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Clock,
  TrendingUp,
  Building2,
  Download,
  FileText
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useUserStats, formatDuration } from '@/hooks/useUserStats';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { Shield } from 'lucide-react';

export default function UserStats() {
  const [days, setDays] = useState<number>(7);
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading } = useUserStats(days);

  if (!adminLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Kun administratorer har tilgang til brukerstatistikk.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleExport = () => {
    if (!stats) return;
    
    const data = {
      periode: `Siste ${days} dager`,
      unikeBrukere: stats.uniqueUsers,
      prosedyreVisninger: stats.totalProcedureViews,
      gjennomsnittligLesetid: formatDuration(stats.avgReadDuration),
      prosedyrerFullført: stats.proceduresCompleted,
      kursFullført: stats.coursesCompleted,
      siteAdopsjon: stats.siteAdoption,
      topBrukere: stats.topUsers,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brukerstatistikk-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brukerstatistikk</h1>
            <p className="text-muted-foreground">
              Bevis på digitalisering og systemadopsjon
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Siste 7 dager</SelectItem>
                <SelectItem value="14">Siste 14 dager</SelectItem>
                <SelectItem value="30">Siste 30 dager</SelectItem>
                <SelectItem value="90">Siste 90 dager</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!stats}>
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unike brukere</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.uniqueUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">aktive i perioden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prosedyre-visninger</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalProcedureViews || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">totalt antall visninger</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gj.snitt lesetid</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatDuration(stats?.avgReadDuration || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">per prosedyre</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prosedyrer fullført</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {stats?.proceduresCompleted || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">fullføringer i perioden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kurs bestått</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {stats?.coursesCompleted || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">beståtte kurs</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitet over tid</CardTitle>
              <CardDescription>Visninger og fullføringer per dag</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.dailyActivity?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: nb })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => format(new Date(label), 'dd. MMMM yyyy', { locale: nb })}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      name="Visninger"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completions" 
                      name="Fullføringer"
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="uniqueUsers" 
                      name="Unike brukere"
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
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

          {/* Site Adoption */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lokasjonsadopsjon
              </CardTitle>
              <CardDescription>Andel aktive brukere per lokasjon</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.siteAdoption?.length ? (
                <div className="space-y-4">
                  {stats.siteAdoption.map((site) => (
                    <div key={site.siteId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{site.siteName}</span>
                        <span className="text-muted-foreground">
                          {site.activeUsers} / {site.totalUsers} ({site.adoptionRate}%)
                        </span>
                      </div>
                      <Progress value={site.adoptionRate} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Ingen lokasjonsdata
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Mest aktive brukere</CardTitle>
              <CardDescription>Basert på visninger, fullføringer og kurs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : stats?.topUsers?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Bruker</TableHead>
                      <TableHead className="text-right">Visninger</TableHead>
                      <TableHead className="text-right">Fullført</TableHead>
                      <TableHead className="text-right">Kurs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topUsers.map((user, index) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{user.userName}</TableCell>
                        <TableCell className="text-right">{user.views}</TableCell>
                        <TableCell className="text-right">{user.completions}</TableCell>
                        <TableCell className="text-right">{user.courses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Ingen brukerdata
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Procedures */}
          <Card>
            <CardHeader>
              <CardTitle>Mest leste prosedyrer</CardTitle>
              <CardDescription>Prosedyrer med flest visninger</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : stats?.topProcedures?.length ? (
                <div className="space-y-3">
                  {stats.topProcedures.map((proc, index) => (
                    <div 
                      key={proc.procedureId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium">{proc.procedureTitle}</span>
                      </div>
                      <span className="text-muted-foreground">{proc.views} visninger</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Ingen prosedyredata
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
