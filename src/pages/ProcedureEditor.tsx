import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProcedure } from '@/hooks/useProcedure';
import { useCreateProcedure, useUpdateProcedure, usePublishProcedure } from '@/hooks/useProcedureMutations';
import { useCreateRevision } from '@/hooks/useProcedureRevisions';
import { useSiteContext } from '@/contexts/SiteContext';
import { ImageUploader } from '@/components/procedure/ImageUploader';
import { MetadataSection } from '@/components/procedure/MetadataSection';
import { AttachmentsSection } from '@/components/procedure/AttachmentsSection';
import { CommentsPanel } from '@/components/procedure/CommentsPanel';
import { RevisionHistory } from '@/components/procedure/RevisionHistory';
import { ExportMenu } from '@/components/procedure/ExportMenu';
import { 
  ArrowLeft, 
  Save,
  Eye,
  Trash2,
  GripVertical,
  FileText,
  Image,
  Video,
  Send,
  Heading,
  AlertTriangle,
  List,
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'heading' | 'warning' | 'list';
  content: Record<string, unknown>;
}

// Updated block types - removed quiz and checkpoint, added heading, warning, list
const BLOCK_TYPES = [
  { type: 'text', label: 'Tekst', icon: FileText },
  { type: 'heading', label: 'Overskrift', icon: Heading },
  { type: 'image', label: 'Bilde', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'warning', label: 'Advarsel', icon: AlertTriangle },
  { type: 'list', label: 'Punktliste', icon: List },
] as const;

function generateBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultContent(type: ContentBlock['type']): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { text: '' };
    case 'heading':
      return { text: '', level: 2 };
    case 'image':
      return { url: '', alt: '' };
    case 'video':
      return { url: '', title: '' };
    case 'warning':
      return { text: '' };
    case 'list':
      return { items: [''] };
    default:
      return {};
  }
}

