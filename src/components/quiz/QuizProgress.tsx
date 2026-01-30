import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuizProgressProps {
  current: number;
  total: number;
  streak: number;
  score: number;
  className?: string;
}

export function QuizProgress({ current, total, streak, score, className }: QuizProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress dots and counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: i < current ? 1 : 0.8,
                opacity: i < current ? 1 : 0.5
              }}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                i < current ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
          {total > 10 && (
            <span className="ml-1 text-xs text-muted-foreground">+{total - 10}</span>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Spørsmål {Math.min(current + 1, total)}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm">
        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-orange-500"
          >
            <span className="text-lg">🔥</span>
            <span className="font-bold">{streak} på rad!</span>
          </motion.div>
        )}
        {streak === 0 && <div />}

        {/* Score */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-lg">⭐</span>
          <span className="font-medium">{score} poeng</span>
        </div>
      </div>
    </div>
  );
}
