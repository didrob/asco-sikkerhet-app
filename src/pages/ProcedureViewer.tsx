import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useProcedure } from '@/hooks/useProcedure';
import { useStartProcedure, useAdvanceBlock, useCompleteProcedure } from '@/hooks/useProcedureProgress';
import { SignatureDialog } from '@/components/procedure/SignatureDialog';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'quiz' | 'checkpoint';
  content: {
    text?: string;
    question?: string;
    options?: string[];
    correct?: number;
    label?: string;
    url?: string;
    alt?: string;
    title?: string;
  };
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
  
  const startProcedure = useStartProcedure();
  const advanceBlock = useAdvanceBlock();
  const completeProcedure = useCompleteProcedure();
  
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [checkpointConfirmed, setCheckpointConfirmed] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);

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
  const isOnLastBlock = currentBlockIndex === contentBlocks.length - 1;
  const currentBlock = contentBlocks[currentBlockIndex];

  const handleStart = () => {
    if (id) {
      startProcedure.mutate(id);
    }
  };

  const handleNext = () => {
    if (!id || !currentBlock) return;
    
    // Validate quiz answer if current block is a quiz
    if (currentBlock.type === 'quiz') {
      if (selectedQuizAnswer !== currentBlock.content.correct) {
        setQuizError(true);
        return;
      }
    }
    
    // Validate checkpoint confirmation
    if (currentBlock.type === 'checkpoint' && !checkpointConfirmed) {
      return;
    }

    advanceBlock.mutate({
      procedureId: id,
      currentIndex: currentBlockIndex,
      checkpointAnswer: currentBlock.type === 'checkpoint' 
        ? { blockId: currentBlock.id, answer: true }
        : currentBlock.type === 'quiz'
        ? { blockId: currentBlock.id, answer: selectedQuizAnswer }
        : undefined,
    }, {
      onSuccess: () => {
        setCheckpointConfirmed(false);
        setSelectedQuizAnswer(null);
        setQuizError(false);
      }
    });
  };

  const handleComplete = (signatureText?: string, signatureBlob?: Blob) => {
    if (!id) return;
    completeProcedure.mutate({
      procedureId: id,
      signatureText,
      signatureBlob,
    }, {
      onSuccess: () => {
        setShowSignatureDialog(false);
        navigate('/procedures');
      }
    });
  };

  const canProceed = () => {
    if (!currentBlock) return false;
    if (currentBlock.type === 'checkpoint') return checkpointConfirmed;
    if (currentBlock.type === 'quiz') return selectedQuizAnswer !== null;
    return true;
  };

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
            {contentBlocks.length} steg
          </div>
          {hasStarted && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Steg {currentBlockIndex + 1} av {contentBlocks.length}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {contentBlocks.length > 0 && (
          <div className="flex gap-1">
            {contentBlocks.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
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

        {/* Content - Show current block only when started */}
        {hasStarted && currentBlock ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Steg {currentBlockIndex + 1} av {contentBlocks.length}
              </CardTitle>
              <CardDescription>
                {currentBlock.type === 'text' && 'Les innholdet nedenfor'}
                {currentBlock.type === 'checkpoint' && 'Bekreft at du har forstått'}
                {currentBlock.type === 'quiz' && 'Svar på spørsmålet'}
                {currentBlock.type === 'image' && 'Se bildet'}
                {currentBlock.type === 'video' && 'Se videoen'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text block */}
              {currentBlock.type === 'text' && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p>{(currentBlock.content as { text?: string }).text}</p>
                </div>
              )}

              {/* Checkpoint block */}
              {currentBlock.type === 'checkpoint' && (
                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <Checkbox
                    id="checkpoint"
                    checked={checkpointConfirmed}
                    onCheckedChange={(checked) => setCheckpointConfirmed(checked === true)}
                  />
                  <label
                    htmlFor="checkpoint"
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {currentBlock.content.label}
                  </label>
                </div>
              )}

              {/* Quiz block */}
              {currentBlock.type === 'quiz' && (
                <div className="space-y-4">
                  <p className="font-medium">
                    {currentBlock.content.question}
                  </p>
                  <div className="space-y-2">
                    {(currentBlock.content.options || []).map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedQuizAnswer(idx);
                          setQuizError(false);
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedQuizAnswer === idx
                            ? quizError
                              ? 'border-destructive bg-destructive/10'
                              : 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {quizError && (
                    <p className="text-sm text-destructive">
                      Feil svar. Prøv igjen.
                    </p>
                  )}
                </div>
              )}

              {/* Image block */}
              {currentBlock.type === 'image' && (
                <div className="rounded-lg border bg-muted p-8 text-center">
                  <FileText className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {(currentBlock.content as { alt?: string }).alt || 'Bilde'}
                  </p>
                </div>
              )}

              {/* Video block */}
              {currentBlock.type === 'video' && (
                <div className="rounded-lg border bg-muted p-8 text-center">
                  <Play className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {(currentBlock.content as { title?: string }).title || 'Video'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !hasStarted && contentBlocks.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Oversikt
              </CardTitle>
              <CardDescription>
                Denne prosedyren har {contentBlocks.length} steg. Klikk "Start prosedyre" for å begynne.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contentBlocks.map((block, index) => (
                  <li key={block.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    {block.type === 'text' && 'Informasjon'}
                    {block.type === 'checkpoint' && 'Bekreftelse'}
                    {block.type === 'quiz' && 'Quiz'}
                    {block.type === 'image' && 'Bilde'}
                    {block.type === 'video' && 'Video'}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Denne prosedyren har ingen innhold ennå.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!hasStarted && contentBlocks.length > 0 && (
            <Button 
              size="lg" 
              onClick={handleStart}
              disabled={startProcedure.isPending}
            >
              <Play className="mr-2 h-5 w-5" />
              {startProcedure.isPending ? 'Starter...' : 'Start prosedyre'}
            </Button>
          )}
          {hasStarted && !isOnLastBlock && (
            <Button 
              size="lg" 
              onClick={handleNext}
              disabled={!canProceed() || advanceBlock.isPending}
            >
              {advanceBlock.isPending ? 'Lagrer...' : 'Neste steg'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          {hasStarted && isOnLastBlock && (
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowSignatureDialog(true)}
              disabled={!canProceed()}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Fullfør prosedyre
            </Button>
          )}
        </div>

        {/* Signature Dialog */}
        <SignatureDialog
          open={showSignatureDialog}
          onOpenChange={setShowSignatureDialog}
          onComplete={handleComplete}
          isLoading={completeProcedure.isPending}
          procedureTitle={procedure.title}
        />
      </div>
    </AppLayout>
  );
}
