import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  siteId: string;
  siteName: string;
  totalSent: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  remindersSent: number;
  completionRate: number;
}

export interface CourseAssignmentDetail {
  assignmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'completed' | 'in_progress' | 'overdue' | 'not_started';
  score?: number | null;
  completedAt?: string | null;
  dueDate?: string | null;
  daysOverdue?: number;
  reminderCount: number;
}

export function useCourseStats(siteId?: string) {
  return useQuery({
    queryKey: ['course_stats', siteId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get courses
      let coursesQuery = supabase
        .from('training_courses')
        .select('id, title, site_id')
        .eq('status', 'published');

      if (siteId) {
        coursesQuery = coursesQuery.eq('site_id', siteId);
      }

      const { data: courses, error: coursesError } = await coursesQuery;
      if (coursesError) throw coursesError;
      if (!courses?.length) return [];

      // Get site names
      const siteIds = [...new Set(courses.map(c => c.site_id))];
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteIds);

      const siteMap = new Map(sites?.map(s => [s.id, s.name]) || []);

      // Get all assignments for these courses
      const courseIds = courses.map(c => c.id);
      const { data: assignments } = await supabase
        .from('training_assignments')
        .select('*')
        .in('course_id', courseIds);

      // Get progress data to identify in-progress
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: progressData } = await supabase
        .from('training_progress')
        .select('assignment_id')
        .in('assignment_id', assignmentIds);

      const progressSet = new Set(progressData?.map(p => p.assignment_id) || []);

      // Get reminder counts per assignment
      const { data: reminders } = await supabase
        .from('training_reminders')
        .select('assignment_id')
        .in('assignment_id', assignmentIds);

      const reminderCounts = new Map<string, number>();
      reminders?.forEach(r => {
        reminderCounts.set(r.assignment_id, (reminderCounts.get(r.assignment_id) || 0) + 1);
      });

      // Calculate stats per course
      const courseStats: CourseStats[] = courses.map(course => {
        const courseAssignments = assignments?.filter(a => a.course_id === course.id) || [];
        const totalSent = courseAssignments.length;
        
        let completed = 0;
        let inProgress = 0;
        let overdue = 0;
        let notStarted = 0;
        let totalReminders = 0;

        courseAssignments.forEach(a => {
          totalReminders += reminderCounts.get(a.id) || 0;

          if (a.completed_at) {
            completed++;
          } else if (a.due_date && a.due_date < today) {
            overdue++;
          } else if (progressSet.has(a.id)) {
            inProgress++;
          } else {
            notStarted++;
          }
        });

        return {
          courseId: course.id,
          courseTitle: course.title,
          siteId: course.site_id,
          siteName: siteMap.get(course.site_id) || 'Ukjent',
          totalSent,
          completed,
          inProgress,
          overdue,
          notStarted,
          remindersSent: totalReminders,
          completionRate: totalSent > 0 ? Math.round((completed / totalSent) * 100) : 0,
        };
      });

      return courseStats;
    },
  });
}

export function useCourseAssignments(courseId: string | null) {
  return useQuery({
    queryKey: ['course_assignments', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return [];

      const today = new Date().toISOString().split('T')[0];

      // Get assignments
      const { data: assignments, error } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      if (!assignments?.length) return [];

      // Get user profiles
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get user emails from auth (we'll use a workaround - get from assignments context)
      // Since we can't query auth.users directly, we'll display user name only

      // Get progress data
      const assignmentIds = assignments.map(a => a.id);
      const { data: progressData } = await supabase
        .from('training_progress')
        .select('assignment_id')
        .in('assignment_id', assignmentIds);

      const progressSet = new Set(progressData?.map(p => p.assignment_id) || []);

      // Get reminder counts
      const { data: reminders } = await supabase
        .from('training_reminders')
        .select('assignment_id')
        .in('assignment_id', assignmentIds);

      const reminderCounts = new Map<string, number>();
      reminders?.forEach(r => {
        reminderCounts.set(r.assignment_id, (reminderCounts.get(r.assignment_id) || 0) + 1);
      });

      // Build assignment details
      const details: CourseAssignmentDetail[] = assignments.map(a => {
        const profile = profileMap.get(a.user_id);
        let status: CourseAssignmentDetail['status'];
        let daysOverdue: number | undefined;

        if (a.completed_at) {
          status = 'completed';
        } else if (a.due_date && a.due_date < today) {
          status = 'overdue';
          daysOverdue = Math.floor(
            (Date.now() - new Date(a.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );
        } else if (progressSet.has(a.id)) {
          status = 'in_progress';
        } else {
          status = 'not_started';
        }

        return {
          assignmentId: a.id,
          userId: a.user_id,
          userName: profile?.full_name || 'Ukjent bruker',
          userEmail: '', // Would need additional lookup
          status,
          score: a.score,
          completedAt: a.completed_at,
          dueDate: a.due_date,
          daysOverdue,
          reminderCount: reminderCounts.get(a.id) || 0,
        };
      });

      // Sort: overdue first, then by days overdue desc, then others
      return details.sort((a, b) => {
        const statusOrder = { overdue: 0, in_progress: 1, not_started: 2, completed: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        if (a.status === 'overdue' && b.status === 'overdue') {
          return (b.daysOverdue || 0) - (a.daysOverdue || 0);
        }
        return 0;
      });
    },
  });
}

export function useInProgressAssignments(siteId?: string) {
  return useQuery({
    queryKey: ['in_progress_assignments', siteId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get courses
      let coursesQuery = supabase
        .from('training_courses')
        .select('id, title')
        .eq('status', 'published');

      if (siteId) {
        coursesQuery = coursesQuery.eq('site_id', siteId);
      }

      const { data: courses } = await coursesQuery;
      if (!courses?.length) return [];

      const courseIds = courses.map(c => c.id);
      const courseMap = new Map(courses.map(c => [c.id, c.title]));

      // Get incomplete assignments that have progress
      const { data: assignments } = await supabase
        .from('training_assignments')
        .select('*')
        .in('course_id', courseIds)
        .is('completed_at', null);

      if (!assignments?.length) return [];

      // Filter to only those with progress
      const assignmentIds = assignments.map(a => a.id);
      const { data: progressData } = await supabase
        .from('training_progress')
        .select('assignment_id, started_at')
        .in('assignment_id', assignmentIds);

      const progressMap = new Map(progressData?.map(p => [p.assignment_id, p.started_at]) || []);
      
      const inProgressAssignments = assignments.filter(a => 
        progressMap.has(a.id) && (!a.due_date || a.due_date >= today)
      );

      // Get user profiles
      const userIds = [...new Set(inProgressAssignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return inProgressAssignments.map(a => {
        const startedAt = progressMap.get(a.id);
        const daysStarted = startedAt 
          ? Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        const daysUntilDue = a.due_date
          ? Math.floor((new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          assignmentId: a.id,
          userId: a.user_id,
          userName: profileMap.get(a.user_id) || 'Ukjent',
          courseId: a.course_id,
          courseTitle: courseMap.get(a.course_id) || 'Ukjent kurs',
          startedAt,
          daysStarted,
          dueDate: a.due_date,
          daysUntilDue,
        };
      }).sort((a, b) => (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999));
    },
  });
}
