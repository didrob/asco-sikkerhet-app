import { useState } from 'react';
import { Bot, Shield, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIAccessList, useGrantAIAccess, useRevokeAIAccess } from '@/hooks/useAIAccess';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function AIAccess() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: accessList, isLoading } = useAIAccessList();
  const grantAccess = useGrantAIAccess();
  const revokeAccess = useRevokeAIAccess();
  
  // Get all users for the dropdown
  const { data: allUsers } = useQuery({
    queryKey: ['all_users_for_ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: dialogOpen,
  });

  if (!adminLoading && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Ingen tilgang</h2>
          <p className="text-muted-foreground">
            Kun administratorer har tilgang til AI-innstillinger.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleToggleAccess = async (userId: string, currentlyEnabled: boolean) => {
    try {
      await grantAccess.mutateAsync({ 
        userId, 
        enabled: !currentlyEnabled 
      });
      toast.success(currentlyEnabled ? 'AI-tilgang deaktivert' : 'AI-tilgang aktivert');
    } catch (error) {
      toast.error('Kunne ikke oppdatere tilgang');
    }
  };

  const handleGrantNewAccess = async () => {
    if (!selectedUserId) return;
    
    try {
      await grantAccess.mutateAsync({ 
        userId: selectedUserId, 
        enabled: true 
      });
      toast.success('AI-tilgang gitt');
      setDialogOpen(false);
      setSelectedUserId('');
    } catch (error) {
      toast.error('Kunne ikke gi tilgang');
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await revokeAccess.mutateAsync(userId);
      toast.success('AI-tilgang fjernet');
    } catch (error) {
      toast.error('Kunne ikke fjerne tilgang');
    }
  };

  // Filter out users who already have access
  const usersWithoutAccess = allUsers?.filter(
    user => !accessList?.some(a => a.user_id === user.id)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Bot className="h-8 w-8" />
              AI-tilgang
            </h1>
            <p className="text-muted-foreground">
              Administrer hvem som har tilgang til AI-funksjoner
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Legg til bruker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gi AI-tilgang</DialogTitle>
                <DialogDescription>
                  Velg en bruker som skal få tilgang til AI-funksjoner.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg bruker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutAccess?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || 'Ukjent bruker'}
                      </SelectItem>
                    ))}
                    {usersWithoutAccess?.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        Alle brukere har allerede tilgang
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleGrantNewAccess} 
                  disabled={!selectedUserId || grantAccess.isPending}
                >
                  {grantAccess.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gi tilgang
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Om AI-funksjoner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              AI-funksjoner er for tiden under utvikling og vil bli tilgjengelig i en fremtidig oppdatering.
              Her kan du forberede ved å gi tilgang til utvalgte brukere som skal teste funksjonene først.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Automatisk oppsummering av prosedyrer</li>
              <li>Intelligente søk og anbefalinger</li>
              <li>Automatisk generering av quiz-spørsmål</li>
              <li>Språkassistent for innholdsskaping</li>
            </ul>
          </CardContent>
        </Card>

        {/* Access List */}
        <Card>
          <CardHeader>
            <CardTitle>Brukere med AI-tilgang</CardTitle>
            <CardDescription>
              {accessList?.filter(a => a.enabled).length || 0} aktive av {accessList?.length || 0} totalt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : accessList?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bruker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gitt</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessList.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">{access.user_name}</TableCell>
                      <TableCell>
                        <Badge variant={access.enabled ? 'default' : 'secondary'}>
                          {access.enabled ? 'Aktiv' : 'Deaktivert'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(access.granted_at), 'dd.MM.yyyy', { locale: nb })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={access.enabled}
                            onCheckedChange={() => handleToggleAccess(access.user_id, access.enabled)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeAccess(access.user_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Bot className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>Ingen brukere har AI-tilgang ennå</p>
                <p className="text-sm">Klikk "Legg til bruker" for å gi tilgang</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
