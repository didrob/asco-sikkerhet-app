import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardHeader, type PeriodOption } from '@/components/dashboard/DashboardHeader';
import { StatCardWithTrend } from '@/components/dashboard/StatCardWithTrend';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { TopProceduresChart } from '@/components/dashboard/TopProceduresChart';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { AdminDashboardCards } from '@/components/dashboard/AdminDashboardCards';
import { SupervisorDashboardCards } from '@/components/dashboard/SupervisorDashboardCards';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { useSiteContext } from '@/contexts/SiteContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProcedureStats } from '@/hooks/useProcedures';
import { useUserStats } from '@/hooks/useUserStats';
import { FileText, CheckCircle2, Clock, Eye, Timer } from 'lucide-react';
import { formatDuration } from '@/hooks/useUserStats';

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(7);
  const { sites, currentSite } = useSiteContext();
  const { isAdmin, isSupervisor, isViewer, isLoading: roleLoading } = useRoleAccess(currentSite?.id);
  const { stats: procedureStats, isLoading: statsLoading } = useProcedureStats(currentSite?.id || null);
  const { data: userStats, isLoading: userStatsLoading } = useUserStats(selectedPeriod);

  const isLoading = roleLoading || statsLoading || userStatsLoading;

  // Prepare data for charts
  const statusData = [
    { name: 'Fullført', value: procedureStats.completed, color: 'hsl(142 76% 36%)' },
    { name: 'Påbegynt', value: procedureStats.inProgress, color: 'hsl(217 91% 60%)' },
    { name: 'Ikke startet', value: procedureStats.notStarted, color: 'hsl(215 16% 47%)' },
  ];

  const activityData = userStats?.dailyActivity || [];
  
  const topProceduresData = (userStats?.topProcedures || []).map(p => ({
    name: p.procedureTitle,
    value: p.views,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mobile Site Selector */}
        {sites.length > 0 && (
          <div className="lg:hidden">
            <SiteSelector />
          </div>
        )}

        {/* Dashboard Header with Period Selector */}
        <DashboardHeader 
          selectedPeriod={selectedPeriod} 
          onPeriodChange={setSelectedPeriod} 
        />

        {/* Role-based Dashboard Cards */}
        {!roleLoading && (
          <>
            {isAdmin && <AdminDashboardCards />}
            {isSupervisor && !isAdmin && <SupervisorDashboardCards />}
          </>
        )}

        {/* KPI Stats Row - hide for viewers */}
        {!isViewer && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <StatCardWithTrend
              title="Totalt antall"
              value={procedureStats.total}
              icon={FileText}
            />
            <StatCardWithTrend
              title="Fullført"
              value={procedureStats.completed}
              icon={CheckCircle2}
              iconClassName="text-green-600"
            />
            <StatCardWithTrend
              title="Påbegynt"
              value={procedureStats.inProgress}
              icon={Clock}
              iconClassName="text-blue-600"
            />
            <StatCardWithTrend
              title="Visninger"
              value={userStats?.totalProcedureViews || 0}
              icon={Eye}
            />
            <StatCardWithTrend
              title="Gj.snitt lesetid"
              value={formatDuration(userStats?.avgReadDuration || 0)}
              icon={Timer}
            />
          </div>
        )}

        {/* Charts Row - hide for viewers */}
        {!isViewer && currentSite && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityChart
              data={activityData}
              isLoading={isLoading}
            />
            <StatusPieChart
              data={statusData}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Top Procedures Chart - only for admins/supervisors */}
        {!isViewer && topProceduresData.length > 0 && (
          <TopProceduresChart
            data={topProceduresData}
            isLoading={isLoading}
          />
        )}

        {/* Upcoming Deadlines - for operators and supervisors */}
        {!roleLoading && !isViewer && !isAdmin && <UpcomingDeadlines />}

        {/* Procedure List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {isViewer ? 'Prosedyrer' : 'Mine prosedyrer'}
          </h2>
          <ProcedureList />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
