import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { BookOpen, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useMyTrainingCourses } from '@/hooks/useTraining';

export default function Training() {
  const { data: assignments, isLoading } = useMyTrainingCourses();

  const activeCourses = assignments?.filter(a => !a.completed_at) || [];
  const completedCourses = assignments?.filter(a => a.completed_at) || [];

  const getStatusBadge = (assignment: typeof assignments extends (infer T)[] | undefined ? T : never) => {
    if (assignment.passed === true) {
      return <Badge variant="default" className="bg-green-600">Bestått</Badge>;
    }
    if (assignment.passed === false) {
      return <Badge variant="destructive">Ikke bestått</Badge>;
    }
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return <Badge variant="destructive">Forfalt</Badge>;
    }
    if (assignment.sent_at) {
      return <Badge variant="secondary">Tildelt</Badge>;
    }
    return <Badge variant="outline">Ny</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opplæring</h1>
          <p className="text-muted-foreground">
            Dine tildelte kurs og opplæringsmoduler.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Active Courses */}
            <div>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Aktive kurs ({activeCourses.length})
              </h2>
              
              {activeCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeCourses.map((assignment) => (
                    <Card key={assignment.id} className="relative hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">
                              {assignment.course?.title || 'Ukjent kurs'}
                            </CardTitle>
                          </div>
                          {getStatusBadge(assignment)}
                        </div>
                        <CardDescription>
                          {assignment.course?.description || 'Ingen beskrivelse'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {assignment.due_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Frist: {format(new Date(assignment.due_date), 'PPP', { locale: nb })}
                            </div>
                          )}
                          <Button asChild className="w-full">
                            <Link to={`/training/${assignment.course_id}`}>
                              Start kurs
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Ingen aktive kurs</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Completed Courses */}
            {completedCourses.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Gjennomført ({completedCourses.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedCourses.map((assignment) => (
                    <Card key={assignment.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">
                              {assignment.course?.title || 'Ukjent kurs'}
                            </CardTitle>
                          </div>
                          {getStatusBadge(assignment)}
                        </div>
                        <CardDescription>
                          Fullført {format(new Date(assignment.completed_at!), 'PPP', { locale: nb })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {assignment.score !== null && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Score</span>
                              <span className="font-medium">{assignment.score}%</span>
                            </div>
                            <Progress value={assignment.score} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {assignments?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Ingen opplæring tildelt</h3>
                  <p className="text-muted-foreground">
                    Du har ingen kurs tildelt ennå.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
