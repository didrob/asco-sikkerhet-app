import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteContext } from '@/contexts/SiteContext';
import { toast } from 'sonner';

export interface TrainingCourse {
  id: string;
  site_id: string;
  procedure_ids: string[];
  title: string;
  description: string | null;
  training_type: 'theoretical' | 'practical' | 'video' | 'mixed';
  content_blocks: any[];
  pass_threshold: number;
  required_for_roles: string[];
  status: 'draft' | 'published' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  procedures?: Array<{ id: string; title: string }>;
}

export interface TrainingAssignment {
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
  course?: TrainingCourse;
}

// Fetch user's assigned courses
export function useMyTrainingCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my_training_courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_assignments')
        .select(`
          *,
          course:training_courses(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrainingAssignment[];
    },
    enabled: !!user,
  });
}

// Fetch all courses for a site (for managers)
export function useSiteTrainingCourses() {
  const { currentSite } = useSiteContext();

  return useQuery({
    queryKey: ['site_training_courses', currentSite?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('site_id', currentSite!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrainingCourse[];
    },
    enabled: !!currentSite,
  });
}

// Fetch single course with procedures
export function useTrainingCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['training_course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('id', courseId!)
        .single();

      if (error) throw error;

      // Fetch linked procedures
      if (data.procedure_ids?.length) {
        const { data: procedures } = await supabase
          .from('procedures')
          .select('id, title')
          .in('id', data.procedure_ids);
        
        return { ...data, procedures } as TrainingCourse;
      }

      return data as TrainingCourse;
    },
    enabled: !!courseId,
  });
}

// Create course mutation
export function useCreateTrainingCourse() {
  const queryClient = useQueryClient();
  const { currentSite } = useSiteContext();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (course: Omit<Partial<TrainingCourse>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('training_courses')
        .insert({
          title: course.title!,
          site_id: currentSite!.id,
          created_by: user!.id,
          procedure_ids: course.procedure_ids || [],
          description: course.description,
          training_type: course.training_type,
          content_blocks: course.content_blocks || [],
          pass_threshold: course.pass_threshold,
          required_for_roles: course.required_for_roles || [],
          status: course.status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_training_courses'] });
      toast.success('Kurs opprettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke opprette kurs: ' + error.message);
    },
  });
}

// Update course mutation
export function useUpdateTrainingCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingCourse> & { id: string }) => {
      const { data, error } = await supabase
        .from('training_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['site_training_courses'] });
      queryClient.invalidateQueries({ queryKey: ['training_course', data.id] });
      toast.success('Kurs oppdatert');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere kurs: ' + error.message);
    },
  });
}

// Delete course mutation
export function useDeleteTrainingCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_training_courses'] });
      toast.success('Kurs slettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke slette kurs: ' + error.message);
    },
  });
}
