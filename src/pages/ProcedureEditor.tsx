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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProcedure } from '@/hooks/useProcedure';
import { useCreateProcedure, useUpdateProcedure, usePublishProcedure } from '@/hooks/useProcedureMutations';
import { useSiteContext } from '@/contexts/SiteContext';
import { ImageUploader } from '@/components/procedure/ImageUploader';
import { 
  ArrowLeft, 
  Save,
  Eye,
  Trash2,
  GripVertical,
  FileText,
  CheckSquare,
  HelpCircle,
  Image,
  Video,
  Send
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'quiz' | 'checkpoint';
  content: Record<string, unknown>;
}

const BLOCK_TYPES = [
  { type: 'text', label: 'Tekst', icon: FileText },
  { type: 'checkpoint', label: 'Bekreftelse', icon: CheckSquare },
  { type: 'quiz', label: 'Quiz', icon: HelpCircle },
  { type: 'image', label: 'Bilde', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
] as const;

function generateBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultContent(type: ContentBlock['type']): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { text: '' };
    case 'checkpoint':
      return { label: '' };
    case 'quiz':
      return { question: '', options: ['', '', ''], correct: 0 };
    case 'image':
      return { url: '', alt: '' };
    case 'video':
      return { url: '', title: '' };
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Load existing procedure data
  useEffect(() => {
    if (existingProcedure) {
      setTitle(existingProcedure.title);
      setDescription(existingProcedure.description || '');
      setStatus(existingProcedure.status);
      const blocks = Array.isArray(existingProcedure.content_blocks) 
        ? existingProcedure.content_blocks as unknown as ContentBlock[]
        : [];
      setContentBlocks(blocks);
    }
  }, [existingProcedure]);

  const handleSave = () => {
    if (!currentSite) return;

    const procedureData = {
      title,
      description,
      site_id: currentSite.id,
      status,
      content_blocks: contentBlocks,
    };

    if (isEditing && id) {
      updateProcedure.mutate({ id, ...procedureData }, {
        onSuccess: () => navigate('/procedures/manage'),
      });
    } else {
      createProcedure.mutate(procedureData, {
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Utkast</SelectItem>
                  <SelectItem value="published">Publisert</SelectItem>
                  <SelectItem value="archived">Arkivert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Innhold</CardTitle>
            <CardDescription>
              Legg til og organiser innholdsblokker for prosedyren
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
                          {block.type === 'checkpoint' && 'Bekreftelse'}
                          {block.type === 'quiz' && 'Quiz'}
                          {block.type === 'image' && 'Bilde'}
                          {block.type === 'video' && 'Video'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Steg {index + 1}
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

                      {/* Checkpoint block editor */}
                      {block.type === 'checkpoint' && (
                        <Input
                          placeholder="Bekreftelsestekst, f.eks. 'Jeg har lest og forstått'"
                          value={(block.content as { label?: string }).label || ''}
                          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                        />
                      )}

                      {/* Quiz block editor */}
                      {block.type === 'quiz' && (
                        <div className="space-y-3">
                          <Input
                            placeholder="Spørsmål"
                            value={(block.content as { question?: string }).question || ''}
                            onChange={(e) => updateBlock(block.id, { 
                              ...block.content, 
                              question: e.target.value 
                            })}
                          />
                          <div className="space-y-2">
                            {((block.content as { options?: string[] }).options || ['', '', '']).map((option, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`quiz-${block.id}`}
                                  checked={(block.content as { correct?: number }).correct === optIdx}
                                  onChange={() => updateBlock(block.id, { 
                                    ...block.content, 
                                    correct: optIdx 
                                  })}
                                />
                                <Input
                                  placeholder={`Alternativ ${optIdx + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const options = [...((block.content as { options?: string[] }).options || [])];
                                    options[optIdx] = e.target.value;
                                    updateBlock(block.id, { ...block.content, options });
                                  }}
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Velg riktig svar ved å klikke på radiobuttonen.
                          </p>
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
      </div>
    </AppLayout>
  );
}
