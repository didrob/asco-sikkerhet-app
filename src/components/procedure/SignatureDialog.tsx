import { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Check, PenLine, ShieldCheck } from 'lucide-react';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (signatureText?: string, signatureBlob?: Blob) => void;
  isLoading?: boolean;
  procedureTitle: string;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onComplete,
  isLoading,
  procedureTitle,
}: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [confirmed, setConfirmed] = useState(false);

  const confirmationText = `Jeg bekrefter at jeg har lest og forstått "${procedureTitle}" og vil følge denne i mitt arbeid.`;

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setHasDrawn(false);
      setConfirmed(false);
    }
  }, [open]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleComplete = async () => {
    if (activeTab === 'type') {
      if (signatureText.trim()) {
        onComplete(signatureText.trim(), undefined);
      }
    } else {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        canvas.toBlob((blob) => {
          if (blob) {
            onComplete(undefined, blob);
          }
        }, 'image/png');
      }
    }
  };

  const hasSignature = activeTab === 'type' 
    ? signatureText.trim().length > 0 
    : hasDrawn;

  const canSubmit = confirmed && hasSignature;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Bekreft og signer
          </DialogTitle>
          <DialogDescription>
            Fullfør prosedyren ved å bekrefte og signere nedenfor.
          </DialogDescription>
        </DialogHeader>

        {/* Compliance confirmation */}
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5 border-primary/20">
          <Checkbox
            id="confirmation"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <label 
              htmlFor="confirmation" 
              className="text-sm leading-relaxed cursor-pointer font-medium"
            >
              {confirmationText}
            </label>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Denne bekreftelsen loggføres for compliance-formål.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draw' | 'type')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Tegn signatur</TabsTrigger>
            <TabsTrigger value="type">Skriv navn</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-4">
            <div className="space-y-3">
              <div className="rounded-lg border bg-white">
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                disabled={!hasDrawn}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Tøm
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="signature-text">Ditt fulle navn</Label>
              <Input
                id="signature-text"
                placeholder="Ola Nordmann"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ved å skrive inn navnet ditt bekrefter du at du har gjennomført prosedyren.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canSubmit || isLoading}
          >
            <Check className="mr-2 h-4 w-4" />
            {isLoading ? 'Fullfører...' : 'Fullfør og signer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
