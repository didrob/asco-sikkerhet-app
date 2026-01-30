import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useProcedureAttachments, 
  useUploadAttachment, 
  useDeleteAttachment,
  getAttachmentUrl,
  formatFileSize,
} from '@/hooks/useProcedureAttachments';
import { Upload, Eye, Trash2, FileText, FileSpreadsheet, FileImage, Film, File } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AttachmentsSectionProps {
  procedureId: string | undefined;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-4 w-4" />;
  
  if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  }
  if (fileType.includes('image')) {
    return <FileImage className="h-4 w-4 text-blue-500" />;
  }
  if (fileType.includes('video')) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  return <File className="h-4 w-4" />;
}

export function AttachmentsSection({ procedureId }: AttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useProcedureAttachments(procedureId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && procedureId) {
      await uploadAttachment.mutateAsync({ procedureId, file });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (id: string, filePath: string) => {
    if (procedureId) {
      deleteAttachment.mutate({ id, filePath, procedureId });
    }
  };

  const handleView = (filePath: string) => {
    const url = getAttachmentUrl(filePath);
    window.open(url, '_blank');
  };

  if (!procedureId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Lagre prosedyren først for å kunne legge til vedlegg.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadAttachment.isPending ? 'Laster opp...' : 'Last opp vedlegg'}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Tillatte filtyper: PDF, Word, Excel, PowerPoint, bilder og video. Maks 50MB.
        </p>
      </div>

      {/* Attachments table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fil</TableHead>
              <TableHead>Størrelse</TableHead>
              <TableHead>Lastet opp</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachments.map((attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(attachment.file_type)}
                    <span className="font-medium">{attachment.file_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(attachment.uploaded_at), 'd. MMM yyyy', { locale: nb })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(attachment.file_path)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett vedlegg</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil slette "{attachment.file_name}"? 
                            Denne handlingen kan ikke angres.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment.id, attachment.file_path)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Slett
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Ingen vedlegg ennå. Last opp filer som skal tilhøre denne prosedyren.
          </p>
        </div>
      )}
    </div>
  );
}
