import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CheckCircle, XCircle, ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeLogo } from '@/components/ThemeLogo';
import { useCompletion } from '@/hooks/useCompletions';

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const { data: completion, isLoading, error } = useCompletion(id || null);

  const isValid = completion && (!completion.expires_at || new Date(completion.expires_at) > new Date());

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ThemeLogo className="h-10 w-auto" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Sertifikatverifisering
          </CardTitle>
          <CardDescription>
            Verifisering av fullført prosedyre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error || !completion ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ikke verifisert</h3>
              <p className="text-muted-foreground text-sm">
                Dette sertifikatet finnes ikke eller er ugyldig.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isValid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-destructive/10'}`}>
                  {isValid ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>
                <Badge variant={isValid ? 'default' : 'destructive'} className="mb-2">
                  {isValid ? 'Verifisert og gyldig' : 'Utløpt sertifikat'}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Prosedyre</span>
                  <span className="font-medium">{completion.procedure?.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Fullført</span>
                  <span className="font-medium">
                    {format(new Date(completion.completed_at), 'PPP', { locale: nb })}
                  </span>
                </div>
                {completion.expires_at && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Utløper</span>
                    <span className="font-medium">
                      {format(new Date(completion.expires_at), 'PPP', { locale: nb })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Sertifikat-ID</span>
                  <span className="font-mono text-xs">{completion.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Dette sertifikatet er utstedt av Prosedyrehub og bekrefter at innehaveren har fullført den angitte prosedyren.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Til Prosedyrehub
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
