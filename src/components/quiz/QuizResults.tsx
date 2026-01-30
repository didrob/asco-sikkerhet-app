import { motion } from 'framer-motion';
import { Trophy, Medal, Award, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMasteryLevel, getMasteryLabel, getMasteryColor, type QuizState } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizResultsProps {
  state: QuizState;
  totalPossiblePoints: number;
  onRestart: () => void;
  onComplete: () => void;
  passThreshold?: number; // Percentage required to pass
}

export function QuizResults({ 
  state, 
  totalPossiblePoints, 
  onRestart, 
  onComplete,
  passThreshold = 70 
}: QuizResultsProps) {
  const scorePercent = totalPossiblePoints > 0 
    ? Math.round((state.score / totalPossiblePoints) * 100) 
    : 0;
  
  const passed = scorePercent >= passThreshold;
  const masteryLevel = getMasteryLevel(scorePercent);
  const masteryLabel = getMasteryLabel(masteryLevel);
  const masteryColor = getMasteryColor(masteryLevel);

  const correctCount = state.answers.filter(a => a.isCorrect).length;
  const totalQuestions = state.answers.length;

  const duration = state.completedAt && state.startedAt
    ? Math.round((state.completedAt.getTime() - state.startedAt.getTime()) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getMasteryIcon = () => {
    switch (masteryLevel) {
      case 'gold': return <Trophy className="h-16 w-16 text-yellow-500" />;
      case 'silver': return <Medal className="h-16 w-16 text-gray-400" />;
      case 'bronze': return <Award className="h-16 w-16 text-orange-600" />;
      default: return <Award className="h-16 w-16 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-md text-center"
    >
      {/* Trophy/Badge Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="mb-6"
      >
        {getMasteryIcon()}
      </motion.div>

      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className={cn('text-3xl font-bold', masteryColor)}>
          {masteryLabel}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {passed ? 'Gratulerer, du har bestått!' : 'Prøv igjen for å bestå.'}
        </p>
      </motion.div>

      {/* Score Circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="relative mx-auto my-8 h-40 w-40"
      >
        {/* Background circle */}
        <svg className="h-full w-full -rotate-90 transform">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={cn(
              passed ? 'text-green-500' : 'text-red-500'
            )}
            strokeDasharray={440}
            initial={{ strokeDashoffset: 440 }}
            animate={{ strokeDashoffset: 440 - (440 * scorePercent) / 100 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-4xl font-bold"
          >
            {scorePercent}%
          </motion.span>
          <span className="text-sm text-muted-foreground">
            {state.score}/{totalPossiblePoints} poeng
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8 grid grid-cols-3 gap-4"
      >
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-bold text-primary">{correctCount}/{totalQuestions}</p>
          <p className="text-xs text-muted-foreground">Riktige svar</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-bold text-orange-500">{state.maxStreak}</p>
          <p className="text-xs text-muted-foreground">Beste streak</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-bold">{formatDuration(duration)}</p>
          <p className="text-xs text-muted-foreground">Tid brukt</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Prøv igjen
        </Button>
        <Button onClick={onComplete} className="gap-2">
          {passed ? 'Fullfør' : 'Fortsett likevel'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
