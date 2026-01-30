import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import type { QuizBlock, QuizState } from '@/types/quiz';
import { toast } from 'sonner';

export default function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Mangler kurs-ID');

      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch user's assignment for this course
  const { data: assignment } = useQuery({
    queryKey: ['assignment', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return null;

      const { data, error } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id,
  });

  // Complete course mutation
  const completeMutation = useMutation({
    mutationFn: async (state: QuizState) => {
      if (!assignment || !user?.id) return;

      const totalPossible = quizBlocks.reduce((sum, b) => sum + b.points, 0);
      const scorePercent = totalPossible > 0 
        ? Math.round((state.score / totalPossible) * 100) 
        : 0;
      const passed = scorePercent >= (course?.pass_threshold || 70);

      const { error } = await supabase
        .from('training_assignments')
        .update({
          completed_at: new Date().toISOString(),
          score: scorePercent,
          passed,
        })
        .eq('id', assignment.id);

      if (error) throw error;

      return { passed, scorePercent };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training'] });

      if (result?.passed) {
        toast.success('Gratulerer!', {
          description: `Du har bestått kurset med ${result.scorePercent}%.`,
        });
      } else {
        toast.info('Kurs fullført', {
          description: `Du fikk ${result?.scorePercent}%, men bestod ikke denne gangen.`,
        });
      }
    },
    onError: (error) => {
      console.error('Error completing course:', error);
      toast.error('Kunne ikke lagre resultatet');
    },
  });

  // Parse quiz blocks from course content
  const quizBlocks: QuizBlock[] = (() => {
    if (!course?.content_blocks) return [];
    
    try {
      const blocks = course.content_blocks as unknown as Record<string, unknown>[];
      if (!Array.isArray(blocks)) return [];
      
      // Filter for quiz block types
      const validTypes = ['multiple_choice', 'hotspot', 'sequence', 'scenario', 'video_checkpoint', 'match'];
      return blocks
        .filter(block => typeof block === 'object' && block !== null && validTypes.includes(block.type as string))
        .map(block => block as unknown as QuizBlock);
    } catch {
      return [];
    }
  })();

  const handleComplete = (state: QuizState) => {
    completeMutation.mutate(state);
    // Navigate back after a short delay
    setTimeout(() => {
      navigate('/training');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Kurset ble ikke funnet.</p>
        <Button variant="outline" onClick={() => navigate('/training')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til opplæring
        </Button>
      </div>
    );
  }

  if (quizBlocks.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Dette kurset har ingen quiz-oppgaver.</p>
        <Button variant="outline" onClick={() => navigate('/training')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til opplæring
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/training')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold line-clamp-1">{course.title}</h1>
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="mx-auto max-w-2xl">
        <QuizPlayer
          blocks={quizBlocks}
          onComplete={handleComplete}
          passThreshold={course.pass_threshold || 70}
        />
      </main>
    </div>
  );
}
