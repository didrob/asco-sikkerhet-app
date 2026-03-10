import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuizPlayer } from '@/hooks/useQuizPlayer';
import { QuizProgress } from './QuizProgress';
import { QuizResults } from './QuizResults';
import { MultipleChoiceBlockComponent } from './blocks/MultipleChoiceBlock';
import { HotspotBlockComponent } from './blocks/HotspotBlock';
import { SequenceBlockComponent } from './blocks/SequenceBlock';
import { ScenarioBlockComponent } from './blocks/ScenarioBlock';
import type { QuizBlock, QuizState } from '@/types/quiz';

interface QuizPlayerProps {
  blocks: QuizBlock[];
  onComplete?: (state: QuizState) => void;
  passThreshold?: number;
}

export function QuizPlayer({ blocks, onComplete, passThreshold = 70 }: QuizPlayerProps) {
  const [blockStartTime, setBlockStartTime] = useState<Date>(new Date());

  const {
    state,
    currentBlock,
    currentIndex,
    totalBlocks,
    isComplete,
    scorePercent,
    submitAnswer,
    goToNext,
    restart,
  } = useQuizPlayer({
    blocks,
    onComplete,
  });

  const handleAnswer = useCallback((answer: string | string[]) => {
    return submitAnswer(answer, blockStartTime);
  }, [submitAnswer, blockStartTime]);

  const handleNext = useCallback(() => {
    setBlockStartTime(new Date());
    goToNext();
  }, [goToNext]);

  const handleRestart = useCallback(() => {
    setBlockStartTime(new Date());
    restart();
  }, [restart]);

  const handleComplete = useCallback(() => {
    onComplete?.(state);
  }, [onComplete, state]);

  const totalPossiblePoints = blocks.reduce((sum, b) => sum + b.points, 0);

  if (isComplete) {
    return (
      <div className="px-4 py-8">
        <QuizResults
          state={state}
          totalPossiblePoints={totalPossiblePoints}
          onRestart={handleRestart}
          onComplete={handleComplete}
          passThreshold={passThreshold}
        />
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Ingen spørsmål tilgjengelig.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Progress Bar */}
      <QuizProgress
        current={currentIndex}
        total={totalBlocks}
        streak={state.streak}
        score={state.score}
      />

      {/* Current Block */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlock.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {renderBlock(currentBlock, handleAnswer, handleNext)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function renderBlock(
  block: QuizBlock,
  onAnswer: (answer: string | string[]) => { isCorrect: boolean; pointsEarned: number } | undefined,
  onNext: () => void
) {
  switch (block.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceBlockComponent
          block={block}
          onAnswer={(id) => onAnswer(id)}
          onNext={onNext}
        />
      );
    
    case 'hotspot':
      return (
        <HotspotBlockComponent
          block={block}
          onAnswer={(zoneId) => onAnswer(zoneId)}
          onNext={onNext}
        />
      );
    
    case 'sequence':
      return (
        <SequenceBlockComponent
          block={block}
          onAnswer={(ids) => onAnswer(ids)}
          onNext={onNext}
        />
      );
    
    case 'scenario':
      return (
        <ScenarioBlockComponent
          block={block}
          onAnswer={(id) => onAnswer(id)}
          onNext={onNext}
        />
      );
    
    // TODO: Add more block types as they're implemented
    // case 'video_checkpoint':
    // case 'match':
    
    default:
      return (
        <div className="text-center text-muted-foreground">
          Oppgavetype "{(block as QuizBlock).type}" er ikke støttet ennå.
        </div>
      );
  }
}
