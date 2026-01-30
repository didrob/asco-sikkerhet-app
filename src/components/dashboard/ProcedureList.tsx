import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Plus, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProcedures, useProcedureCategories, useProcedureTags } from '@/hooks/useProcedures';
import { useSiteContext } from '@/contexts/SiteContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcedureDocumentCard } from '@/components/procedure/ProcedureDocumentCard';

function ProcedureListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProcedureList() {
  const { currentSite } = useSiteContext();
  const { canManageProcedures } = useRoleAccess(currentSite?.id);
  const { data: procedures, isLoading, error } = useProcedures(currentSite?.id || null);
  const categories = useProcedureCategories(currentSite?.id || null);
  const tags = useProcedureTags(currentSite?.id || null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  if (!currentSite) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Du er ikke tildelt noen sites ennå. Kontakt administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ProcedureListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <p className="text-destructive">Kunne ikke laste prosedyrer. Prøv igjen senere.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter procedures
  const filteredProcedures = (procedures || []).filter(procedure => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = procedure.title.toLowerCase().includes(query);
      const matchesDescription = procedure.description?.toLowerCase().includes(query);
      const matchesDocNumber = procedure.document_number?.toLowerCase().includes(query);
      const matchesTags = procedure.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDescription && !matchesDocNumber && !matchesTags) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== 'all' && procedure.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && procedure.status !== statusFilter) {
      return false;
    }

    // Tag filter
    if (tagFilter !== 'all' && !procedure.tags?.includes(tagFilter)) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk prosedyrer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="published">Publisert</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="archived">Arkivert</SelectItem>
            </SelectContent>
          </Select>
          {tags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle tags</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
              Søk: {searchQuery} ×
            </Badge>
          )}
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter('all')}>
              {categoryFilter} ×
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
              {statusFilter === 'published' ? 'Publisert' : statusFilter === 'draft' ? 'Utkast' : 'Arkivert'} ×
            </Badge>
          )}
          {tagFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setTagFilter('all')}>
              {tagFilter} ×
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setTagFilter('all');
            }}
          >
            Nullstill alle
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Viser {filteredProcedures.length} av {procedures?.length || 0} prosedyrer
      </div>

      {/* Procedure cards */}
      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? 'Ingen prosedyrer matcher søket ditt.' 
                : 'Ingen prosedyrer tilgjengelig for denne siten ennå.'}
            </p>
            {canManageProcedures && !hasActiveFilters && (
              <Button className="mt-4" asChild>
                <Link to="/procedures/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Opprett ny prosedyre
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProcedures.map(procedure => (
            <ProcedureDocumentCard 
              key={procedure.id} 
              procedure={procedure} 
              canManage={canManageProcedures}
            />
          ))}
        </div>
      )}
    </div>
  );
}
