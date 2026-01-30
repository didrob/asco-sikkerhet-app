import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAllUsers, useAssignUserToSite, useRemoveUserFromSite, useAssignRole, useRemoveRole } from '@/hooks/useAdminUsers';
import { useAllSites } from '@/hooks/useAdminSites';
import { useIsAdmin } from '@/hooks/useUserRoles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Shield,
  Building2,
  Plus,
  X,
  User
} from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

const ROLE_LABELS: Record<Enums<'app_role'>, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  operator: 'Operatør',
  viewer: 'Leser',
};

const ROLE_COLORS: Record<Enums<'app_role'>, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  operator: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: sites } = useAllSites();
  const assignToSite = useAssignUserToSite();
  const removeFromSite = useRemoveUserFromSite();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'site' | 'role' | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<Enums<'app_role'>>('viewer');

  const isLoading = adminLoading || usersLoading;

  // Access check
  if (!adminLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du må være administrator for å administrere brukere.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleAssignSite = async () => {
    if (!selectedUser || !selectedSite) return;
    
    try {
      await assignToSite.mutateAsync({ userId: selectedUser, siteId: selectedSite });
      toast({ title: 'Bruker tildelt site' });
      setDialogType(null);
      setSelectedUser(null);
      setSelectedSite('');
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke tildele site.', variant: 'destructive' });
    }
  };

  const handleRemoveSite = async (userId: string, siteId: string) => {
    try {
      await removeFromSite.mutateAsync({ userId, siteId });
      toast({ title: 'Site fjernet fra bruker' });
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke fjerne site.', variant: 'destructive' });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedSite || !selectedRole) return;
    
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser, 
        siteId: selectedSite, 
        role: selectedRole 
      });
      toast({ title: 'Rolle tildelt' });
      setDialogType(null);
      setSelectedUser(null);
      setSelectedSite('');
      setSelectedRole('viewer');
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke tildele rolle.', variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      await removeRole.mutateAsync(roleId);
      toast({ title: 'Rolle fjernet' });
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke fjerne rolle.', variant: 'destructive' });
    }
  };

  const currentUser = users?.find(u => u.id === selectedUser);
  const availableSitesForUser = sites?.filter(
    site => !currentUser?.site_assignments.some(a => a.site_id === site.id)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users className="h-6 w-6" />
            Brukere
          </h1>
          <p className="text-muted-foreground">
            Administrer brukere, sites og roller
          </p>
        </div>

        {/* Users List */}
        {isLoading ? (
          <UsersSkeleton />
        ) : users && users.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Ingen brukere registrert ennå.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users?.map(user => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* User Info */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {user.profile?.full_name || 'Ukjent bruker'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.profile?.job_title || 'Ingen stillingstittel'}
                          {user.profile?.department && ` • ${user.profile.department}`}
                        </p>
                      </div>
                    </div>

                    {/* Sites */}
                    <div className="flex-1">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sites
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.site_assignments.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Ingen sites</span>
                        ) : (
                          user.site_assignments.map(assignment => {
                            const site = sites?.find(s => s.id === assignment.site_id);
                            return (
                              <Badge key={assignment.id} variant="outline" className="gap-1">
                                <Building2 className="h-3 w-3" />
                                {site?.name || 'Ukjent'}
                                <button
                                  onClick={() => handleRemoveSite(user.id, assignment.site_id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setDialogType('site');
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="flex-1">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Roller
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Ingen roller</span>
                        ) : (
                          user.roles.map(role => {
                            const site = sites?.find(s => s.id === role.site_id);
                            return (
                              <Badge 
                                key={role.id} 
                                className={`gap-1 ${ROLE_COLORS[role.role]}`}
                              >
                                <Shield className="h-3 w-3" />
                                {ROLE_LABELS[role.role]}
                                {site && <span className="opacity-70">@ {site.name}</span>}
                                <button
                                  onClick={() => handleRemoveRole(role.id)}
                                  className="ml-1 hover:opacity-70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setDialogType('role');
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assign Site Dialog */}
        <Dialog open={dialogType === 'site'} onOpenChange={() => setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tildel site</DialogTitle>
              <DialogDescription>
                Velg en site å tildele til brukeren
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg site" />
                </SelectTrigger>
                <SelectContent>
                  {availableSitesForUser?.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Avbryt
              </Button>
              <Button onClick={handleAssignSite} disabled={!selectedSite || assignToSite.isPending}>
                Tildel site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Role Dialog */}
        <Dialog open={dialogType === 'role'} onOpenChange={() => setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tildel rolle</DialogTitle>
              <DialogDescription>
                Velg en rolle og site for brukeren
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Site</label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rolle</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Enums<'app_role'>)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="operator">Operatør</SelectItem>
                    <SelectItem value="viewer">Leser</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                Avbryt
              </Button>
              <Button onClick={handleAssignRole} disabled={!selectedSite || assignRole.isPending}>
                Tildel rolle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
