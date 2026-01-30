import { AppLayout } from '@/components/layout/AppLayout';
import { ProcedureList } from '@/components/dashboard/ProcedureList';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { useSiteContext } from '@/contexts/SiteContext';
import { FileText } from 'lucide-react';

export default function Procedures() {
  const { sites } = useSiteContext();

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

        {/* Procedure List */}
        <ProcedureList />
      </div>
    </AppLayout>
  );
}
