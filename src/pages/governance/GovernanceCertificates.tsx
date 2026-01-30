import { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Award, Search, CheckCircle, XCircle } from 'lucide-react';
import { GovernanceLayout } from '@/components/layout/GovernanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useAllCompletions } from '@/hooks/useCompletions';

export default function GovernanceCertificates() {
  const [search, setSearch] = useState('');
  const { data: completions, isLoading } = useAllCompletions();

  const filteredCompletions = completions?.filter(c => 
    c.procedure?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GovernanceLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6" />
            Sertifikatoversikt
          </h2>
          <p className="text-muted-foreground">
            Oversikt over alle utstedte sertifikater i systemet.
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Søk etter prosedyre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificates table */}
        <Card>
          <CardHeader>
            <CardTitle>Utstedte sertifikater</CardTitle>
            <CardDescription>
              {filteredCompletions?.length || 0} sertifikater totalt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCompletions && filteredCompletions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prosedyre</TableHead>
                      <TableHead>Fullført</TableHead>
                      <TableHead>Utløper</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sertifikat-ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompletions.map((completion) => {
                      const isExpired = completion.expires_at && new Date(completion.expires_at) < new Date();
                      
                      return (
                        <TableRow key={completion.id}>
                          <TableCell className="font-medium">
                            {completion.procedure?.title || 'Ukjent'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(completion.completed_at), 'dd.MM.yyyy', { locale: nb })}
                          </TableCell>
                          <TableCell>
                            {completion.expires_at 
                              ? format(new Date(completion.expires_at), 'dd.MM.yyyy', { locale: nb })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Utløpt
                              </Badge>
                            ) : (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Gyldig
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {completion.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen sertifikater funnet</h3>
                <p className="text-muted-foreground">
                  {search ? 'Prøv et annet søkeord.' : 'Ingen sertifikater er utstedt ennå.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GovernanceLayout>
  );
}
