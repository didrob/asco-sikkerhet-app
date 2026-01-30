import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate';
import { useCompletion } from '@/hooks/useCompletions';
import { useProfile } from '@/hooks/useProfile';

export default function CertificateViewer() {
  const { id } = useParams<{ id: string }>();
  const { data: completion, isLoading: completionLoading } = useCompletion(id || null);
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isLoading = completionLoading || profileLoading;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full max-w-2xl mx-auto" />
        </div>
      </AppLayout>
    );
  }

  if (!completion || !profile) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Sertifikat ikke funnet</h2>
          <p className="text-muted-foreground mb-4">
            Sertifikatet du leter etter finnes ikke eller du har ikke tilgang.
          </p>
          <Button asChild>
            <Link to="/certificates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake til sertifikater
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const verificationUrl = `${window.location.origin}/verify/${completion.id}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header - hidden when printing */}
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" asChild>
            <Link to="/certificates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Skriv ut / Last ned PDF
            </Button>
          </div>
        </div>

        {/* Certificate - styled for print */}
        <div className="print:mt-0">
          <CertificateTemplate
            userName={profile.full_name || 'Ukjent bruker'}
            procedureTitle={completion.procedure?.title || 'Ukjent prosedyre'}
            completedAt={completion.completed_at}
            certificateId={completion.id}
            verificationUrl={verificationUrl}
          />
        </div>

        {/* Print instructions - hidden when printing */}
        <p className="text-center text-sm text-muted-foreground print:hidden">
          Bruk "Skriv ut" og velg "Lagre som PDF" for å laste ned sertifikatet.
        </p>
      </div>
    </AppLayout>
  );
}
