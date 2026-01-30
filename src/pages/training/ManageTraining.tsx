import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  BookOpen, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Users, 
  Eye,
  Archive,
  Send
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSiteTrainingCourses, useDeleteTrainingCourse, useUpdateTrainingCourse, TrainingCourse } from '@/hooks/useTraining';

const trainingTypeLabels: Record<string, string> = {
  theoretical: 'Teoretisk',
  practical: 'Praktisk',
  video: 'Video',
  mixed: 'Kombinert',
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-500',
  published: 'bg-green-600',
  archived: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Utkast',
  published: 'Publisert',
  archived: 'Arkivert',
};

export default function ManageTraining() {
  const { data: courses, isLoading } = useSiteTrainingCourses();
  const deleteCourse = useDeleteTrainingCourse();
  const updateCourse = useUpdateTrainingCourse();
  
  const [courseToDelete, setCourseToDelete] = useState<TrainingCourse | null>(null);

  const handlePublish = (course: TrainingCourse) => {
    updateCourse.mutate({ 
      id: course.id, 
      status: course.status === 'published' ? 'draft' : 'published' 
    });
  };

  const handleArchive = (course: TrainingCourse) => {
    updateCourse.mutate({ id: course.id, status: 'archived' });
  };

  const handleDelete = () => {
    if (courseToDelete) {
      deleteCourse.mutate(courseToDelete.id);
      setCourseToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administrer kurs</h1>
            <p className="text-muted-foreground">
              Opprett og administrer opplæringskurs.
            </p>
          </div>
          <Button asChild>
            <Link to="/training/manage/new">
              <Plus className="mr-2 h-4 w-4" />
              Nytt kurs
            </Link>
          </Button>
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
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/training/manage/${course.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rediger
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/training/manage/${course.id}/assign`}>
                            <Send className="mr-2 h-4 w-4" />
                            Tildel brukere
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePublish(course)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {course.status === 'published' ? 'Avpubliser' : 'Publiser'}
                        </DropdownMenuItem>
                        {course.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleArchive(course)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Arkiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setCourseToDelete(course)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{course.description || 'Ingen beskrivelse'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColors[course.status]}>
                      {statusLabels[course.status]}
                    </Badge>
                    <Badge variant="outline">
                      {trainingTypeLabels[course.training_type]}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Opprettet {format(new Date(course.created_at), 'PPP', { locale: nb })}
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
              <h3 className="mb-2 text-lg font-semibold">Ingen kurs opprettet</h3>
              <p className="mb-4 text-muted-foreground">
                Kom i gang ved å opprette ditt første opplæringskurs.
              </p>
              <Button asChild>
                <Link to="/training/manage/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Opprett kurs
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kurs</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{courseToDelete?.title}"? 
              Dette vil også slette alle tildelinger og fremgang for kurset.
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
