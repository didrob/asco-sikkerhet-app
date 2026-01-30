import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteTrainingStats {
  siteId: string;
  siteName: string;
  totalUsers: number;
  totalAssignments: number;
  completedCount: number;
  passedCount: number;
  overdueCount: number;
  completionRate: number;
}

export interface OverdueAssignment {
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  dueDate: string;
  daysOverdue: number;
}

export interface RoleComplianceIssue {
  userId: string;
  userName: string;
  role: string;
  siteName: string;
  missingCourses: string[];
}

// Fetch training overview stats per site
export function useTrainingOverview() {
  return useQuery({
    queryKey: ['training_overview'],
    queryFn: async () => {
      // Get all sites
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id, name')
        .eq('active', true);

      if (sitesError) throw sitesError;

      const siteStats: SiteTrainingStats[] = [];
      const today = new Date().toISOString().split('T')[0];

      for (const site of sites || []) {
        // Get users for this site
        const { data: siteUsers } = await supabase
          .from('user_site_assignments')
          .select('user_id')
          .eq('site_id', site.id);

        // Get courses for this site
        const { data: courses } = await supabase
          .from('training_courses')
          .select('id')
          .eq('site_id', site.id)
          .eq('status', 'published');

        if (!courses?.length) {
          siteStats.push({
            siteId: site.id,
            siteName: site.name,
            totalUsers: siteUsers?.length || 0,
            totalAssignments: 0,
            completedCount: 0,
            passedCount: 0,
            overdueCount: 0,
            completionRate: 0,
          });
          continue;
        }

        const courseIds = courses.map(c => c.id);

        // Get assignments for these courses
        const { data: assignments } = await supabase
          .from('training_assignments')
          .select('*')
          .in('course_id', courseIds);

        const totalAssignments = assignments?.length || 0;
        const completedCount = assignments?.filter(a => a.completed_at).length || 0;
        const passedCount = assignments?.filter(a => a.passed === true).length || 0;
        const overdueCount = assignments?.filter(
          a => !a.completed_at && a.due_date && a.due_date < today
        ).length || 0;

        siteStats.push({
          siteId: site.id,
          siteName: site.name,
          totalUsers: siteUsers?.length || 0,
          totalAssignments,
          completedCount,
          passedCount,
          overdueCount,
          completionRate: totalAssignments > 0 
            ? Math.round((completedCount / totalAssignments) * 100) 
            : 0,
        });
      }

      return siteStats;
    },
  });
}

// Fetch overdue assignments
export function useOverdueAssignments(siteId?: string) {
  return useQuery({
    queryKey: ['overdue_assignments', siteId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get courses (optionally filtered by site)
      let coursesQuery = supabase
        .from('training_courses')
        .select('id, title, site_id')
        .eq('status', 'published');

      if (siteId) {
        coursesQuery = coursesQuery.eq('site_id', siteId);
      }

      const { data: courses } = await coursesQuery;
      if (!courses?.length) return [];

      const courseMap = new Map(courses.map(c => [c.id, c]));
      const courseIds = courses.map(c => c.id);

      // Get overdue assignments
      const { data: assignments } = await supabase
        .from('training_assignments')
        .select('*')
        .in('course_id', courseIds)
        .is('completed_at', null)
        .lt('due_date', today);

      if (!assignments?.length) return [];

      // Get user profiles
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return assignments.map(a => {
        const course = courseMap.get(a.course_id);
        const profile = profileMap.get(a.user_id);
        const dueDate = new Date(a.due_date!);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          userId: a.user_id,
          userName: profile?.full_name || 'Ukjent',
          courseId: a.course_id,
          courseTitle: course?.title || 'Ukjent kurs',
          dueDate: a.due_date!,
          daysOverdue,
        } as OverdueAssignment;
      }).sort((a, b) => b.daysOverdue - a.daysOverdue);
    },
  });
}

// Fetch role compliance issues
export function useRoleCompliance(siteId?: string) {
  return useQuery({
    queryKey: ['role_compliance', siteId],
    queryFn: async () => {
      // Get user roles
      let rolesQuery = supabase
        .from('user_roles')
        .select('user_id, role, site_id');

      if (siteId) {
        rolesQuery = rolesQuery.eq('site_id', siteId);
      }

      const { data: userRoles } = await rolesQuery;
      if (!userRoles?.length) return [];

      // Get courses with required_for_roles
      const { data: courses } = await supabase
        .from('training_courses')
        .select('id, title, required_for_roles, site_id')
        .eq('status', 'published')
        .not('required_for_roles', 'eq', '{}');

      if (!courses?.length) return [];

      // Get completed assignments
      const { data: completions } = await supabase
        .from('training_assignments')
        .select('user_id, course_id')
        .eq('passed', true);

      const completionSet = new Set(
        completions?.map(c => `${c.user_id}:${c.course_id}`) || []
      );

      // Get user profiles
      const userIds = [...new Set(userRoles.map(ur => ur.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Get site names
      const siteIds = [...new Set(userRoles.map(ur => ur.site_id))];
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteIds);

      const siteMap = new Map(sites?.map(s => [s.id, s.name]));

      // Check compliance
      const issues: RoleComplianceIssue[] = [];

      for (const userRole of userRoles) {
        const requiredCourses = courses.filter(
          c => c.required_for_roles?.includes(userRole.role) && c.site_id === userRole.site_id
        );

        const missingCourses = requiredCourses.filter(
          c => !completionSet.has(`${userRole.user_id}:${c.id}`)
        );

        if (missingCourses.length > 0) {
          issues.push({
            userId: userRole.user_id,
            userName: profileMap.get(userRole.user_id)?.full_name || 'Ukjent',
            role: userRole.role,
            siteName: siteMap.get(userRole.site_id) || 'Ukjent',
            missingCourses: missingCourses.map(c => c.title),
          });
        }
      }

      return issues;
    },
  });
}
