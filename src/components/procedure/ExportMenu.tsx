import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File } from 'lucide-react';
import { exportToPDF } from '@/lib/pdf-export';
import { exportToWord } from '@/lib/word-export';
import { useToast } from '@/hooks/use-toast';
import { useProcedureAttachments } from '@/hooks/useProcedureAttachments';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

interface ExportMenuProps {
  procedure: {
    id?: string;
    title: string;
    description?: string;
    category?: string;
    version?: string;
    documentNumber?: string;
    reviewDate?: string;
    approvedBy?: string;
    approvedAt?: string;
    tags?: string[];
    contentBlocks: ContentBlock[];
  };
}

export function ExportMenu({ procedure }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<'pdf' | 'word' | null>(null);
  const { toast } = useToast();
  const { data: attachments } = useProcedureAttachments(procedure.id);

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    try {
      await exportToPDF({
        ...procedure,
        attachments: attachments || [],
      });
      toast({
        title: 'Eksportert',
        description: 'Prosedyren ble eksportert som PDF.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke eksportere til PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportWord = async () => {
    setIsExporting('word');
    try {
      await exportToWord({
        ...procedure,
        attachments: attachments || [],
      });
      toast({
        title: 'Eksportert',
        description: 'Prosedyren ble eksportert som Word-dokument.',
      });
    } catch (error) {
      console.error('Word export error:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke eksportere til Word.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting !== null}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Eksporterer...' : 'Eksporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting !== null}>
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          Last ned som PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportWord} disabled={isExporting !== null}>
          <File className="mr-2 h-4 w-4 text-blue-500" />
          Last ned som Word (.docx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
