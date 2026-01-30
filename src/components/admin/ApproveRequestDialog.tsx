import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useAllSites } from '@/hooks/useAdminSites';
import { useApproveAccessRequest, AccessRequest } from '@/hooks/useAccessRequests';
import { useCreateInvitation, createUserViaEdgeFunction } from '@/hooks/useUserInvitations';
import { generateSecurePassword, calculateExpiryDate } from '@/lib/password-generator';
import { generateNewUserEmail, generatePasswordResetEmail, openEmailClient } from '@/lib/email';
import { RefreshCw, Mail, Loader2, Copy, Check } from 'lucide-react';

interface ApproveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AccessRequest | null;
}

export function ApproveRequestDialog({ open, onOpenChange, request }: ApproveRequestDialogProps) {
  const [siteId, setSiteId] = useState<string>('');
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { toast } = useToast();
  const { data: sites } = useAllSites();
  const approveRequest = useApproveAccessRequest();
  const createInvitation = useCreateInvitation();

  const regeneratePassword = () => {
    setPassword(generateSecurePassword());
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!request) return;

    setLoading(true);
    
    try {
      const isNewUser = request.request_type === 'new_user';
      
      if (isNewUser) {
        // Create user via edge function
        const result = await createUserViaEdgeFunction(
          request.email,
          password,
          request.full_name || undefined,
          siteId || undefined
        );

        if (!result.success) {
          throw new Error(result.error || 'Kunne ikke opprette bruker');
        }
      }

      // Create invitation record
      const expiresAt = calculateExpiryDate(expiryDays);
      await createInvitation.mutateAsync({
        email: request.email,
        full_name: request.full_name || undefined,
        temporary_password: password,
        expires_at: expiresAt,
        site_id: siteId || undefined,
      });

      // Mark request as approved
      await approveRequest.mutateAsync({ id: request.id });

      // Generate and open email
      const emailContent = isNewUser
        ? generateNewUserEmail(
            request.full_name || request.email,
            request.email,
            password,
            expiresAt
          )
        : generatePasswordResetEmail(
            request.full_name || request.email,
            request.email,
            password,
            expiresAt
          );

      openEmailClient({
        recipients: [request.email],
        subject: emailContent.subject,
        body: emailContent.body,
      });

      toast({
        title: isNewUser ? 'Bruker opprettet' : 'Passord tilbakestilt',
        description: 'E-postklienten ble åpnet med innloggingsdetaljer.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        title: 'Feil',
        description: error instanceof Error ? error.message : 'Kunne ikke behandle forespørselen',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  const isNewUser = request.request_type === 'new_user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewUser ? 'Godkjenn brukerforespørsel' : 'Tilbakestill passord'}
          </DialogTitle>
          <DialogDescription>
            {isNewUser
              ? 'Opprett brukerkonto og send innloggingsdetaljer'
              : 'Generer nytt passord og send til brukeren'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">E-post:</span>
                <p className="font-mono">{request.email}</p>
              </div>
              {request.full_name && (
                <div>
                  <span className="text-sm text-muted-foreground">Navn:</span>
                  <p>{request.full_name}</p>
                </div>
              )}
              {request.company && (
                <div>
                  <span className="text-sm text-muted-foreground">Firma:</span>
                  <p>{request.company}</p>
                </div>
              )}
            </div>
          </div>

          {isNewUser && (
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select value={siteId} onValueChange={setSiteId} disabled={loading}>
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
          )}

          <div className="space-y-2">
            <Label>Midlertidig passord</Label>
            <div className="flex gap-2">
              <Input value={password} readOnly className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
                disabled={loading}
              >
                {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={regeneratePassword}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Passord utløper om</Label>
            <Select
              value={expiryDays.toString()}
              onValueChange={(v) => setExpiryDays(parseInt(v))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 dager</SelectItem>
                <SelectItem value="7">7 dager</SelectItem>
                <SelectItem value="14">14 dager</SelectItem>
                <SelectItem value="30">30 dager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Behandler...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {isNewUser ? 'Opprett og send e-post' : 'Send nytt passord'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
