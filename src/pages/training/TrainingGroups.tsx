import { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  UserPlus,
  ChevronRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useTrainingGroups, 
  useCreateTrainingGroup, 
  useUpdateTrainingGroup,
  useDeleteTrainingGroup,
  TrainingGroup 
} from '@/hooks/useTrainingGroups';

export default function TrainingGroups() {
  const { data: groups, isLoading } = useTrainingGroups();
  const createGroup = useCreateTrainingGroup();
  const updateGroup = useUpdateTrainingGroup();
  const deleteGroup = useDeleteTrainingGroup();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrainingGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<TrainingGroup | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreate = () => {
    createGroup.mutate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ name: '', description: '' });
      },
    });
  };

  const handleUpdate = () => {
    if (editingGroup) {
      updateGroup.mutate({ id: editingGroup.id, ...formData }, {
        onSuccess: () => {
          setEditingGroup(null);
          setFormData({ name: '', description: '' });
        },
      });
    }
  };

  const handleDelete = () => {
    if (groupToDelete) {
      deleteGroup.mutate(groupToDelete.id);
      setGroupToDelete(null);
    }
  };

  const openEdit = (group: TrainingGroup) => {
    setFormData({ name: group.name, description: group.description || '' });
    setEditingGroup(group);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grupper</h1>
            <p className="text-muted-foreground">
              Administrer brukergrupper for kursutsendelser.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny gruppe
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="relative hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(group)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/training/groups/${group.id}`}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Administrer medlemmer
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setGroupToDelete(group)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {group.description || 'Ingen beskrivelse'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/training/groups/${group.id}`}>
                        Se medlemmer
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Ingen grupper opprettet</h3>
              <p className="mb-4 text-muted-foreground">
                Opprett grupper for å enkelt tildele kurs til flere brukere.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett gruppe
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny gruppe</DialogTitle>
            <DialogDescription>
              Grupper gjør det enkelt å tildele kurs til flere brukere samtidig.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gruppenavn</Label>
              <Input
                id="name"
                placeholder="F.eks. Kranførere"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
              <Textarea
                id="description"
                placeholder="Kort beskrivelse av gruppen..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.name.trim() || createGroup.isPending}
            >
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger gruppe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Gruppenavn</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={!formData.name.trim() || updateGroup.isPending}
            >
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett gruppe</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette gruppen "{groupToDelete?.name}"?
              Dette vil ikke slette brukerne, men de vil fjernes fra gruppen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
