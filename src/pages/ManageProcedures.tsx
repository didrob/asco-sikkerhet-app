import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProcedures } from '@/hooks/useProcedures';
import { useSiteContext } from '@/contexts/SiteContext';
import { useCanManageProcedures } from '@/hooks/useUserRoles';
import { SiteSelector } from '@/components/dashboard/SiteSelector';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function ManageProcedures() {
  const { currentSite, sites } = useSiteContext();
  const { data: canManage, isLoading: roleLoading } = useCanManageProcedures(currentSite?.id || null);
  const { data: procedures, isLoading: proceduresLoading } = useProcedures(currentSite?.id || null);

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
          <Button>
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

        {/* Procedure List */}
        {isLoading ? (
          <ManageProceduresSkeleton />
        ) : !currentSite ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Velg en site for å administrere prosedyrer.</p>
            </CardContent>
          </Card>
        ) : procedures && procedures.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                Ingen prosedyrer opprettet for denne siten ennå.
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Opprett din første prosedyre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {procedures?.map(procedure => (
              <Card key={procedure.id}>
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
                    <Button variant="ghost" size="icon" title="Forhåndsvis">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Rediger">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Slett" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
