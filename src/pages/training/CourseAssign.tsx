import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Users, Send, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmailComposer } from '@/components/training/EmailComposer';
import { useTrainingCourse } from '@/hooks/useTraining';
import { useTrainingGroups, type TrainingGroup } from '@/hooks/useTrainingGroups';
import { useCourseAssignments, useCreateAssignments, useMarkAssignmentsSent } from '@/hooks/useTrainingAssignments';
import { useSiteContext } from '@/contexts/SiteContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function useSiteUsersWithEmail(siteId: string | undefined) {
  return useQuery({
    queryKey: ['site_users_email', siteId],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('user_site_assignments')
        .select('user_id')
        .eq('site_id', siteId!);
      if (!assignments?.length) return [];

      const userIds = assignments.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, department')
        .in('id', userIds);

      // We don't have email in profiles, but assignments reference user_id
      // Email would need to come from auth.users which we can't query directly
      // For now, return profiles without email (EmailComposer handles this)
      return (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        job_title: p.job_title,
        department: p.department,
        email: '', // Would need edge function to get email
      }));
    },
    enabled: !!siteId,
  });
}

const trainingTypeLabels: Record<string, string> = {
  theoretical: 'Teoretisk',
  practical: 'Praktisk',
  video: 'Video',
  mixed: 'Kombinert',
};

export default function CourseAssign() {
  const { id: courseId } = useParams<{ id: string }>();
  const { currentSite } = useSiteContext();
  const { data: course, isLoading: courseLoading } = useTrainingCourse(courseId);
  const { data: groups } = useTrainingGroups();
  const { data: assignments } = useCourseAssignments(courseId);
  const { data: siteUsers } = useSiteUsersWithEmail(currentSite?.id);
  const createAssignments = useCreateAssignments();
  const markSent = useMarkAssignmentsSent();

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [userSearch, setUserSearch] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const courseLink = `${window.location.origin}/training/${courseId}/play`;

  const filteredUsers = (siteUsers || []).filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.job_title?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleGroup = (gid: string) => {
    setSelectedGroupIds(prev => prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]);
  };

  const toggleUser = (uid: string) => {
    setSelectedUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(courseLink);
    setLinkCopied(true);
    toast.success('Kurslenke kopiert!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Collect all user IDs to assign (from groups + individual)
  const allUserIdsToAssign = useMemo(() => {
    const ids = new Set(selectedUserIds);
    selectedGroupIds.forEach(gid => {
      const group = groups?.find(g => g.id === gid);
      group?.members?.forEach((m: any) => ids.add(m.user_id));
    });
    return Array.from(ids);
  }, [selectedGroupIds, selectedUserIds, groups]);

  const handleAssign = () => {
    if (!courseId || allUserIdsToAssign.length === 0) return;
    createAssignments.mutate({
      courseId,
      userIds: allUserIdsToAssign,
      dueDate: dueDate?.toISOString(),
    });
  };

  if (courseLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  const selectedGroups = (groups || []).filter(g => selectedGroupIds.includes(g.id));
  const selectedUsersForEmail = (siteUsers || []).filter(u => selectedUserIds.includes(u.id));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/training/manage">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Tildel kurs</h1>
            <p className="text-muted-foreground">{course?.title}</p>
          </div>
          <Badge variant="outline">{trainingTypeLabels[course?.training_type || '']}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Link */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Kurslenke</CardTitle>
                <CardDescription>Del denne lenken direkte i Teams, Slack eller andre kanaler.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={courseLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={copyLink}>
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Velg grupper
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groups && groups.length > 0 ? (
                  <div className="divide-y border rounded-lg">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={selectedGroupIds.includes(group.id)}
                          onCheckedChange={() => toggleGroup(group.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen grupper opprettet ennå.</p>
                )}
              </CardContent>
            </Card>

            {/* Individual users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enkeltbrukere</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Søk etter brukere..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto divide-y border rounded-lg">
                  {filteredUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || 'Ukjent'}</p>
                        <p className="text-xs text-muted-foreground">{user.job_title || ''}</p>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground text-center">Ingen brukere funnet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Due date + Assign */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Frist (valgfritt)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left', !dueDate && 'text-muted-foreground')}>
                        <Clock className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP', { locale: nb }) : 'Velg frist...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <Separator />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAssign}
                  disabled={allUserIdsToAssign.length === 0 || createAssignments.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Tildel {allUserIdsToAssign.length} bruker{allUserIdsToAssign.length !== 1 ? 'e' : ''}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Email + existing assignments */}
          <div className="space-y-6">
            {course && (
              <EmailComposer
                course={course}
                selectedGroups={selectedGroups}
                selectedUsers={selectedUsersForEmail}
                dueDate={dueDate}
                onSent={() => {
                  const unsentIds = assignments?.filter(a => !a.sent_at).map(a => a.id) || [];
                  if (unsentIds.length) markSent.mutate(unsentIds);
                }}
              />
            )}

            {/* Existing assignments */}
            {assignments && assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Eksisterende tildelinger</CardTitle>
                  <CardDescription>{assignments.length} tildelinger</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bruker</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="text-sm">
                              {a.user?.full_name || 'Ukjent'}
                            </TableCell>
                            <TableCell>
                              {a.completed_at ? (
                                <Badge variant={a.passed ? 'default' : 'destructive'} className="text-xs">
                                  {a.passed ? 'Bestått' : 'Ikke bestått'}
                                </Badge>
                              ) : a.sent_at ? (
                                <Badge variant="secondary" className="text-xs">Sendt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Tildelt</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
