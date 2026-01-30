import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAllSites, useCreateSite, useUpdateSite, useDeleteSite } from '@/hooks/useAdminSites';
import { useIsAdmin } from '@/hooks/useUserRoles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  Shield,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

function SitesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminSites() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: sites, isLoading: sitesLoading } = useAllSites();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '' });

  const isLoading = adminLoading || sitesLoading;

  // Access check
  if (!adminLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du må være administrator for å administrere sites.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Feil', description: 'Navn er påkrevd', variant: 'destructive' });
      return;
    }

    try {
      await createSite.mutateAsync({
        name: formData.name,
        location: formData.location || null,
      });
      toast({ title: 'Site opprettet', description: `${formData.name} er nå opprettet.` });
      setIsCreateOpen(false);
      setFormData({ name: '', location: '' });
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke opprette site.', variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateSite.mutateAsync({
        id,
        name: formData.name,
        location: formData.location || null,
      });
      toast({ title: 'Site oppdatert' });
      setEditingSite(null);
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke oppdatere site.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSite.mutateAsync(id);
      toast({ title: 'Site slettet' });
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke slette site.', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Building2 className="h-6 w-6" />
              Sites
            </h1>
            <p className="text-muted-foreground">
              Administrer sites og lokasjoner
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ name: '', location: '' })}>
                <Plus className="mr-2 h-4 w-4" />
                Ny site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny site</DialogTitle>
                <DialogDescription>
                  Legg til en ny site for organisasjonen
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="F.eks. Oslo Hovedkontor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasjon</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="F.eks. Oslo, Norge"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreate} disabled={createSite.isPending}>
                  {createSite.isPending ? 'Oppretter...' : 'Opprett site'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sites Grid */}
        {isLoading ? (
          <SitesSkeleton />
        ) : sites && sites.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                Ingen sites opprettet ennå.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett din første site
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites?.map(site => (
              <Card key={site.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {editingSite === site.id ? (
                        <Input
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="mb-2"
                        />
                      ) : (
                        <CardTitle className="text-lg">{site.name}</CardTitle>
                      )}
                      {site.location && !editingSite && (
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {site.location}
                        </CardDescription>
                      )}
                      {editingSite === site.id && (
                        <Input
                          value={formData.location}
                          onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Lokasjon"
                        />
                      )}
                    </div>
                    <Badge variant={site.active ? 'default' : 'secondary'}>
                      {site.active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Opprettet: {format(new Date(site.created_at), 'PPP', { locale: nb })}
                  </p>
                  <div className="flex gap-2">
                    {editingSite === site.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(site.id)}
                          disabled={updateSite.isPending}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Lagre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSite(null)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Avbryt
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSite(site.id);
                            setFormData({ name: site.name, location: site.location || '' });
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Rediger
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="mr-1 h-3 w-3" />
                              Slett
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Dette vil slette siten "{site.name}" og alle tilknyttede data.
                                Denne handlingen kan ikke angres.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(site.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Slett site
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
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
