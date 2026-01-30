import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Award, Download, ExternalLink, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserCompletions } from '@/hooks/useCompletions';

export default function Certificates() {
  const { data: completions, isLoading } = useUserCompletions();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mine sertifikater</h1>
          <p className="text-muted-foreground">
            Oversikt over prosedyrer du har fullført og signert.
          </p>
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
        ) : completions && completions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completions.map((completion) => {
              const isExpired = completion.expires_at && new Date(completion.expires_at) < new Date();
              
              return (
                <Card key={completion.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {completion.procedure?.title || 'Ukjent prosedyre'}
                        </CardTitle>
                      </div>
                      {isExpired ? (
                        <Badge variant="destructive">Utløpt</Badge>
                      ) : (
                        <Badge variant="default">Gyldig</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Fullført {format(new Date(completion.completed_at), 'PPP', { locale: nb })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/certificates/${completion.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Se sertifikat
                        </Link>
                      </Button>
                    </div>
                    {completion.expires_at && !isExpired && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Utløper: {format(new Date(completion.expires_at), 'PPP', { locale: nb })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Ingen sertifikater ennå</h3>
              <p className="mb-4 text-muted-foreground">
                Fullfør prosedyrer for å motta sertifikater.
              </p>
              <Button asChild>
                <Link to="/procedures">
                  <FileText className="mr-2 h-4 w-4" />
                  Se prosedyrer
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
