import { AppLayout } from '@/components/layout/AppLayout';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { ProcedureStatsCards } from '@/components/procedure/ProcedureStatsCards';
import { useSiteContext } from '@/contexts/SiteContext';
import { useProcedureStats } from '@/hooks/useProcedures';
import { FileText } from 'lucide-react';

export default function Procedures() {
  const { currentSite, sites } = useSiteContext();
  const { stats, isLoading } = useProcedureStats(currentSite?.id || null);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <FileText className="h-6 w-6" />
              Prosedyrer
            </h1>
            <p className="text-muted-foreground">
              Se og fullfør sikkerhetsprosedyrer tildelt din rolle
            </p>
          </div>
        </div>

        {/* Mobile Site Selector */}
        {sites.length > 1 && (
          <div className="lg:hidden">
            <SiteSelector />
          </div>
        )}

        {/* Stats Cards */}
        <ProcedureStatsCards stats={stats} isLoading={isLoading} />

        {/* Procedure List */}
        <ProcedureList />
      </div>
    </AppLayout>
  );
}
