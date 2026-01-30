import { format, isPast } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserInvitation, useDeleteInvitation } from '@/hooks/useUserInvitations';
import { Trash2, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface InvitationsTableProps {
  invitations: UserInvitation[] | undefined;
  isLoading: boolean;
}

export function InvitationsTable({ invitations, isLoading }: InvitationsTableProps) {
  const deleteInvitation = useDeleteInvitation();

  const handleDelete = async (id: string) => {
    try {
      await deleteInvitation.mutateAsync(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getStatusBadge = (invitation: UserInvitation) => {
    if (invitation.status === 'activated') {
      return (
        <Badge variant="default" className="bg-green-500 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Aktivert
        </Badge>
      );
    }
    
    if (invitation.status === 'expired' || isPast(new Date(invitation.expires_at))) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Utløpt
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Ventende
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Ingen ventende invitasjoner
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Navn</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Invitert</TableHead>
            <TableHead>Utløper</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="font-medium">
                {invitation.full_name || '-'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {invitation.email}
              </TableCell>
              <TableCell>
                {format(new Date(invitation.invited_at), 'd. MMM yyyy', { locale: nb })}
              </TableCell>
              <TableCell>
                {format(new Date(invitation.expires_at), 'd. MMM yyyy', { locale: nb })}
              </TableCell>
              <TableCell>
                {getStatusBadge(invitation)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(invitation.id)}
                  disabled={deleteInvitation.isPending}
                  title="Slett"
                >
                  {deleteInvitation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
