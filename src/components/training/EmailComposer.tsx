import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Mail, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { openEmailClient, generateTrainingInviteEmail } from '@/lib/email';
import type { TrainingCourse } from '@/hooks/useTraining';
import type { TrainingGroup } from '@/hooks/useTrainingGroups';

interface UserWithEmail {
  id: string;
  email: string;
  full_name?: string | null;
}

interface GroupMember {
  user_id: string;
  email?: string;
  profile?: {
    id: string;
    full_name?: string | null;
  };
}

interface EmailComposerProps {
  course: TrainingCourse;
  selectedGroups: (TrainingGroup & { members?: GroupMember[] })[];
  selectedUsers: UserWithEmail[];
  dueDate?: Date;
  onSent?: () => void;
}

export function EmailComposer({
  course, 
  selectedGroups, 
  selectedUsers, 
  dueDate,
  onSent
}: EmailComposerProps) {
  const [useBcc, setUseBcc] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Collect all unique email addresses
  const allRecipients = useMemo(() => {
    const emails = new Set<string>();
    
    // From groups - email should be passed on the member object
    selectedGroups.forEach(group => {
      group.members?.forEach(member => {
        if (member.email) {
          emails.add(member.email);
        }
      });
    });
    
    // From individual users
    selectedUsers.forEach(user => {
      if (user.email) {
        emails.add(user.email);
      }
    });
    
    return Array.from(emails);
  }, [selectedGroups, selectedUsers]);

  const { subject, body } = generateTrainingInviteEmail(
    course.title,
    dueDate,
    window.location.origin
  );

  const handleOpenEmail = () => {
    openEmailClient({
      recipients: allRecipients,
      subject,
      body,
      useBcc,
    });
    onSent?.();
  };

  if (allRecipients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Velg grupper eller brukere for å sende invitasjon
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send invitasjon
        </CardTitle>
        <CardDescription>
          {allRecipients.length} {allRecipients.length === 1 ? 'mottaker' : 'mottakere'} valgt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipients Preview */}
        <div>
          <p className="text-sm font-medium mb-2">Mottakere:</p>
          <div className="rounded-lg border p-3 max-h-32 overflow-y-auto bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {allRecipients.slice(0, 5).join(', ')}
              {allRecipients.length > 5 && (
                <span className="font-medium"> +{allRecipients.length - 5} flere</span>
              )}
            </p>
          </div>
        </div>

        {/* Selected Groups */}
        {selectedGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map(group => (
              <Badge key={group.id} variant="secondary">
                {group.name} ({group.members?.length || 0})
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* BCC Option */}
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox
            checked={useBcc}
            onCheckedChange={(checked) => setUseBcc(checked === true)}
            id="use-bcc"
          />
          <div className="flex-1">
            <label htmlFor="use-bcc" className="font-medium cursor-pointer">
              Bruk BCC
            </label>
            <p className="text-sm text-muted-foreground">
              Mottakere ser ikke hverandres e-postadresser
            </p>
          </div>
        </div>

        {/* Email Preview Toggle */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? 'Skjul forhåndsvisning' : 'Vis forhåndsvisning'}
        </Button>

        {/* Email Preview */}
        {showPreview && (
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Emne:</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Innhold:</p>
              <pre className="text-sm whitespace-pre-wrap font-sans mt-1">{body}</pre>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleOpenEmail}
        >
          <Mail className="mr-2 h-4 w-4" />
          Åpne e-postklient
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          E-posten åpnes i din standard e-postklient
        </p>
      </CardContent>
    </Card>
  );
}
