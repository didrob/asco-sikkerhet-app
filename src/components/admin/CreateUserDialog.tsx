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
import { useCreateInvitation, createUserViaEdgeFunction } from '@/hooks/useUserInvitations';
import { generateSecurePassword, calculateExpiryDate } from '@/lib/password-generator';
import { generateNewUserEmail, openEmailClient } from '@/lib/email';
import { RefreshCw, Mail, Loader2, Copy, Check } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [siteId, setSiteId] = useState<string>('');
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { toast } = useToast();
  const { data: sites } = useAllSites();
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

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setSiteId('');
    setPassword(generateSecurePassword());
    setExpiryDays(7);
    setPasswordCopied(false);
  };

  const handleCreate = async () => {
    if (!email.trim()) {
      toast({ title: 'Feil', description: 'E-post er påkrevd', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    try {
      // Create user via edge function
      const result = await createUserViaEdgeFunction(
        email.trim(),
        password,
        fullName.trim() || undefined,
        siteId || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Kunne ikke opprette bruker');
      }

      // Create invitation record for tracking
      const expiresAt = calculateExpiryDate(expiryDays);
      await createInvitation.mutateAsync({
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        temporary_password: password,
        expires_at: expiresAt,
        site_id: siteId || undefined,
      });

      // Generate and open email
      const { subject, body } = generateNewUserEmail(
        fullName.trim() || email.trim(),
        email.trim(),
        password,
        expiresAt
      );

      openEmailClient({
        recipients: [email.trim()],
        subject,
        body,
      });

      toast({
        title: 'Bruker opprettet',
        description: 'E-postklienten ble åpnet med innloggingsdetaljer.',
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Create user error:', error);
      toast({
        title: 'Feil',
        description: error instanceof Error ? error.message : 'Kunne ikke opprette bruker',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett ny bruker</DialogTitle>
          <DialogDescription>
            Fyll ut informasjonen for å opprette en ny brukerkonto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post *</Label>
            <Input
              id="email"
              type="email"
              placeholder="bruker@firma.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Fullt navn</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Ola Nordmann"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Select value={siteId} onValueChange={setSiteId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Velg site (valgfritt)" />
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
            <Label>Midlertidig passord</Label>
            <div className="flex gap-2">
              <Input
                value={password}
                readOnly
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
                disabled={loading}
                title="Kopier passord"
              >
                {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={regeneratePassword}
                disabled={loading}
                title="Generer nytt passord"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDays">Passord utløper om (dager)</Label>
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
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oppretter...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Opprett og send e-post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
