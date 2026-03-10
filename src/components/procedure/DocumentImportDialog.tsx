import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  File, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  parseDocumentFilename, 
  formatFileSize, 
  isValidDocumentType,
  getFileType,
  type ParsedDocumentMetadata 
} from '@/lib/document-parser';
import { cn } from '@/lib/utils';

interface DocumentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: 'HMS', label: 'HMS' },
  { value: 'SOP', label: 'SOP (Standard Operating Procedure)' },
  { value: 'Brann', label: 'Brann & Evakuering' },
  { value: 'Løfting', label: 'Løfteoperasjoner' },
  { value: 'Kran', label: 'Kranoperasjoner' },
  { value: 'Vedlikehold', label: 'Vedlikehold' },
  { value: 'Sikkerhet', label: 'Generell Sikkerhet' },
  { value: 'Kvalitet', label: 'Kvalitetssikring' },
  { value: 'Miljø', label: 'Miljø' },
  { value: 'Annet', label: 'Annet' },
];

type ImportStep = 'upload' | 'metadata' | 'complete';

export function DocumentImportDialog({ open, onOpenChange }: DocumentImportDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentSite } = useSiteContext();
  const { user } = useAuth();
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<ParsedDocumentMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('1.0');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const resetDialog = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setParsedMetadata(null);
    setUploadProgress(0);
    setTitle('');
    setDescription('');
    setDocumentNumber('');
    setCategory('');
    setVersion('1.0');
    setTags([]);
    setTagInput('');
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!isValidDocumentType(file)) {
      toast.error('Ugyldig filtype. Vennligst last opp PDF, Word eller Excel-fil.');
      return;
    }

    setSelectedFile(file);
    const parsed = parseDocumentFilename(file.name);
    setParsedMetadata(parsed);
    
    // Pre-fill form with parsed values
    setTitle(parsed.title);
    setDocumentNumber(parsed.documentNumber || '');
    setCategory(parsed.category || '');
    setVersion(parsed.version || '1.0');
    setTags(parsed.suggestedTags);
    
    setStep('metadata');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !currentSite?.id || !user?.id) {
        throw new Error('Mangler nødvendig informasjon');
      }

      // 1. Create procedure first
      const procedureData = {
        title,
        description: description || null,
        document_number: documentNumber || null,
        category: category || null,
        version,
        tags: tags.length > 0 ? tags : null,
        site_id: currentSite.id,
        author_id: user.id,
        created_by: user.id,
        status: 'draft' as const,
        content_blocks: [
          {
            id: crypto.randomUUID(),
            type: 'text',
            content: `Dette er en importert prosedyre fra filen "${selectedFile.name}". Se vedlegget for originaldokumentet.`,
          },
        ],
      };

      setUploadProgress(20);

      const { data: procedure, error: procedureError } = await supabase
        .from('procedures')
        .insert(procedureData)
        .select()
        .single();

      if (procedureError) throw procedureError;

      setUploadProgress(40);

      // 2. Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${currentSite.id}/${procedure.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('procedure-attachments')
        .upload(filePath, selectedFile);

      if (uploadError) {
        // Rollback procedure creation
        await supabase.from('procedures').delete().eq('id', procedure.id);
        throw uploadError;
      }

      setUploadProgress(70);

      // 3. Create attachment record
      const { error: attachmentError } = await supabase
        .from('procedure_attachments')
        .insert({
          procedure_id: procedure.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: 'Importert originaldokument',
          uploaded_by: user.id,
        });

      if (attachmentError) throw attachmentError;

      setUploadProgress(100);

      return procedure;
    },
    onSuccess: (procedure) => {
      toast.success('Dokument importert', {
        description: `"${title}" er opprettet som utkast med vedlagt fil.`,
      });
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      setStep('complete');
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Kunne ikke importere dokument', {
        description: error instanceof Error ? error.message : 'Ukjent feil oppstod',
      });
    },
  });

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleGoToProcedure = () => {
    handleClose();
    // Navigate to the procedure editor
    if (importMutation.data?.id) {
      navigate(`/procedures/${importMutation.data.id}/edit`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle>Importer prosedyre</DialogTitle>
              <DialogDescription>
                Last opp et eksisterende prosedyredokument (PDF eller Word) for å opprette en ny prosedyre.
              </DialogDescription>
            </DialogHeader>

            <div
              {...getRootProps()}
              className={cn(
                'mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-center text-primary">Slipp filen her...</p>
              ) : (
                <>
                  <p className="text-center font-medium">
                    Dra og slipp en fil her, eller klikk for å velge
                  </p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Støtter PDF, DOC og DOCX (maks 50 MB)
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {step === 'metadata' && selectedFile && (
          <>
            <DialogHeader>
              <DialogTitle>Dokumentdetaljer</DialogTitle>
              <DialogDescription>
                Bekreft eller rediger informasjonen hentet fra filen.
              </DialogDescription>
            </DialogHeader>

            {/* Selected file preview */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {getFileType(selectedFile.name) === 'pdf' ? (
                  <FileText className="h-5 w-5 text-red-600" />
                ) : (
                  <File className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedFile(null);
                  setStep('upload');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form fields */}
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Prosedyrenavn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docNumber">Dokumentnummer</Label>
                  <Input
                    id="docNumber"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="f.eks. HMS-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Versjon</Label>
                  <Input
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kort beskrivelse av prosedyren..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Legg til tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Legg til
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Tilbake
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!title.trim() || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importerer...
                  </>
                ) : (
                  'Importer prosedyre'
                )}
              </Button>
            </DialogFooter>

            {importMutation.isPending && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="h-2" />
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  {uploadProgress < 40 && 'Oppretter prosedyre...'}
                  {uploadProgress >= 40 && uploadProgress < 70 && 'Laster opp fil...'}
                  {uploadProgress >= 70 && 'Kobler vedlegg...'}
                </p>
              </div>
            )}
          </>
        )}

        {step === 'complete' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Import fullført
              </DialogTitle>
              <DialogDescription>
                Prosedyren "{title}" er opprettet som utkast med det vedlagte dokumentet.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-sm">
                <strong>Neste steg:</strong> Gå til prosedyren for å legge til innhold, 
                redigere metadata, eller publisere dokumentet.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={handleClose}>
                Lukk
              </Button>
              <Button onClick={handleGoToProcedure}>
                Gå til prosedyre
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
