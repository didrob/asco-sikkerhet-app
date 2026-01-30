import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProcedureComments,
  useCreateComment,
  useUpdateCommentStatus,
  useDeleteComment,
  type ProcedureComment,
} from '@/hooks/useProcedureComments';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Reply, Check, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CommentsPanelProps {
  procedureId: string | undefined;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function CommentItem({
  comment,
  procedureId,
  isReply = false,
}: {
  comment: ProcedureComment;
  procedureId: string;
  isReply?: boolean;
}) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const createComment = useCreateComment();
  const updateStatus = useUpdateCommentStatus();
  const deleteComment = useDeleteComment();

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      createComment.mutate(
        {
          procedureId,
          content: replyContent,
          parentId: comment.id,
        },
        {
          onSuccess: () => {
            setReplyContent('');
            setShowReplyForm(false);
          },
        }
      );
    }
  };

  const handleToggleStatus = () => {
    updateStatus.mutate({
      id: comment.id,
      status: comment.status === 'open' ? 'resolved' : 'open',
      procedureId,
    });
  };

  const handleDelete = () => {
    deleteComment.mutate({ id: comment.id, procedureId });
  };

  const isOwner = user?.id === comment.user_id;
  const isResolved = comment.status === 'resolved';

  return (
    <div className={cn('space-y-2', isReply && 'ml-8 border-l-2 border-muted pl-4')}>
      <div className={cn('rounded-lg p-3', isResolved ? 'bg-muted/50' : 'bg-muted')}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(comment.profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.profile?.full_name || 'Ukjent bruker'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), 'd. MMM yyyy, HH:mm', { locale: nb })}
              </span>
              {isResolved && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  Løst
                </Badge>
              )}
            </div>
            <p className={cn('mt-1 text-sm', isResolved && 'text-muted-foreground')}>
              {comment.content}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-2 flex items-center gap-2 pl-11">
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="mr-1 h-3 w-3" />
              Svar
            </Button>
          )}
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleToggleStatus}
            >
              {isResolved ? (
                <>
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Gjenåpne
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Løst
                </>
              )}
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Slett
            </Button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Skriv et svar..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || createComment.isPending}
            >
              {createComment.isPending ? 'Sender...' : 'Svar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              procedureId={procedureId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({ procedureId }: CommentsPanelProps) {
  const { data: comments, isLoading } = useProcedureComments(procedureId);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim() && procedureId) {
      createComment.mutate(
        {
          procedureId,
          content: newComment,
        },
        {
          onSuccess: () => setNewComment(''),
        }
      );
    }
  };

  if (!procedureId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Lagre prosedyren først for å kunne legge til kommentarer.
        </p>
      </div>
    );
  }

  const openComments = comments?.filter((c) => c.status === 'open') || [];
  const resolvedComments = comments?.filter((c) => c.status === 'resolved') || [];

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Legg til en kommentar eller forslag..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || createComment.isPending}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {createComment.isPending ? 'Sender...' : 'Legg til kommentar'}
        </Button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-6">
          {/* Open comments */}
          {openComments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Åpne kommentarer ({openComments.length})
              </h4>
              {openComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  procedureId={procedureId}
                />
              ))}
            </div>
          )}

          {/* Resolved comments */}
          {resolvedComments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Løste kommentarer ({resolvedComments.length})
              </h4>
              {resolvedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  procedureId={procedureId}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Ingen kommentarer ennå. Vær den første til å legge til en kommentar.
          </p>
        </div>
      )}
    </div>
  );
}
