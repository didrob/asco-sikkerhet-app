import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAllSites } from '@/hooks/useAdminSites';
import { useCreateInvitation, createUserViaEdgeFunction } from '@/hooks/useUserInvitations';
import { parseExcelFile, downloadExcelTemplate, ImportUser } from '@/lib/excel-utils';
import { generateSecurePassword, calculateExpiryDate } from '@/lib/password-generator';
import { generateBulkImportEmail, openEmailClient } from '@/lib/email';
import { Upload, Download, Check, X, Loader2, Mail, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [users, setUsers] = useState<ImportUser[]>([]);
  const [siteId, setSiteId] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [progress, setProgress] = useState(0);
  const [importedUsers, setImportedUsers] = useState<{ email: string; fullName: string; tempPassword: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: sites } = useAllSites();
  const createInvitation = useCreateInvitation();

  const resetDialog = () => {
    setStep('upload');
    setUsers([]);
    setSiteId('');
    setExpiryDays(7);
    setProgress(0);
    setImportedUsers([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedUsers = await parseExcelFile(file);
      setUsers(parsedUsers);
      setStep('preview');
    } catch (error) {
      toast({
        title: 'Feil ved lesing av fil',
        description: error instanceof Error ? error.message : 'Kunne ikke lese filen',
        variant: 'destructive',
      });
    }
  };

  const validUsers = users.filter(u => u.isValid);
  const invalidUsers = users.filter(u => !u.isValid);

  const handleImport = async () => {
    if (validUsers.length === 0) {
      toast({ title: 'Ingen gyldige brukere', variant: 'destructive' });
      return;
    }

    setStep('importing');
    setProgress(0);
    setErrors([]);
    
    const expiresAt = calculateExpiryDate(expiryDays);
    const successfulUsers: { email: string; fullName: string; tempPassword: string }[] = [];
    const importErrors: string[] = [];

    for (let i = 0; i < validUsers.length; i++) {
      const user = validUsers[i];
      const tempPassword = generateSecurePassword();

      try {
        // Create user via edge function
        const result = await createUserViaEdgeFunction(
          user.email,
          tempPassword,
          user.fullName,
          siteId || undefined
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        // Create invitation record
        await createInvitation.mutateAsync({
          email: user.email,
          full_name: user.fullName,
          temporary_password: tempPassword,
          expires_at: expiresAt,
          site_id: siteId || undefined,
        });

        successfulUsers.push({
          email: user.email,
          fullName: user.fullName,
          tempPassword,
        });
      } catch (error) {
        const errorMsg = `${user.email}: ${error instanceof Error ? error.message : 'Ukjent feil'}`;
        importErrors.push(errorMsg);
      }

      setProgress(((i + 1) / validUsers.length) * 100);
    }

    setImportedUsers(successfulUsers);
    setErrors(importErrors);
    setStep('done');
  };

  const handleSendEmail = () => {
    if (importedUsers.length === 0) return;

    const expiresAt = calculateExpiryDate(expiryDays);
    const { subject, body } = generateBulkImportEmail(importedUsers, expiresAt);

    openEmailClient({
      recipients: importedUsers.map(u => u.email),
      subject,
      body,
      useBcc: true,
    });

    toast({
      title: 'E-postklient åpnet',
      description: `Klar til å sende til ${importedUsers.length} brukere`,
    });
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importer brukere fra Excel'}
            {step === 'preview' && 'Forhåndsvisning'}
            {step === 'importing' && 'Importerer brukere...'}
            {step === 'done' && 'Import fullført'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Last opp en Excel-fil med brukerdata'}
            {step === 'preview' && 'Gjennomgå brukerne før import'}
            {step === 'importing' && 'Vennligst vent...'}
            {step === 'done' && `${importedUsers.length} brukere opprettet`}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Dra og slipp en Excel-fil her, eller klikk for å velge
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
            </div>

            <Button variant="outline" onClick={downloadExcelTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Last ned Excel-mal
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="default" className="mr-2">
                  {validUsers.length} gyldige
                </Badge>
                {invalidUsers.length > 0 && (
                  <Badge variant="destructive">
                    {invalidUsers.length} ugyldige
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Navn</TableHead>
                    <TableHead>Avdeling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {user.isValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <X className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">{user.error}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Passord utløper om</Label>
                <Select value={expiryDays.toString()} onValueChange={(v) => setExpiryDays(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dager</SelectItem>
                    <SelectItem value="14">14 dager</SelectItem>
                    <SelectItem value="30">30 dager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <Progress value={progress} className="w-full" />
            <p className="text-center text-muted-foreground">
              {Math.round(progress)}% ferdig
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            {importedUsers.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">{importedUsers.length} brukere opprettet</span>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{errors.length} feil</span>
                </div>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Tilbake
              </Button>
              <Button onClick={handleImport} disabled={validUsers.length === 0}>
                Importer {validUsers.length} brukere
              </Button>
            </>
          )}

          {step === 'done' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Lukk
              </Button>
              {importedUsers.length > 0 && (
                <Button onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Åpne e-post med alle brukere
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
