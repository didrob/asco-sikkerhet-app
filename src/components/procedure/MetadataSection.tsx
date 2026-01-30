import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORIES = [
  { value: 'hms', label: 'HMS' },
  { value: 'brann', label: 'Brann og sikkerhet' },
  { value: 'drift', label: 'Drift' },
  { value: 'kvalitet', label: 'Kvalitet' },
  { value: 'miljø', label: 'Miljø' },
  { value: 'personal', label: 'Personal' },
  { value: 'it', label: 'IT' },
  { value: 'økonomi', label: 'Økonomi' },
  { value: 'annet', label: 'Annet' },
];

interface MetadataSectionProps {
  category: string;
  setCategory: (value: string) => void;
  version: string;
  setVersion: (value: string) => void;
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  reviewDate: Date | undefined;
  setReviewDate: (value: Date | undefined) => void;
  tags: string[];
  setTags: (value: string[]) => void;
  status: 'draft' | 'published' | 'archived';
  setStatus: (value: 'draft' | 'published' | 'archived') => void;
}

export function MetadataSection({
  category,
  setCategory,
  version,
  setVersion,
  documentNumber,
  setDocumentNumber,
  reviewDate,
  setReviewDate,
  tags,
  setTags,
  status,
  setStatus,
}: MetadataSectionProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
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

        {/* Version */}
        <div className="space-y-2">
          <Label htmlFor="version">Versjon</Label>
          <Input
            id="version"
            placeholder="1.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        {/* Document Number */}
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Dokumentnummer</Label>
          <Input
            id="documentNumber"
            placeholder="HMS-001"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="published">Publisert</SelectItem>
              <SelectItem value="archived">Arkivert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Review Date */}
        <div className="space-y-2">
          <Label>Revisjonsdato</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !reviewDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reviewDate ? format(reviewDate, 'd. MMMM yyyy', { locale: nb }) : 'Velg dato'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={reviewDate}
                onSelect={setReviewDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tagger</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Legg til tagg"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
