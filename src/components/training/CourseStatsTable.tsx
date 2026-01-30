import { AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseStats } from '@/hooks/useCourseStats';

interface CourseStatsTableProps {
  courses: CourseStats[] | undefined;
  isLoading: boolean;
  onSelectCourse: (courseId: string) => void;
}

export function CourseStatsTable({ courses, isLoading, onSelectCourse }: CourseStatsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!courses?.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>Ingen publiserte kurs funnet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kurs</TableHead>
          <TableHead className="text-right">Sendt</TableHead>
          <TableHead className="text-right">Fullført</TableHead>
          <TableHead className="text-right">Pågående</TableHead>
          <TableHead className="text-right">Forfalt</TableHead>
          <TableHead className="w-[120px]">Rate</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow 
            key={course.courseId}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectCourse(course.courseId)}
          >
            <TableCell>
              <div className="font-medium">{course.courseTitle}</div>
              <div className="text-sm text-muted-foreground">{course.siteName}</div>
            </TableCell>
            <TableCell className="text-right">{course.totalSent}</TableCell>
            <TableCell className="text-right">
              <span className="text-green-600 font-medium">{course.completed}</span>
              <span className="text-muted-foreground text-sm ml-1">
                ({course.completionRate}%)
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-blue-600">{course.inProgress}</span>
            </TableCell>
            <TableCell className="text-right">
              {course.overdue > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {course.overdue}
                </Badge>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell>
              <Progress 
                value={course.completionRate} 
                className={course.completionRate < 50 ? '[&>div]:bg-destructive' : course.completionRate >= 80 ? '[&>div]:bg-green-600' : ''}
              />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
