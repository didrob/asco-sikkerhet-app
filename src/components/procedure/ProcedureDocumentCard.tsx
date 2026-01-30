import { Link } from 'react-router-dom';
import { FileText, Paperclip, MessageSquare, Calendar, Tag, Edit, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProcedureWithMetadata } from '@/hooks/useProcedures';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ExportMenu } from './ExportMenu';

interface ProcedureDocumentCardProps {
  procedure: ProcedureWithMetadata;
  canManage?: boolean;
}

const statusConfig = {
  draft: {
    label: 'Utkast',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  published: {
    label: 'Publisert',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  archived: {
    label: 'Arkivert',
    variant: 'outline' as const,
    className: 'bg-muted text-muted-foreground',
  },
};

export function ProcedureDocumentCard({ procedure, canManage = false }: ProcedureDocumentCardProps) {
  const status = statusConfig[procedure.status] || statusConfig.draft;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Document number and title row */}
            <div className="flex items-center gap-3 mb-1">
              {procedure.document_number && (
                <span className="text-sm font-mono font-semibold text-primary">
                  {procedure.document_number}
                </span>
              )}
              <Link 
                to={`/procedures/${procedure.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors truncate"
              >
                {procedure.title}
              </Link>
            </div>
            
            {/* Category and version row */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {procedure.category && (
                <span className="font-medium">{procedure.category}</span>
              )}
              {procedure.version && (
                <span>v{procedure.version}</span>
              )}
            </div>
            
            {/* Description */}
            {procedure.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {procedure.description}
              </p>
            )}
          </div>

          {/* Status badge */}
          <Badge className={status.className}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags */}
        {procedure.tags && procedure.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {procedure.tags.slice(0, 4).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
            {procedure.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{procedure.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          {procedure.review_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Revisjon: {format(new Date(procedure.review_date), 'd. MMM yyyy', { locale: nb })}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            <span>{procedure.attachment_count} vedlegg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{procedure.comment_count} kommentarer</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link to={`/procedures/${procedure.id}`}>
              <Eye className="mr-1.5 h-4 w-4" />
              Åpne
            </Link>
          </Button>
          
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/procedures/edit/${procedure.id}`}>
                <Edit className="mr-1.5 h-4 w-4" />
                Rediger
              </Link>
            </Button>
          )}

          <ExportMenu 
            procedure={{
              id: procedure.id,
              title: procedure.title,
              description: procedure.description || undefined,
              category: procedure.category || undefined,
              version: procedure.version || undefined,
              documentNumber: procedure.document_number || undefined,
              reviewDate: procedure.review_date || undefined,
              tags: procedure.tags || undefined,
              contentBlocks: Array.isArray(procedure.content_blocks) 
                ? (procedure.content_blocks as { id: string; type: string; content: Record<string, unknown> }[])
                : [],
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
