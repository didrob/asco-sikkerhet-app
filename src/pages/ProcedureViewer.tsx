import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcedure } from '@/hooks/useProcedure';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

// Content block types from the JSONB structure
interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'quiz' | 'checkpoint';
  content: Record<string, unknown>;
}

function ProcedureViewerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProcedureViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: procedure, isLoading, error } = useProcedure(id);

  if (isLoading) {
    return (
      <AppLayout>
        <ProcedureViewerSkeleton />
      </AppLayout>
    );
  }

  if (error || !procedure) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Prosedyre ikke funnet</h2>
          <p className="mb-4 text-muted-foreground">
            Kunne ikke laste prosedyren. Den finnes kanskje ikke eller du har ikke tilgang.
          </p>
          <Button onClick={() => navigate('/procedures')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til prosedyrer
          </Button>
        </div>
      </AppLayout>
    );
  }

  const contentBlocks = (Array.isArray(procedure.content_blocks) ? procedure.content_blocks : []) as unknown as ContentBlock[];
  const progress = procedure.progress;
  const currentBlockIndex = progress?.current_block_index || 0;
  const hasStarted = !!progress;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/procedures')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {procedure.title}
                </h1>
                <Badge variant={procedure.status === 'published' ? 'default' : 'secondary'}>
                  {procedure.status === 'published' ? 'Publisert' : procedure.status}
                </Badge>
              </div>
              {procedure.description && (
                <p className="mt-1 text-muted-foreground">{procedure.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {procedure.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Frist: {format(new Date(procedure.due_date), 'PPP', { locale: nb })}
            </div>
          )}
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {contentBlocks.length} innholdselementer
          </div>
          {hasStarted && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Fremgang: {currentBlockIndex + 1} / {contentBlocks.length}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {contentBlocks.length > 0 && (
          <div className="flex gap-1">
            {contentBlocks.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index < currentBlockIndex
                    ? 'bg-green-500'
                    : index === currentBlockIndex && hasStarted
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Innhold
            </CardTitle>
            <CardDescription>
              {hasStarted
                ? `Du er på steg ${currentBlockIndex + 1} av ${contentBlocks.length}`
                : 'Start prosedyren for å begynne'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentBlocks.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Denne prosedyren har ingen innhold ennå.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show current block content */}
                {contentBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`rounded-lg border p-4 ${
                      index === currentBlockIndex && hasStarted
                        ? 'border-primary bg-primary/5'
                        : index < currentBlockIndex
                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {index < currentBlockIndex ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : index === currentBlockIndex && hasStarted ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="font-medium">
                        Steg {index + 1}: {block.type}
                      </span>
                    </div>
                    {/* Render block content based on type */}
                    <div className="mt-2 text-sm text-muted-foreground">
                      {block.type === 'text' && (
                        <p>{(block.content as { text?: string }).text || 'Tekstinnhold'}</p>
                      )}
                      {block.type === 'image' && (
                        <p>📷 Bilde: {(block.content as { alt?: string }).alt || 'Bilde'}</p>
                      )}
                      {block.type === 'video' && (
                        <p>🎬 Video: {(block.content as { title?: string }).title || 'Video'}</p>
                      )}
                      {block.type === 'quiz' && (
                        <p>❓ Quiz-spørsmål</p>
                      )}
                      {block.type === 'checkpoint' && (
                        <p>✅ Sjekkpunkt</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!hasStarted && contentBlocks.length > 0 && (
            <Button size="lg">
              <Play className="mr-2 h-5 w-5" />
              Start prosedyre
            </Button>
          )}
          {hasStarted && currentBlockIndex < contentBlocks.length - 1 && (
            <Button size="lg">
              Neste steg
            </Button>
          )}
          {hasStarted && currentBlockIndex === contentBlocks.length - 1 && (
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Fullfør prosedyre
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
