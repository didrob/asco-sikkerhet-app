import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAllUsers, useAssignUserToSite, useRemoveUserFromSite } from '@/hooks/useAdminUsers';
import { useAllSites } from '@/hooks/useAdminSites';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useAccessRequests, AccessRequest } from '@/hooks/useAccessRequests';
import { useUserInvitations } from '@/hooks/useUserInvitations';
import { downloadExcelTemplate } from '@/lib/excel-utils';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { ExcelImportDialog } from '@/components/admin/ExcelImportDialog';
import { AccessRequestsTable } from '@/components/admin/AccessRequestsTable';
import { ApproveRequestDialog } from '@/components/admin/ApproveRequestDialog';
import { InvitationsTable } from '@/components/admin/InvitationsTable';
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
  User,
  ExternalLink,
  Upload,
  Download,
  UserPlus,
  Clock,
  Inbox
} from 'lucide-react';

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
  const { data: accessRequests, isLoading: requestsLoading } = useAccessRequests();
  const { data: invitations, isLoading: invitationsLoading } = useUserInvitations();
  const assignToSite = useAssignUserToSite();
  const removeFromSite = useRemoveUserFromSite();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const isLoading = adminLoading || usersLoading;
  const pendingRequests = accessRequests?.filter(r => r.status === 'pending') || [];
  const pendingInvitations = invitations?.filter(i => i.status === 'pending') || [];

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
      setShowSiteDialog(false);
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

  const handleApproveRequest = (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const currentUser = users?.find(u => u.id === selectedUser);
  const availableSitesForUser = sites?.filter(
    site => !currentUser?.site_assignments.some(a => a.site_id === site.id)
  );

  // Count roles per user
  const getRoleCount = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    return user?.roles.length || 0;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Users className="h-6 w-6" />
              Brukere
            </h1>
            <p className="text-muted-foreground">
              Administrer brukere, tilgangsforespørsler og invitasjoner
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Administrer roller
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Opprett bruker
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importer fra Excel
          </Button>
          <Button variant="outline" onClick={downloadExcelTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Last ned mal
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Alle brukere
              <Badge variant="secondary" className="ml-1">
                {users?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Inbox className="h-4 w-4" />
              Forespørsler
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Clock className="h-4 w-4" />
              Ventende
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="users" className="mt-6">
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
                            {getRoleCount(user.id) > 0 && (
                              <Badge variant="secondary" className="mt-1">
                                {getRoleCount(user.id)} {getRoleCount(user.id) === 1 ? 'rolle' : 'roller'}
                              </Badge>
                            )}
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
                                setShowSiteDialog(true);
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
          </TabsContent>

          {/* Access Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tilgangsforespørsler</CardTitle>
                <CardDescription>
                  Brukere som har bedt om tilgang til systemet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccessRequestsTable
                  requests={accessRequests}
                  isLoading={requestsLoading}
                  onApprove={handleApproveRequest}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventende invitasjoner</CardTitle>
                <CardDescription>
                  Brukere som har fått tilsendt midlertidig passord
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvitationsTable
                  invitations={invitations}
                  isLoading={invitationsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign Site Dialog */}
        <Dialog open={showSiteDialog} onOpenChange={setShowSiteDialog}>
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
              <Button variant="outline" onClick={() => setShowSiteDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAssignSite} disabled={!selectedSite || assignToSite.isPending}>
                Tildel site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {/* Excel Import Dialog */}
        <ExcelImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
        />

        {/* Approve Request Dialog */}
        <ApproveRequestDialog
          open={showApproveDialog}
          onOpenChange={setShowApproveDialog}
          request={selectedRequest}
        />
      </div>
    </AppLayout>
  );
}
