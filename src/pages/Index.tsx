import { AppLayout } from '@/components/layout/AppLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { UserStats } from '@/components/dashboard/UserStats';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { useSiteContext } from '@/contexts/SiteContext';

const Index = () => {
  const { sites } = useSiteContext();

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

        {/* Statistics */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Oversikt</h2>
          <UserStats />
        </div>

        {/* Procedure List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Mine prosedyrer</h2>
          <ProcedureList />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
