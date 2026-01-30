import { useState } from 'react';
import { Mail, AlertTriangle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLogReminder } from '@/hooks/useTrainingReminders';
import { openEmailClient, generateReminderEmail, generateBulkReminderEmail } from '@/lib/email';

interface ReminderRecipient {
  assignmentId: string;
  userId: string;
  userName: string;
  courseTitle: string;
  daysOverdue: number;
  dueDate: string;
}

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: ReminderRecipient[];
}

export function ReminderDialog({ open, onOpenChange, recipients }: ReminderDialogProps) {
  const [useBcc, setUseBcc] = useState(true);
  const { toast } = useToast();
  const logReminder = useLogReminder();

  if (!recipients.length) return null;

  // Group by course if multiple courses
  const courseGroups = recipients.reduce((acc, r) => {
    if (!acc[r.courseTitle]) {
      acc[r.courseTitle] = [];
    }
    acc[r.courseTitle].push(r);
    return acc;
  }, {} as Record<string, ReminderRecipient[]>);

  const courseCount = Object.keys(courseGroups).length;
  const isSingleCourse = courseCount === 1;

  const handleSendReminder = async () => {
    try {
      // Log the reminders in database
      await logReminder.mutateAsync({
        assignmentIds: recipients.map(r => r.assignmentId),
        reminderType: 'overdue',
      });

      // Generate email content
      let emailData;
      if (isSingleCourse) {
        const firstRecipient = recipients[0];
        emailData = generateReminderEmail(
          firstRecipient.courseTitle,
          Math.max(...recipients.map(r => r.daysOverdue)),
          new Date(firstRecipient.dueDate)
        );
      } else {
        emailData = generateBulkReminderEmail(
          recipients.map(r => ({
            name: r.userName,
            email: '', // We don't have email here, but mailto will use BCC
            courseTitle: r.courseTitle,
            daysOverdue: r.daysOverdue,
          }))
        );
      }

      // Note: In a real implementation, you would have user emails
      // For now, we'll show a success message and the user can manually send
      toast({
        title: 'Purring loggført',
        description: `Purring til ${recipients.length} ${recipients.length === 1 ? 'bruker' : 'brukere'} er loggført. Åpne e-postklienten manuelt for å sende.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke logge purringen',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send påminnelse
          </DialogTitle>
          <DialogDescription>
            Send purring til {recipients.length} {recipients.length === 1 ? 'bruker' : 'brukere'} 
            med forfalt opplæring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients summary */}
          <div className="rounded-lg border p-3 space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(courseGroups).map(([courseTitle, courseRecipients]) => (
              <div key={courseTitle}>
                <p className="font-medium text-sm">{courseTitle}</p>
                <div className="pl-4 space-y-1">
                  {courseRecipients.map(r => (
                    <div 
                      key={r.assignmentId} 
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{r.userName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {r.daysOverdue} dager
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* BCC option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useBcc"
              checked={useBcc}
              onCheckedChange={(checked) => setUseBcc(checked as boolean)}
            />
            <Label htmlFor="useBcc" className="text-sm">
              Bruk blindkopi (BCC) for å skjule mottakere
            </Label>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Purringen vil bli loggført i systemet. Du kan se historikk over sendte 
              påminnelser i kursdetaljene.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSendReminder}
            disabled={logReminder.isPending}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {logReminder.isPending ? 'Logger...' : 'Loggfør purring'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
