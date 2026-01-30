import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useUsersForRoleMatrix, useToggleRole } from '@/hooks/useAdminRoles';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  User,
  Info,
  Crown,
  Eye,
  Wrench,
  Users
} from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

const ROLES: { value: Enums<'app_role'>; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'admin', 
    label: 'Admin', 
    description: 'Full tilgang til alt i systemet',
    icon: <Crown className="h-4 w-4" />
  },
  { 
    value: 'supervisor', 
    label: 'Supervisor', 
    description: 'Administrere prosedyrer og se rapporter for sin site',
    icon: <Shield className="h-4 w-4" />
  },
  { 
    value: 'operator', 
    label: 'Operatør', 
    description: 'Utføre og fullføre prosedyrer',
    icon: <Wrench className="h-4 w-4" />
  },
  { 
    value: 'viewer', 
    label: 'Leser', 
    description: 'Kun lesbar tilgang til prosedyrer',
    icon: <Eye className="h-4 w-4" />
  },
];

function RolesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function RoleInfoPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5" />
          Rollebeskrivelser
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map(role => (
            <div key={role.value} className="flex gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {role.icon}
              </div>
              <div>
                <h4 className="font-medium">{role.label}</h4>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface RoleMatrixProps {
  siteId: string;
}

function RoleMatrix({ siteId }: RoleMatrixProps) {
  const { data: users, isLoading } = useUsersForRoleMatrix();
  const toggleRole = useToggleRole();
  const { toast } = useToast();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Ingen brukere registrert ennå.</p>
      </div>
    );
  }

  const handleToggle = async (
    userId: string, 
    role: Enums<'app_role'>, 
    currentRoleId: string | null
  ) => {
    try {
      const result = await toggleRole.mutateAsync({
        userId,
        siteId,
        role,
        currentRoleId,
      });

      toast({
        title: result.action === 'added' ? 'Rolle tildelt' : 'Rolle fjernet',
        description: result.action === 'added' 
          ? `${ROLES.find(r => r.value === role)?.label} rolle tildelt`
          : `${ROLES.find(r => r.value === role)?.label} rolle fjernet`,
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere rolle.',
        variant: 'destructive',
      });
    }
  };

  const getUserRoleForSite = (userId: string, role: Enums<'app_role'>) => {
    const user = users.find(u => u.id === userId);
    return user?.roles.find(r => r.site_id === siteId && r.role === role);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Bruker</TableHead>
            {ROLES.map(role => (
              <TableHead key={role.value} className="text-center">
                <div className="flex flex-col items-center gap-1">
                  {role.icon}
                  <span>{role.label}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.full_name || 'Ukjent bruker'}</p>
                    {user.job_title && (
                      <p className="text-xs text-muted-foreground">{user.job_title}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              {ROLES.map(role => {
                const existingRole = getUserRoleForSite(user.id, role.value);
                return (
                  <TableCell key={role.value} className="text-center">
                    <Checkbox
                      checked={!!existingRole}
                      onCheckedChange={() => handleToggle(user.id, role.value, existingRole?.id || null)}
                      disabled={toggleRole.isPending}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminRoles() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: sites, isLoading: sitesLoading } = useAllSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const isLoading = adminLoading || sitesLoading;

  // Access check
  if (!adminLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Du må være administrator for å administrere roller.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Auto-select first site when loaded
  if (sites && sites.length > 0 && !selectedSiteId) {
    setSelectedSiteId(sites[0].id);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Shield className="h-6 w-6" />
            Roller
          </h1>
          <p className="text-muted-foreground">
            Administrer brukerroller og tilganger per site
          </p>
        </div>

        {isLoading ? (
          <RolesSkeleton />
        ) : (
          <>
            {/* Role Info Panel */}
            <RoleInfoPanel />

            {/* Site Selector and Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Rolle-matrise</CardTitle>
                <CardDescription>
                  Kryss av for å tildele eller fjerne roller for hver bruker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Site selector */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Velg site:</label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Velg site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites?.map(site => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                          {site.location && ` (${site.location})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Matrix */}
                {selectedSiteId ? (
                  <RoleMatrix siteId={selectedSiteId} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Shield className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Velg en site for å se og administrere roller.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