export default function ProcedureEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSite } = useSiteContext();
  const isEditing = !!id;
  
  const { data: existingProcedure, isLoading } = useProcedure(isEditing ? id : undefined);
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();
  const publishProcedure = usePublishProcedure();
  const createRevision = useCreateRevision();

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Metadata
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('1.0');
  const [documentNumber, setDocumentNumber] = useState('');
  const [reviewDate, setReviewDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);

  // Load existing procedure data
  useEffect(() => {
    if (existingProcedure) {
      setTitle(existingProcedure.title);
      setDescription(existingProcedure.description || '');
      setStatus(existingProcedure.status);
      
      // Filter out old quiz/checkpoint blocks from existing procedures
      const blocks = Array.isArray(existingProcedure.content_blocks) 
        ? (existingProcedure.content_blocks as unknown as ContentBlock[]).filter(
            block => !['quiz', 'checkpoint'].includes(block.type)
          )
        : [];
      setContentBlocks(blocks);

      // Load metadata from procedure - access as any to handle new fields
      const proc = existingProcedure as unknown as {
        category?: string;
        version?: string;
        document_number?: string;
        review_date?: string;
        tags?: string[];
      };
      setCategory(proc.category || '');
      setVersion(proc.version || '1.0');
      setDocumentNumber(proc.document_number || '');
      if (proc.review_date) {
        setReviewDate(new Date(proc.review_date));
      }
      setTags(proc.tags || []);
    }
  }, [existingProcedure]);

  const handleSave = async () => {
    if (!currentSite) return;

    const procedureData = {
      title,
      description,
      site_id: currentSite.id,
      status,
      content_blocks: contentBlocks,
      category: category || null,
      version: version || '1.0',
      document_number: documentNumber || null,
      review_date: reviewDate?.toISOString().split('T')[0] || null,
      tags: tags.length > 0 ? tags : null,
    };

    if (isEditing && id) {
      updateProcedure.mutate({ id, ...procedureData } as Parameters<typeof updateProcedure.mutate>[0], {
        onSuccess: async () => {
          // Create a revision when saving
          await createRevision.mutateAsync({
            procedureId: id,
            version,
            contentSnapshot: {
              title,
              description,
              content_blocks: contentBlocks,
              category,
              version,
              document_number: documentNumber,
              tags,
            },
            changeSummary: 'Lagret endringer',
          });
          navigate('/procedures/manage');
        },
      });
    } else {
      createProcedure.mutate(procedureData as Parameters<typeof createProcedure.mutate>[0], {
        onSuccess: () => navigate('/procedures/manage'),
      });
    }
  };

  const handlePublish = () => {
    if (id) {
      publishProcedure.mutate(id, {
        onSuccess: () => navigate('/procedures/manage'),
      });
    }
  };

  const addBlock = (type: ContentBlock['type']) => {
    setContentBlocks([
      ...contentBlocks,
      {
        id: generateBlockId(),
        type,
        content: getDefaultContent(type),
      },
    ]);
  };

  const updateBlock = (blockId: string, content: Record<string, unknown>) => {
    setContentBlocks(
      contentBlocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      )
    );
  };

  const removeBlock = (blockId: string) => {
    setContentBlocks(contentBlocks.filter((block) => block.id !== blockId));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...contentBlocks];
    const [removed] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, removed);
    setContentBlocks(newBlocks);
  };

  if (isEditing && isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const isSaving = createProcedure.isPending || updateProcedure.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/procedures/manage')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditing ? 'Rediger prosedyre' : 'Ny prosedyre'}
              </h1>
              <p className="text-muted-foreground">
                {currentSite?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExportMenu
              procedure={{
                id,
                title,
                description,
                category,
                version,
                documentNumber,
                reviewDate: reviewDate?.toISOString(),
                tags,
                contentBlocks,
              }}
            />
            {isEditing && status === 'draft' && (
              <Button 
                variant="outline" 
                onClick={handlePublish}
                disabled={publishProcedure.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Publiser
              </Button>
            )}
            <Button variant="outline" onClick={() => id && navigate(`/procedures/${id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Forhåndsvis
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Innhold</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="attachments">Vedlegg</TabsTrigger>
            <TabsTrigger value="comments">Kommentarer</TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Grunnleggende informasjon</CardTitle>
                <CardDescription>Tittel og beskrivelse av prosedyren</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tittel *</Label>
                  <Input
                    id="title"
                    placeholder="F.eks. HMS Introduksjon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    placeholder="En kort beskrivelse av prosedyren..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Blocks */}
            <Card>
              <CardHeader>
                <CardTitle>Innholdsblokker</CardTitle>
                <CardDescription>
                  Legg til og organiser innhold for prosedyren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Block list */}
                {contentBlocks.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="mb-4 text-muted-foreground">
                      Ingen innholdsblokker ennå. Legg til din første blokk nedenfor.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contentBlocks.map((block, index) => (
                      <div
                        key={block.id}
                        className="flex items-start gap-3 rounded-lg border bg-card p-4"
                      >
                        <div className="flex flex-col items-center gap-1 pt-2">
                          <button
                            onClick={() => index > 0 && moveBlock(index, index - 1)}
                            disabled={index === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => index < contentBlocks.length - 1 && moveBlock(index, index + 1)}
                            disabled={index === contentBlocks.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {block.type === 'text' && 'Tekst'}
                              {block.type === 'heading' && 'Overskrift'}
                              {block.type === 'image' && 'Bilde'}
                              {block.type === 'video' && 'Video'}
                              {block.type === 'warning' && 'Advarsel'}
                              {block.type === 'list' && 'Punktliste'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Blokk {index + 1}
                            </span>
                          </div>

                          {/* Text block editor */}
                          {block.type === 'text' && (
                            <Textarea
                              placeholder="Skriv innhold her..."
                              value={(block.content as { text?: string }).text || ''}
                              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                              rows={3}
                            />
                          )}

                          {/* Heading block editor */}
                          {block.type === 'heading' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Overskrift"
                                value={(block.content as { text?: string }).text || ''}
                                onChange={(e) => updateBlock(block.id, { 
                                  ...block.content, 
                                  text: e.target.value 
                                })}
                                className="font-semibold text-lg"
                              />
                            </div>
                          )}

                          {/* Warning block editor */}
                          {block.type === 'warning' && (
                            <div className="rounded-md border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Viktig / Advarsel</span>
                              </div>
                              <Textarea
                                placeholder="Skriv viktig informasjon eller advarsel..."
                                value={(block.content as { text?: string }).text || ''}
                                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                rows={2}
                                className="bg-transparent border-yellow-300"
                              />
                            </div>
                          )}

                          {/* List block editor */}
                          {block.type === 'list' && (
                            <div className="space-y-2">
                              {((block.content as { items?: string[] }).items || ['']).map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">•</span>
                                  <Input
                                    placeholder={`Punkt ${itemIdx + 1}`}
                                    value={item}
                                    onChange={(e) => {
                                      const items = [...((block.content as { items?: string[] }).items || [])];
                                      items[itemIdx] = e.target.value;
                                      updateBlock(block.id, { items });
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const items = [...((block.content as { items?: string[] }).items || [])];
                                      items.splice(itemIdx, 1);
                                      if (items.length === 0) items.push('');
                                      updateBlock(block.id, { items });
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const items = [...((block.content as { items?: string[] }).items || []), ''];
                                  updateBlock(block.id, { items });
                                }}
                              >
                                + Legg til punkt
                              </Button>
                            </div>
                          )}

                          {/* Image block editor */}
                          {block.type === 'image' && (
                            <ImageUploader
                              procedureId={id}
                              currentUrl={(block.content as { url?: string }).url || ''}
                              alt={(block.content as { alt?: string }).alt || ''}
                              onUrlChange={(url) => updateBlock(block.id, { ...block.content, url })}
                              onAltChange={(alt) => updateBlock(block.id, { ...block.content, alt })}
                            />
                          )}

                          {/* Video block editor */}
                          {block.type === 'video' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Video-URL (YouTube, Vimeo, etc.)"
                                value={(block.content as { url?: string }).url || ''}
                                onChange={(e) => updateBlock(block.id, { 
                                  ...block.content, 
                                  url: e.target.value 
                                })}
                              />
                              <Input
                                placeholder="Tittel"
                                value={(block.content as { title?: string }).title || ''}
                                onChange={(e) => updateBlock(block.id, { 
                                  ...block.content, 
                                  title: e.target.value 
                                })}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlock(block.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add block buttons */}
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(type)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>
                  Kategori, versjon, dokumentnummer og andre metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetadataSection
                  category={category}
                  setCategory={setCategory}
                  version={version}
                  setVersion={setVersion}
                  documentNumber={documentNumber}
                  setDocumentNumber={setDocumentNumber}
                  reviewDate={reviewDate}
                  setReviewDate={setReviewDate}
                  tags={tags}
                  setTags={setTags}
                  status={status}
                  setStatus={setStatus}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle>Vedlegg</CardTitle>
                <CardDescription>
                  Last opp filer som skal tilhøre denne prosedyren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttachmentsSection procedureId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Kommentarer</CardTitle>
                <CardDescription>
                  Diskuter og samarbeid om prosedyren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommentsPanel procedureId={id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Revisjonshistorikk</CardTitle>
                <CardDescription>
                  Se tidligere versjoner og gjenopprett ved behov
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevisionHistory procedureId={id} currentVersion={version} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
