import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProcedure } from '@/hooks/useProcedure';
import { useProcedureAttachments } from '@/hooks/useProcedureAttachments';
import { useProcedureComments } from '@/hooks/useProcedureComments';
import { ExportMenu } from '@/components/procedure/ExportMenu';
import { AttachmentsSection } from '@/components/procedure/AttachmentsSection';
import { CommentsPanel } from '@/components/procedure/CommentsPanel';
import { RevisionHistory } from '@/components/procedure/RevisionHistory';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useSiteContext } from '@/contexts/SiteContext';
import { useLogProcedureView, useUpdateViewDuration } from '@/hooks/useProcedureViews';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  AlertCircle,
  Edit,
  Paperclip,
  MessageSquare,
  History,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ContentBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'list' | 'warning' | 'divider';
  content: {
    text?: string;
    level?: number;
    url?: string;
    alt?: string;
    title?: string;
    items?: string[];
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

function DocumentContent({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Denne prosedyren har ingen innhold ennå.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const level = block.content.level || 2;
            const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag key={block.id} className="mt-6 first:mt-0">
                {block.content.text}
              </HeadingTag>
            );
          }
          case 'text':
            return (
              <p key={block.id} className="my-3">
                {block.content.text}
              </p>
            );
          case 'warning':
            return (
              <div 
                key={block.id} 
                className="my-4 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                <span className="text-yellow-800 dark:text-yellow-200">
                  {block.content.text}
                </span>
              </div>
            );
          case 'list':
            return (
              <ul key={block.id} className="my-3 list-disc pl-6">
                {(block.content.items || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            );
          case 'image':
            return (
              <figure key={block.id} className="my-4">
                {block.content.url ? (
                  <img 
                    src={block.content.url} 
                    alt={block.content.alt || ''} 
                    className="rounded-lg"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
                    <span className="text-muted-foreground">{block.content.alt || 'Bilde'}</span>
                  </div>
                )}
                {block.content.alt && (
                  <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                    {block.content.alt}
                  </figcaption>
                )}
              </figure>
            );
          case 'video':
            return (
              <div key={block.id} className="my-4">
                <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
                  <span className="text-muted-foreground">
                    Video: {block.content.title || 'Video'}
                  </span>
                </div>
              </div>
            );
          case 'divider':
            return <hr key={block.id} className="my-6" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

const statusConfig = {
  draft: {
    label: 'Utkast',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  published: {
    label: 'Publisert',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  archived: {
    label: 'Arkivert',
    className: 'bg-muted text-muted-foreground',
  },
};

export default function ProcedureViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSite } = useSiteContext();
  const { user } = useAuth();
  const { data: procedure, isLoading, error } = useProcedure(id);
  const { canManageProcedures } = useRoleAccess(currentSite?.id);
  const { data: attachments } = useProcedureAttachments(id);
  const { data: comments } = useProcedureComments(id);
  
  const logView = useLogProcedureView();
  const updateDuration = useUpdateViewDuration();
  
  // View tracking
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    if (procedure?.id && user?.id && !viewIdRef.current) {
      logView.mutate(procedure.id, {
        onSuccess: (data) => {
          viewIdRef.current = data?.id || null;
          startTimeRef.current = Date.now();
        },
      });
    }
    
    return () => {
      if (viewIdRef.current) {
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        updateDuration.mutate({ 
          viewId: viewIdRef.current, 
          durationSeconds 
        });
      }
    };
  }, [procedure?.id, user?.id]);

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
  const status = statusConfig[procedure.status] || statusConfig.draft;
  const attachmentCount = attachments?.length || 0;
  const commentCount = comments?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/procedures')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {procedure.document_number && (
                  <span className="text-sm font-mono font-semibold text-primary">
                    {procedure.document_number}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-foreground">
                  {procedure.title}
                </h1>
                <Badge className={status.className}>
                  {status.label}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {procedure.version && <span>v{procedure.version}</span>}
                {procedure.category && (
                  <>
                    <span>•</span>
                    <span>{procedure.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ExportMenu 
              procedure={{
                id: procedure.id,
                title: procedure.title,
                description: procedure.description || undefined,
                category: procedure.category || undefined,
                version: procedure.version || undefined,
                documentNumber: procedure.document_number || undefined,
                reviewDate: procedure.review_date || undefined,
                tags: procedure.tags || undefined,
                contentBlocks: contentBlocks as { id: string; type: string; content: Record<string, unknown> }[],
              }}
            />
            {canManageProcedures && (
              <Button variant="outline" asChild>
                <Link to={`/procedures/edit/${procedure.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rediger
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              Innhold
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Vedlegg
              {attachmentCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {attachmentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Kommentarer
              {commentCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {commentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historikk
            </TabsTrigger>
          </TabsList>

          {/* Content tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Description */}
            {procedure.description && (
              <p className="text-muted-foreground italic">
                {procedure.description}
              </p>
            )}

            {/* Main content */}
            <Card className="dark:bg-[#0B0F19] dark:border-white/10">
              <CardContent className="p-6">
                <DocumentContent blocks={contentBlocks} />
              </CardContent>
            </Card>

            {/* Document info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dokumentinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {procedure.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Kategori</p>
                        <p className="font-medium">{procedure.category}</p>
                      </div>
                    </div>
                  )}
                  {procedure.document_number && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dokumentnr</p>
                        <p className="font-medium">{procedure.document_number}</p>
                      </div>
                    </div>
                  )}
                  {procedure.version && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Versjon</p>
                        <p className="font-medium">{procedure.version}</p>
                      </div>
                    </div>
                  )}
                  {procedure.review_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Neste revisjon</p>
                        <p className="font-medium">
                          {format(new Date(procedure.review_date), 'd. MMMM yyyy', { locale: nb })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {procedure.tags && procedure.tags.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {procedure.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last updated */}
                <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                  <p>
                    Sist oppdatert: {format(new Date(procedure.updated_at), 'd. MMMM yyyy, HH:mm', { locale: nb })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments tab */}
          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Vedlegg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentsSection procedureId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Kommentarer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentsPanel procedureId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Revisjonshistorikk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevisionHistory 
                  procedureId={id} 
                  currentVersion={procedure.version || '1.0'} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
