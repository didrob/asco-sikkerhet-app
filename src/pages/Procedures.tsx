import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { ProcedureStatsCards } from '@/components/procedure/ProcedureStatsCards';
import { useSiteContext } from '@/contexts/SiteContext';
import { useProcedureStats } from '@/hooks/useProcedures';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { FileText, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Procedures() {
  const { currentSite, sites } = useSiteContext();
  const { stats, isLoading } = useProcedureStats(currentSite?.id || null);
  const { canManageProcedures } = useRoleAccess(currentSite?.id);

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
              Se og administrer prosedyredokumenter
            </p>
          </div>
          
          {/* Action buttons for managers */}
          {canManageProcedures && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/procedures/manage">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </Link>
              </Button>
              <Button asChild>
                <Link to="/procedures/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Ny prosedyre
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Site Selector */}
        {sites.length > 1 && (
          <div className="lg:hidden">
            <SiteSelector />
          </div>
        )}

        {/* Stats Cards */}
        <ProcedureStatsCards stats={stats} isLoading={isLoading} />

        {/* Procedure List with search and filters */}
        <ProcedureList />
      </div>
    </AppLayout>
  );
}
