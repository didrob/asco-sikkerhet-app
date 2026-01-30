import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Procedure = Tables<'procedures'>;

export interface ProcedureWithMetadata extends Procedure {
  attachment_count: number;
  comment_count: number;
  last_revision?: {
    version: string;
    created_at: string;
    changed_by: string | null;
  } | null;
}

export function useProcedures(siteId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['procedures-list', siteId, user?.id],
    queryFn: async () => {
      // Fetch procedures for the site (both published and drafts for managers)
      const { data: procedures, error: proceduresError } = await supabase
        .from('procedures')
        .select('*')
        .eq('site_id', siteId!)
        .order('updated_at', { ascending: false });

      if (proceduresError) throw proceduresError;

      if (!procedures || procedures.length === 0) {
        return [];
      }

      const procedureIds = procedures.map(p => p.id);

      // Fetch attachment counts
      const { data: attachmentCounts, error: attachmentsError } = await supabase
        .from('procedure_attachments')
        .select('procedure_id')
        .in('procedure_id', procedureIds);

      if (attachmentsError) throw attachmentsError;

      // Fetch comment counts (only open comments)
      const { data: commentCounts, error: commentsError } = await supabase
        .from('procedure_comments')
        .select('procedure_id')
        .in('procedure_id', procedureIds)
        .is('parent_id', null); // Only count top-level comments

      if (commentsError) throw commentsError;

      // Fetch latest revisions
      const { data: revisions, error: revisionsError } = await supabase
        .from('procedure_revisions')
        .select('procedure_id, version, created_at, changed_by')
        .in('procedure_id', procedureIds)
        .order('created_at', { ascending: false });

      if (revisionsError) throw revisionsError;

      // Create count maps
      const attachmentCountMap = new Map<string, number>();
      (attachmentCounts || []).forEach(a => {
        const current = attachmentCountMap.get(a.procedure_id) || 0;
        attachmentCountMap.set(a.procedure_id, current + 1);
      });

      const commentCountMap = new Map<string, number>();
      (commentCounts || []).forEach(c => {
        const current = commentCountMap.get(c.procedure_id) || 0;
        commentCountMap.set(c.procedure_id, current + 1);
      });

      // Get only the latest revision per procedure
      const latestRevisionMap = new Map<string, { version: string; created_at: string; changed_by: string | null }>();
      (revisions || []).forEach(r => {
        if (!latestRevisionMap.has(r.procedure_id)) {
          latestRevisionMap.set(r.procedure_id, {
            version: r.version,
            created_at: r.created_at || '',
            changed_by: r.changed_by,
          });
        }
      });

      return procedures.map(procedure => ({
        ...procedure,
        attachment_count: attachmentCountMap.get(procedure.id) || 0,
        comment_count: commentCountMap.get(procedure.id) || 0,
        last_revision: latestRevisionMap.get(procedure.id) || null,
      })) as ProcedureWithMetadata[];
    },
    enabled: !!user && !!siteId,
  });
}

export interface ProcedureStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export function useProcedureStats(siteId: string | null) {
  const { data: procedures, isLoading } = useProcedures(siteId);

  const stats: ProcedureStats = {
    total: procedures?.length || 0,
    published: procedures?.filter(p => p.status === 'published').length || 0,
    draft: procedures?.filter(p => p.status === 'draft').length || 0,
    archived: procedures?.filter(p => p.status === 'archived').length || 0,
  };

  return { stats, isLoading };
}

// Get unique categories from procedures
export function useProcedureCategories(siteId: string | null) {
  const { data: procedures } = useProcedures(siteId);
  
  const categories = [...new Set(
    (procedures || [])
      .map(p => p.category)
      .filter((c): c is string => !!c)
  )].sort();

  return categories;
}

// Get unique tags from procedures
export function useProcedureTags(siteId: string | null) {
  const { data: procedures } = useProcedures(siteId);
  
  const tags = [...new Set(
    (procedures || [])
      .flatMap(p => p.tags || [])
      .filter((t): t is string => !!t)
  )].sort();

  return tags;
}
