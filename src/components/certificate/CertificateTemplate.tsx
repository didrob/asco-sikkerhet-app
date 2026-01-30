import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeLogo } from '@/components/ThemeLogo';

interface CertificateTemplateProps {
  userName: string;
  procedureTitle: string;
  completedAt: string;
  certificateId: string;
  verificationUrl: string;
}

export function CertificateTemplate({
  userName,
  procedureTitle,
  completedAt,
  certificateId,
  verificationUrl,
}: CertificateTemplateProps) {
  return (
    <div className="certificate-container w-full max-w-2xl mx-auto bg-white text-foreground print:shadow-none">
      {/* Certificate border */}
      <div className="border-8 border-primary/20 p-8 print:p-12">
        {/* Inner border */}
        <div className="border-2 border-primary/40 p-8 print:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ThemeLogo className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold tracking-wider text-primary uppercase print:text-4xl">
              Sertifikat
            </h1>
            <div className="mt-2 w-24 h-1 bg-primary mx-auto" />
          </div>

          {/* Body */}
          <div className="text-center space-y-6 my-12">
            <p className="text-muted-foreground">Dette bekrefter at</p>
            
            <h2 className="text-2xl font-semibold text-foreground print:text-3xl">
              {userName}
            </h2>
            
            <p className="text-muted-foreground">har fullført prosedyren</p>
            
            <h3 className="text-xl font-medium text-primary print:text-2xl">
              "{procedureTitle}"
            </h3>
            
            <p className="text-muted-foreground">
              Fullført: {format(new Date(completedAt), 'PPP', { locale: nb })}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
            <div className="text-left">
              <p className="text-xs text-muted-foreground mb-1">Sertifikat-ID</p>
              <p className="font-mono text-sm">{certificateId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="text-center">
              <QRCodeSVG
                value={verificationUrl}
                size={80}
                level="M"
                className="mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">Skann for å verifisere</p>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Utstedt dato</p>
              <p className="text-sm">{format(new Date(), 'dd.MM.yyyy')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
