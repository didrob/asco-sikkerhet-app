import { format } from 'date-fns';
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
import { AccessRequest, useApproveAccessRequest, useRejectAccessRequest, useDeleteAccessRequest } from '@/hooks/useAccessRequests';
import { Check, X, Trash2, UserPlus, Key, Loader2 } from 'lucide-react';

interface AccessRequestsTableProps {
  requests: AccessRequest[] | undefined;
  isLoading: boolean;
  onApprove: (request: AccessRequest) => void;
  filter?: 'all' | 'new_user' | 'password_reset';
}

export function AccessRequestsTable({ requests, isLoading, onApprove, filter = 'all' }: AccessRequestsTableProps) {
  const rejectRequest = useRejectAccessRequest();
  const deleteRequest = useDeleteAccessRequest();

  const filteredRequests = requests?.filter(r => {
    if (filter === 'all') return true;
    return r.request_type === filter;
  });

  const handleReject = async (id: string) => {
    try {
      await rejectRequest.mutateAsync({ id });
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest.mutateAsync(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ventende</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Godkjent</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Avvist</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'password_reset' ? (
      <Key className="h-4 w-4 text-orange-500" />
    ) : (
      <UserPlus className="h-4 w-4 text-blue-500" />
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

  if (!filteredRequests || filteredRequests.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Ingen forespørsler
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Navn</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Dato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(request.request_type)}
                  <span className="text-xs">
                    {request.request_type === 'password_reset' ? 'Passord' : 'Ny'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {request.full_name || '-'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {request.email}
              </TableCell>
              <TableCell>
                {request.company || '-'}
              </TableCell>
              <TableCell>
                {format(new Date(request.requested_at), 'd. MMM', { locale: nb })}
              </TableCell>
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell className="text-right">
                {request.status === 'pending' ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onApprove(request)}
                      title="Godkjenn"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleReject(request.id)}
                      disabled={rejectRequest.isPending}
                      title="Avvis"
                    >
                      {rejectRequest.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(request.id)}
                    disabled={deleteRequest.isPending}
                    title="Slett"
                  >
                    {deleteRequest.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
