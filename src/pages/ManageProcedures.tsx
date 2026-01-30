import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProcedures } from '@/hooks/useProcedures';
import { useProcedureOverview, type ProcedureOverviewStats } from '@/hooks/useProcedureOverview';
import { useDeleteProcedure } from '@/hooks/useProcedureMutations';
import { useSiteContext } from '@/contexts/SiteContext';
import { useCanManageProcedures } from '@/hooks/useUserRoles';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { AdminProcedureStats } from '@/components/procedure/AdminProcedureStats';
import { ProcedureCompletionTable } from '@/components/procedure/ProcedureCompletionTable';
import { ProcedureDetailSheet } from '@/components/procedure/ProcedureDetailSheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

function ManageProceduresSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ProcedureListItemProps {
  procedure: {
    id: string;
    title: string;
    status: string;
    updated_at: string;
  };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProcedureListItem({ procedure, onView, onEdit, onDelete }: ProcedureListItemProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{procedure.title}</h3>
              <Badge 
                variant={
                  procedure.status === 'published' 
                    ? 'default' 
                    : procedure.status === 'draft'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {procedure.status === 'published' && 'Publisert'}
                {procedure.status === 'draft' && 'Utkast'}
                {procedure.status === 'archived' && 'Arkivert'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Oppdatert: {format(new Date(procedure.updated_at), 'PPP', { locale: nb })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Forhåndsvis"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Rediger"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Slett" 
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett prosedyre</AlertDialogTitle>
                <AlertDialogDescription>
                  Er du sikker på at du vil slette "{procedure.title}"? 
                  Dette kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Slett
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManageProcedures() {
  const navigate = useNavigate();
  const { currentSite, sites } = useSiteContext();
  const { data: canManage, isLoading: roleLoading } = useCanManageProcedures(currentSite?.id || null);
  const { data: procedures, isLoading: proceduresLoading } = useProcedures(currentSite?.id || null);
  const { data: overview, isLoading: overviewLoading } = useProcedureOverview(currentSite?.id || null);
  const deleteProcedure = useDeleteProcedure();
  
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureOverviewStats | null>(null);

  const isLoading = roleLoading || proceduresLoading;

  // Access check
  if (!roleLoading && !canManage) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du har ikke tilgang til å administrere prosedyrer for denne siten.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleSelectProcedure = (procedureId: string) => {
    const proc = overview?.procedures.find(p => p.procedureId === procedureId);
    if (proc) {
      setSelectedProcedure(proc);
    }
  };

  // Sort procedures by updated_at for "Sist oppdatert" tab
  const sortedByUpdate = overview?.procedures 
    ? [...overview.procedures].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Shield className="h-6 w-6" />
              Administrer prosedyrer
            </h1>
            <p className="text-muted-foreground">
              Opprett, rediger og publiser sikkerhetsprosedyrer
            </p>
          </div>
          <Button onClick={() => navigate('/procedures/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Ny prosedyre
          </Button>
        </div>

        {/* Mobile Site Selector */}
        {sites.length > 1 && (
          <div className="lg:hidden">
            <SiteSelector />
          </div>
        )}

        {/* Admin Stats */}
        <AdminProcedureStats data={overview} isLoading={overviewLoading} />

        {/* Tabs */}
        {!currentSite ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Velg en site for å administrere prosedyrer.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="procedures" className="space-y-4">
            <TabsList>
              <TabsTrigger value="procedures">Prosedyrer</TabsTrigger>
              <TabsTrigger value="completion">Fullføringsgrad</TabsTrigger>
              <TabsTrigger value="recent">Sist oppdatert</TabsTrigger>
            </TabsList>

            {/* Prosedyrer Tab - Original list with actions */}
            <TabsContent value="procedures">
              {isLoading ? (
                <ManageProceduresSkeleton />
              ) : procedures && procedures.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="mb-4 text-muted-foreground">
                      Ingen prosedyrer opprettet for denne siten ennå.
                    </p>
                    <Button onClick={() => navigate('/procedures/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Opprett din første prosedyre
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {procedures?.map(procedure => (
                    <ProcedureListItem
                      key={procedure.id}
                      procedure={procedure}
                      onView={() => navigate(`/procedures/${procedure.id}`)}
                      onEdit={() => navigate(`/procedures/${procedure.id}/edit`)}
                      onDelete={() => deleteProcedure.mutate(procedure.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Fullføringsgrad Tab - Completion rates */}
            <TabsContent value="completion">
              <Card>
                <CardContent className="p-0">
                  <ProcedureCompletionTable
                    procedures={overview?.procedures}
                    isLoading={overviewLoading}
                    onSelectProcedure={handleSelectProcedure}
                    showOnlyPublished={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sist oppdatert Tab - Sorted by update date */}
            <TabsContent value="recent">
              <Card>
                <CardContent className="p-0">
                  <ProcedureCompletionTable
                    procedures={sortedByUpdate}
                    isLoading={overviewLoading}
                    onSelectProcedure={handleSelectProcedure}
                    showOnlyPublished={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Drill-down Sheet */}
      <ProcedureDetailSheet
        procedure={selectedProcedure}
        siteId={currentSite?.id || null}
        onClose={() => setSelectedProcedure(null)}
      />
    </AppLayout>
  );
}
