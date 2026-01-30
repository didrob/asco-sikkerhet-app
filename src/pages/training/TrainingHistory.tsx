import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { BookOpen, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useMyTrainingCourses } from '@/hooks/useTraining';

export default function TrainingHistory() {
  const { data: assignments, isLoading } = useMyTrainingCourses();

  const completedCourses = assignments?.filter(a => a.completed_at) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Min opplæringshistorikk</h1>
          <p className="text-muted-foreground">
            Oversikt over gjennomført opplæring.
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
        ) : completedCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((assignment) => (
              <Card key={assignment.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {assignment.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <CardTitle className="text-lg">
                        {assignment.course?.title || 'Ukjent kurs'}
                      </CardTitle>
                    </div>
                    {assignment.passed ? (
                      <Badge variant="default" className="bg-green-600">Bestått</Badge>
                    ) : (
                      <Badge variant="destructive">Ikke bestått</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Fullført {format(new Date(assignment.completed_at!), 'PPP', { locale: nb })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignment.score !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Score</span>
                        <span className="font-medium">{assignment.score}%</span>
                      </div>
                      <Progress 
                        value={assignment.score} 
                        className={assignment.passed ? '' : '[&>div]:bg-destructive'}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/training/${assignment.course_id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Se detaljer
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Ingen gjennomført opplæring</h3>
              <p className="mb-4 text-muted-foreground">
                Du har ikke fullført noen kurs ennå.
              </p>
              <Button asChild>
                <Link to="/training">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Se aktive kurs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
