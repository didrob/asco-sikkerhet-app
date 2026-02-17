import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuizBlock, QuizBlockType, QuizOption } from '@/types/quiz';

interface ContentBlockEditorProps {
  blocks: QuizBlock[];
  onChange: (blocks: QuizBlock[]) => void;
}

const blockTypeLabels: Record<QuizBlockType, string> = {
  multiple_choice: 'Flervalg',
  hotspot: 'Hotspot',
  sequence: 'Rekkefølge',
  scenario: 'Scenario',
  video_checkpoint: 'Video-sjekkpunkt',
  match: 'Kobling',
};

function generateId() {
  return crypto.randomUUID();
}

function createEmptyBlock(type: QuizBlockType): QuizBlock {
  const base = { id: generateId(), question: '', explanation: '', points: 1 };
  switch (type) {
    case 'multiple_choice':
      const opt1 = generateId();
      return {
        ...base, type, correctAnswerId: opt1,
        options: [
          { id: opt1, text: '', isCorrect: true },
          { id: generateId(), text: '', isCorrect: false },
        ],
      };
    case 'hotspot':
      return { ...base, type, imageUrl: '', zones: [], instruction: '' };
    case 'sequence':
      return {
        ...base, type,
        items: [
          { id: generateId(), text: '', correctPosition: 0 },
          { id: generateId(), text: '', correctPosition: 1 },
        ],
      };
    case 'scenario':
      const sOpt = generateId();
      return {
        ...base, type, scenarioDescription: '', correctAnswerId: sOpt,
        options: [
          { id: sOpt, text: '', isCorrect: true },
          { id: generateId(), text: '', isCorrect: false },
        ],
      };
    case 'video_checkpoint':
      const vOpt = generateId();
      return {
        ...base, type, videoUrl: '', checkpointTime: 0, correctAnswerId: vOpt,
        options: [
          { id: vOpt, text: '', isCorrect: true },
          { id: generateId(), text: '', isCorrect: false },
        ],
      };
    case 'match':
      return {
        ...base, type,
        pairs: [
          { id: generateId(), left: '', right: '' },
          { id: generateId(), left: '', right: '' },
        ],
      };
  }
}

