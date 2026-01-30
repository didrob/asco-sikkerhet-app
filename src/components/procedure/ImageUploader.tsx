import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadProcedureMedia, UploadError } from '@/lib/storage';
import { toast } from 'sonner';

interface ImageUploaderProps {
  procedureId: string | undefined;
  currentUrl: string;
  alt: string;
  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;
}

export function ImageUploader({
  procedureId,
  currentUrl,
  alt,
  onUrlChange,
  onAltChange,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!procedureId) {
      toast.error('Lagre prosedyren først før du laster opp bilder');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProcedureMedia(file, procedureId);
      onUrlChange(result.url);
      toast.success('Bilde lastet opp');
    } catch (error) {
      if (error instanceof UploadError) {
        toast.error(error.message);
      } else {
        toast.error('Kunne ikke laste opp bilde');
      }
    } finally {
      setIsUploading(false);
    }
  }, [procedureId, onUrlChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    } else {
      toast.error('Kun bildefiler er tillatt');
    }
  };

  const clearImage = () => {
    onUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="relative">
          <img
            src={currentUrl}
            alt={alt || 'Opplastet bilde'}
            className="max-h-48 rounded-lg border object-contain"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={clearImage}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Laster opp...</p>
            </>
          ) : (
            <>
              <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                Dra og slipp et bilde her
              </p>
              <p className="text-xs text-muted-foreground">
                eller klikk for å velge fil (maks 5MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {!currentUrl && !procedureId && (
        <p className="text-xs text-amber-600">
          Lagre prosedyren først for å kunne laste opp bilder
        </p>
      )}

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="image-url" className="text-xs">
            Eller bruk ekstern URL
          </Label>
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="image-alt" className="text-xs">
          Alternativ tekst (alt)
        </Label>
        <Input
          id="image-alt"
          placeholder="Beskrivelse av bildet"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
        />
      </div>
    </div>
  );
}
