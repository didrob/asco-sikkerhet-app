import { AppLayout } from '@/components/layout/AppLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { UserStats } from '@/components/dashboard/UserStats';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { AdminDashboardCards } from '@/components/dashboard/AdminDashboardCards';
import { SupervisorDashboardCards } from '@/components/dashboard/SupervisorDashboardCards';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { useSiteContext } from '@/contexts/SiteContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';

const Index = () => {
  const { sites, currentSite } = useSiteContext();
  const { isAdmin, isSupervisor, isViewer, isLoading } = useRoleAccess(currentSite?.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mobile Site Selector */}
        {sites.length > 0 && (
          <div className="lg:hidden">
            <SiteSelector />
          </div>
        )}

        {/* Welcome Card */}
        <WelcomeCard />

        {/* Role-based Dashboard Cards */}
        {!isLoading && (
          <>
            {isAdmin && <AdminDashboardCards />}
            {isSupervisor && !isAdmin && <SupervisorDashboardCards />}
          </>
        )}

        {/* Upcoming Deadlines - for operators and supervisors */}
        {!isLoading && !isViewer && !isAdmin && <UpcomingDeadlines />}

        {/* Statistics - hide for viewers */}
        {!isViewer && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Oversikt</h2>
            <UserStats />
          </div>
        )}

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