export function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const addBlock = (type: QuizBlockType) => {
    const newBlock = createEmptyBlock(type);
    onChange([...blocks, newBlock]);
    setExpandedBlock(newBlock.id);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<QuizBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } as QuizBlock : b));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Card key={block.id} className="border">
          <CardHeader
            className="py-3 px-4 cursor-pointer"
            onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); moveBlock(index, 'up'); }}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); moveBlock(index, 'down'); }}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">{index + 1}</Badge>
              <Badge variant="secondary">{blockTypeLabels[block.type]}</Badge>
              <span className="flex-1 text-sm font-medium truncate">
                {block.question || 'Nytt spørsmål'}
              </span>
              <span className="text-xs text-muted-foreground">{block.points} poeng</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); removeBlock(block.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {expandedBlock === block.id && (
            <CardContent className="space-y-4 border-t pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Spørsmål</Label>
                  <Textarea
                    value={block.question}
                    onChange={e => updateBlock(block.id, { question: e.target.value })}
                    placeholder="Skriv spørsmålet..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forklaring (vises etter svar)</Label>
                  <Textarea
                    value={block.explanation || ''}
                    onChange={e => updateBlock(block.id, { explanation: e.target.value })}
                    placeholder="Valgfri forklaring..."
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Poeng</Label>
                  <Input
                    type="number" min={1}
                    value={block.points}
                    onChange={e => updateBlock(block.id, { points: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tidsbegrensning (sekunder, valgfritt)</Label>
                  <Input
                    type="number" min={0}
                    value={block.timeLimit || ''}
                    onChange={e => updateBlock(block.id, { timeLimit: parseInt(e.target.value) || undefined })}
                    placeholder="Ingen grense"
                  />
                </div>
              </div>

              {/* Type-specific fields */}
              {block.type === 'multiple_choice' && (
                <MultipleChoiceEditor block={block} onUpdate={updates => updateBlock(block.id, updates)} />
              )}
              {block.type === 'scenario' && (
                <ScenarioEditor block={block} onUpdate={updates => updateBlock(block.id, updates)} />
              )}
              {block.type === 'sequence' && (
                <SequenceEditor block={block} onUpdate={updates => updateBlock(block.id, updates)} />
              )}
              {block.type === 'hotspot' && (
                <div className="space-y-2">
                  <Label>Bilde-URL</Label>
                  <Input
                    value={(block as any).imageUrl || ''}
                    onChange={e => updateBlock(block.id, { imageUrl: e.target.value } as any)}
                    placeholder="URL til bilde..."
                  />
                  <Label>Instruksjon</Label>
                  <Input
                    value={(block as any).instruction || ''}
                    onChange={e => updateBlock(block.id, { instruction: e.target.value } as any)}
                    placeholder="F.eks. Klikk på sikkerhetsventilen"
                  />
                </div>
              )}
              {block.type === 'match' && (
                <MatchEditor block={block} onUpdate={updates => updateBlock(block.id, updates)} />
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(blockTypeLabels) as QuizBlockType[]).map(type => (
          <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
            <Plus className="mr-1 h-3 w-3" />
            {blockTypeLabels[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Sub-editors

function MultipleChoiceEditor({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  const addOption = () => {
    const newOpt: QuizOption = { id: generateId(), text: '', isCorrect: false };
    onUpdate({ options: [...block.options, newOpt] });
  };
  const removeOption = (id: string) => {
    onUpdate({ options: block.options.filter((o: QuizOption) => o.id !== id) });
  };
  const setCorrect = (id: string) => {
    onUpdate({
      correctAnswerId: id,
      options: block.options.map((o: QuizOption) => ({ ...o, isCorrect: o.id === id })),
    });
  };
  const updateOptionText = (id: string, text: string) => {
    onUpdate({ options: block.options.map((o: QuizOption) => o.id === id ? { ...o, text } : o) });
  };

  return (
    <div className="space-y-3">
      <Label>Svaralternativer</Label>
      {block.options.map((opt: QuizOption, i: number) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Checkbox
            checked={block.correctAnswerId === opt.id}
            onCheckedChange={() => setCorrect(opt.id)}
          />
          <Input
            className="flex-1"
            value={opt.text}
            onChange={e => updateOptionText(opt.id, e.target.value)}
            placeholder={`Alternativ ${i + 1}`}
          />
          {block.options.length > 2 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(opt.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>
        <Plus className="mr-1 h-3 w-3" /> Legg til alternativ
      </Button>
    </div>
  );
}

function ScenarioEditor({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Scenariobeskrivelse</Label>
        <Textarea
          value={block.scenarioDescription || ''}
          onChange={e => onUpdate({ scenarioDescription: e.target.value })}
          placeholder="Beskriv scenarioet..."
        />
      </div>
      <MultipleChoiceEditor block={block} onUpdate={onUpdate} />
    </div>
  );
}

function SequenceEditor({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  const addItem = () => {
    onUpdate({
      items: [...block.items, { id: generateId(), text: '', correctPosition: block.items.length }],
    });
  };
  const removeItem = (id: string) => {
    const items = block.items.filter((i: any) => i.id !== id).map((i: any, idx: number) => ({ ...i, correctPosition: idx }));
    onUpdate({ items });
  };
  const updateItemText = (id: string, text: string) => {
    onUpdate({ items: block.items.map((i: any) => i.id === id ? { ...i, text } : i) });
  };

  return (
    <div className="space-y-3">
      <Label>Elementer i riktig rekkefølge</Label>
      {block.items.map((item: any, i: number) => (
        <div key={item.id} className="flex items-center gap-2">
          <Badge variant="outline" className="w-7 h-7 flex items-center justify-center text-xs">{i + 1}</Badge>
          <Input
            className="flex-1"
            value={item.text}
            onChange={e => updateItemText(item.id, e.target.value)}
            placeholder={`Steg ${i + 1}`}
          />
          {block.items.length > 2 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 h-3 w-3" /> Legg til steg
      </Button>
    </div>
  );
}

function MatchEditor({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  const addPair = () => {
    onUpdate({ pairs: [...block.pairs, { id: generateId(), left: '', right: '' }] });
  };
  const removePair = (id: string) => {
    onUpdate({ pairs: block.pairs.filter((p: any) => p.id !== id) });
  };
  const updatePair = (id: string, field: 'left' | 'right', value: string) => {
    onUpdate({ pairs: block.pairs.map((p: any) => p.id === id ? { ...p, [field]: value } : p) });
  };

  return (
    <div className="space-y-3">
      <Label>Koblingspar</Label>
      {block.pairs.map((pair: any, i: number) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            className="flex-1"
            value={pair.left}
            onChange={e => updatePair(pair.id, 'left', e.target.value)}
            placeholder={`Venstre ${i + 1}`}
          />
          <span className="text-muted-foreground">↔</span>
          <Input
            className="flex-1"
            value={pair.right}
            onChange={e => updatePair(pair.id, 'right', e.target.value)}
            placeholder={`Høyre ${i + 1}`}
          />
          {block.pairs.length > 2 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePair(pair.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair}>
        <Plus className="mr-1 h-3 w-3" /> Legg til par
      </Button>
    </div>
  );
}
