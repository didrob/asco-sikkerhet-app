import { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { FileSearch, Filter, Download } from 'lucide-react';
import { GovernanceLayout } from '@/components/layout/GovernanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLog } from '@/hooks/useAuditLog';
import { formatAuditAction, formatResourceType } from '@/lib/audit';

export default function AuditDeepDive() {
  const [search, setSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: auditEntries, isLoading } = useAuditLog({
    resourceType: resourceTypeFilter !== 'all' ? resourceTypeFilter : undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    search: search || undefined,
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
      case 'publish':
      case 'assign':
      case 'sign':
        return 'default';
      case 'delete':
      case 'remove':
        return 'destructive';
      case 'update':
      case 'archive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleExport = () => {
    if (!auditEntries) return;

    const headers = ['Dato', 'Handling', 'Ressurstype', 'Ressurs-ID', 'Bruker-ID'];
    const rows = auditEntries.map(entry => [
      format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss'),
      entry.action,
      entry.resource_type,
      entry.resource_id || '',
      entry.user_id || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GovernanceLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileSearch className="h-6 w-6" />
              Revisjonslogg
            </h2>
            <p className="text-muted-foreground">
              Full historikk over alle handlinger i systemet.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!auditEntries?.length}>
            <Download className="mr-2 h-4 w-4" />
            Eksporter CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Søk i logg..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ressurstype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle ressurser</SelectItem>
                  <SelectItem value="procedure">Prosedyre</SelectItem>
                  <SelectItem value="role">Rolle</SelectItem>
                  <SelectItem value="site_assignment">Site-tilknytning</SelectItem>
                  <SelectItem value="user">Bruker</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Handling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle handlinger</SelectItem>
                  <SelectItem value="create">Opprettet</SelectItem>
                  <SelectItem value="update">Oppdatert</SelectItem>
                  <SelectItem value="delete">Slettet</SelectItem>
                  <SelectItem value="publish">Publisert</SelectItem>
                  <SelectItem value="sign">Signert</SelectItem>
                  <SelectItem value="assign">Tildelt</SelectItem>
                  <SelectItem value="remove">Fjernet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit log table */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitetslogg</CardTitle>
            <CardDescription>
              {auditEntries?.length || 0} oppføringer funnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : auditEntries && auditEntries.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tidspunkt</TableHead>
                      <TableHead>Handling</TableHead>
                      <TableHead>Ressurstype</TableHead>
                      <TableHead>Ressurs-ID</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(entry.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(entry.action)}>
                            {formatAuditAction(entry.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatResourceType(entry.resource_type)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.resource_id?.slice(0, 8) || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {entry.metadata ? JSON.stringify(entry.metadata) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen oppføringer funnet</h3>
                <p className="text-muted-foreground">
                  Prøv å endre filtrene for å se flere resultater.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GovernanceLayout>
  );
}
