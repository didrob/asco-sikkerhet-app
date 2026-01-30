import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContext } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TrainingAssignmentWithDetails {
  id: string;
  course_id: string;
  user_id: string;
  group_id: string | null;
  assigned_by: string | null;
  due_date: string | null;
  sent_at: string | null;
  completed_at: string | null;
  passed: boolean | null;
  score: number | null;
  created_at: string;
  course?: {
    id: string;
    title: string;
    training_type: string;
  };
  user?: {
    id: string;
    full_name: string | null;
    job_title: string | null;
  };
}

// Fetch assignments for a course
export function useCourseAssignments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course_assignments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('course_id', courseId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      if (data?.length) {
        const userIds = data.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, job_title')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return data.map(a => ({
          ...a,
          user: profileMap.get(a.user_id),
        })) as TrainingAssignmentWithDetails[];
      }

      return data as TrainingAssignmentWithDetails[];
    },
    enabled: !!courseId,
  });
}

// Fetch all assignments for current site
export function useSiteAssignments() {
  const { currentSite } = useSiteContext();

  return useQuery({
    queryKey: ['site_assignments', currentSite?.id],
    queryFn: async () => {
      // First get courses for this site
      const { data: courses, error: coursesError } = await supabase
        .from('training_courses')
        .select('id, title, training_type')
        .eq('site_id', currentSite!.id);

      if (coursesError) throw coursesError;

      if (!courses?.length) return [];

      const courseIds = courses.map(c => c.id);
      const courseMap = new Map(courses.map(c => [c.id, c]));

      // Get assignments for these courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from('training_assignments')
        .select('*')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (!assignments?.length) return [];

      // Fetch user profiles
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, job_title')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return assignments.map(a => ({
        ...a,
        course: courseMap.get(a.course_id),
        user: profileMap.get(a.user_id),
      })) as TrainingAssignmentWithDetails[];
    },
    enabled: !!currentSite,
  });
}

// Create assignments for multiple users
export function useCreateAssignments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      userIds,
      groupId,
      dueDate,
    }: {
      courseId: string;
      userIds: string[];
      groupId?: string;
      dueDate?: string;
    }) => {
      const { error } = await supabase
        .from('training_assignments')
        .upsert(
          userIds.map(userId => ({
            course_id: courseId,
            user_id: userId,
            group_id: groupId || null,
            assigned_by: user!.id,
            due_date: dueDate || null,
          })),
          { onConflict: 'course_id,user_id' }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course_assignments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['site_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my_training_courses'] });
      toast.success(`${variables.userIds.length} brukere tildelt kurset`);
    },
    onError: (error) => {
      toast.error('Kunne ikke tildele kurs: ' + error.message);
    },
  });
}

// Mark assignment as sent
export function useMarkAssignmentsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentIds: string[]) => {
      const { error } = await supabase
        .from('training_assignments')
        .update({ sent_at: new Date().toISOString() })
        .in('id', assignmentIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['site_assignments'] });
      toast.success('Tildelinger merket som sendt');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere tildelinger: ' + error.message);
    },
  });
}

// Update assignment (completion, score, etc.)
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      completed_at?: string;
      passed?: boolean;
      score?: number;
    }) => {
      const { data, error } = await supabase
        .from('training_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course_assignments', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['site_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my_training_courses'] });
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere tildeling: ' + error.message);
    },
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('training_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course_assignments', courseId] });
      queryClient.invalidateQueries({ queryKey: ['site_assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my_training_courses'] });
      toast.success('Tildeling slettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke slette tildeling: ' + error.message);
    },
  });
}
