import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReminderRecord {
  id: string;
  assignmentId: string;
  sentAt: string;
  sentBy: string | null;
  reminderType: string;
}

export function useAssignmentReminders(assignmentIds: string[]) {
  return useQuery({
    queryKey: ['assignment_reminders', assignmentIds],
    enabled: assignmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_reminders')
        .select('*')
        .in('assignment_id', assignmentIds)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return data.map(r => ({
        id: r.id,
        assignmentId: r.assignment_id,
        sentAt: r.sent_at,
        sentBy: r.sent_by,
        reminderType: r.reminder_type,
      })) as ReminderRecord[];
    },
  });
}

export function useLogReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentIds, 
      reminderType = 'overdue' 
    }: { 
      assignmentIds: string[]; 
      reminderType?: string;
    }) => {
      const { data, error } = await supabase
        .from('training_reminders')
        .insert(
          assignmentIds.map(id => ({
            assignment_id: id,
            sent_by: user?.id,
            reminder_type: reminderType,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment_reminders'] });
      queryClient.invalidateQueries({ queryKey: ['course_stats'] });
      queryClient.invalidateQueries({ queryKey: ['course_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['overdue_assignments'] });
    },
  });
}

export function useReminderStats(siteId?: string) {
  return useQuery({
    queryKey: ['reminder_stats', siteId],
    queryFn: async () => {
      // Get courses for site filter
      let coursesQuery = supabase
        .from('training_courses')
        .select('id')
        .eq('status', 'published');

      if (siteId) {
        coursesQuery = coursesQuery.eq('site_id', siteId);
      }

      const { data: courses } = await coursesQuery;
      if (!courses?.length) return { total: 0, thisWeek: 0 };

      const courseIds = courses.map(c => c.id);

      // Get assignments for these courses
      const { data: assignments } = await supabase
        .from('training_assignments')
        .select('id')
        .in('course_id', courseIds);

      if (!assignments?.length) return { total: 0, thisWeek: 0 };

      const assignmentIds = assignments.map(a => a.id);

      // Get all reminders
      const { data: reminders } = await supabase
        .from('training_reminders')
        .select('sent_at')
        .in('assignment_id', assignmentIds);

      if (!reminders?.length) return { total: 0, thisWeek: 0 };

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString();

      const thisWeek = reminders.filter(r => r.sent_at >= weekAgoStr).length;

      return {
        total: reminders.length,
        thisWeek,
      };
    },
  });
}
