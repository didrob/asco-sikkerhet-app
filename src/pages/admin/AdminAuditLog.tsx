import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Download, Filter, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuditLog, useAuditLogCount, type AuditLogFilters } from '@/hooks/useAuditLog';
import { formatAuditAction, formatResourceType } from '@/lib/audit';

const RESOURCE_TYPES = [
  { value: 'all', label: 'Alle ressurser' },
  { value: 'procedure', label: 'Prosedyre' },
  { value: 'role', label: 'Rolle' },
  { value: 'site_assignment', label: 'Site-tilknytning' },
  { value: 'user', label: 'Bruker' },
  { value: 'site', label: 'Site' },
];

const ACTIONS = [
  { value: 'all', label: 'Alle handlinger' },
  { value: 'create', label: 'Opprettet' },
  { value: 'update', label: 'Oppdatert' },
  { value: 'delete', label: 'Slettet' },
  { value: 'publish', label: 'Publisert' },
  { value: 'archive', label: 'Arkivert' },
  { value: 'complete', label: 'Fullført' },
  { value: 'assign', label: 'Tildelt' },
  { value: 'remove', label: 'Fjernet' },
];

const PAGE_SIZE = 20;

export default function AdminAuditLog() {
  const [resourceType, setResourceType] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const filters: AuditLogFilters = useMemo(() => ({
    resourceType: resourceType !== 'all' ? resourceType : undefined,
    action: action !== 'all' ? action : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [resourceType, action, page]);

  const { data: logs, isLoading } = useAuditLog(filters);
  const { data: totalCount } = useAuditLogCount({
    resourceType: resourceType !== 'all' ? resourceType : undefined,
    action: action !== 'all' ? action : undefined,
  });

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const filteredLogs = useMemo(() => {
    if (!logs || !searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.resource_id?.toLowerCase().includes(query) ||
      log.user_id?.toLowerCase().includes(query) ||
      JSON.stringify(log.metadata).toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  const handleExportCSV = () => {
    if (!logs) return;

    const headers = ['Tidspunkt', 'Handling', 'Ressurstype', 'Ressurs-ID', 'Bruker-ID', 'Metadata'];
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.resource_type,
      log.resource_id ?? '',
      log.user_id ?? '',
      JSON.stringify(log.metadata),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aktivitetslogg-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'create':
      case 'publish':
        return 'default';
      case 'delete':
      case 'remove':
        return 'destructive';
      case 'archive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aktivitetslogg</h1>
          <p className="text-muted-foreground">
            Oversikt over alle handlinger i systemet
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Loggoppføringer</CardTitle>
                <CardDescription>
                  {totalCount !== undefined ? `${totalCount} oppføringer totalt` : 'Laster...'}
                </CardDescription>
              </div>
              <Button onClick={handleExportCSV} variant="outline" disabled={!logs?.length}>
                <Download className="mr-2 h-4 w-4" />
                Eksporter CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Søk i logg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={resourceType} onValueChange={(v) => { setResourceType(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ressurstype" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={action} onValueChange={(v) => { setAction(v); setPage(0); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Handling" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tidspunkt</TableHead>
                    <TableHead>Handling</TableHead>
                    <TableHead>Ressurstype</TableHead>
                    <TableHead className="hidden md:table-cell">Ressurs-ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Bruker-ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredLogs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Ingen loggoppføringer funnet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(log.created_at), 'dd. MMM yyyy HH:mm', { locale: nb })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {formatAuditAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatResourceType(log.resource_type)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                          {log.resource_id ? log.resource_id.slice(0, 8) + '...' : '-'}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {log.user_id ? log.user_id.slice(0, 8) + '...' : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Side {page + 1} av {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Forrige
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Neste
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
