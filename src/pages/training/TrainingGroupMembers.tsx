import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Search, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useTrainingGroup, useAddGroupMembers, useRemoveGroupMember } from '@/hooks/useTrainingGroups';
import { useSiteContext } from '@/contexts/SiteContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

function useSiteUsers(siteId: string | undefined) {
  return useQuery({
    queryKey: ['site_users', siteId],
    queryFn: async () => {
      // Get user IDs assigned to this site
      const { data: assignments, error: assignError } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId!);

      if (assignError) throw assignError;
      if (!assignments?.length) return [];

      const userIds = assignments.map(a => a.user_id);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department, avatar_url')
        .in('id', userIds);

      if (error) throw error;
      return profiles || [];
    },
    enabled: !!siteId,
  });
}

export default function TrainingGroupMembers() {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentSite } = useSiteContext();
  const { data: group, isLoading } = useTrainingGroup(groupId);
  const { data: siteUsers } = useSiteUsers(currentSite?.id);
  const addMembers = useAddGroupMembers();
  const removeMember = useRemoveGroupMember();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const existingMemberIds = new Set(group?.members?.map(m => m.user_id) || []);

  const availableUsers = (siteUsers || []).filter(
    u => !existingMemberIds.has(u.id) &&
      (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.department?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddMembers = () => {
    if (!groupId || selectedUserIds.length === 0) return;
    addMembers.mutate(
      { groupId, userIds: selectedUserIds },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setSelectedUserIds([]);
          setSearchQuery('');
        },
      }
    );
  };

  const handleRemoveMember = () => {
    if (!groupId || !memberToRemove) return;
    removeMember.mutate({ groupId, userId: memberToRemove });
    setMemberToRemove(null);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getInitials = (name: string | null) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/training/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{group?.name}</h1>
            <p className="text-muted-foreground">
              {group?.description || 'Ingen beskrivelse'}
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Legg til medlemmer
          </Button>
        </div>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Medlemmer
              <Badge variant="secondary" className="ml-2">
                {group?.members?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group?.members && group.members.length > 0 ? (
              <div className="divide-y">
                {group.members.map(member => (
                  <div key={member.id} className="flex items-center gap-4 py-3">
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url || ''} />
                      <AvatarFallback>{getInitials(member.profile?.full_name || null)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.profile?.full_name || 'Ukjent bruker'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.profile?.job_title || 'Ingen stilling'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setMemberToRemove(member.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Ingen medlemmer i denne gruppen ennå.</p>
                <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Legg til medlemmer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Members Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Legg til medlemmer</DialogTitle>
            <DialogDescription>
              Velg brukere som skal legges til i "{group?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter navn, stilling eller avdeling..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y border rounded-lg">
              {availableUsers.length > 0 ? (
                availableUsers.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name || 'Ukjent'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[user.job_title, user.department].filter(Boolean).join(' · ') || 'Ingen info'}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {searchQuery ? 'Ingen brukere funnet' : 'Alle brukere er allerede medlemmer'}
                </p>
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedUserIds.length} bruker{selectedUserIds.length !== 1 ? 'e' : ''} valgt
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Avbryt</Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedUserIds.length === 0 || addMembers.isPending}
              >
                Legg til ({selectedUserIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern medlem</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne dette medlemmet fra gruppen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Fjern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
