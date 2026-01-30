import { useState, useCallback } from 'react';
import type { QuizBlock, QuizAnswer, QuizState, MasteryLevel, getMasteryLevel } from '@/types/quiz';

interface UseQuizPlayerProps {
  blocks: QuizBlock[];
  onComplete?: (state: QuizState) => void;
}

export function useQuizPlayer({ blocks, onComplete }: UseQuizPlayerProps) {
  const [state, setState] = useState<QuizState>({
    currentBlockIndex: 0,
    answers: [],
    score: 0,
    streak: 0,
    maxStreak: 0,
    startedAt: new Date(),
  });

  const currentBlock = blocks[state.currentBlockIndex] || null;
  const totalBlocks = blocks.length;
  const progress = totalBlocks > 0 ? ((state.currentBlockIndex + 1) / totalBlocks) * 100 : 0;
  const isComplete = state.currentBlockIndex >= totalBlocks;

  const totalPossiblePoints = blocks.reduce((sum, block) => sum + block.points, 0);
  const scorePercent = totalPossiblePoints > 0 ? (state.score / totalPossiblePoints) * 100 : 0;

  const submitAnswer = useCallback((answer: string | string[], blockStartTime?: Date) => {
    if (!currentBlock) return;

    const isCorrect = checkAnswer(currentBlock, answer);
    const pointsEarned = isCorrect ? currentBlock.points : 0;
    const timeSpent = blockStartTime 
      ? Math.round((Date.now() - blockStartTime.getTime()) / 1000)
      : undefined;

    const newAnswer: QuizAnswer = {
      blockId: currentBlock.id,
      answer,
      isCorrect,
      pointsEarned,
      answeredAt: new Date(),
      timeSpent,
    };

    setState(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newStreak);
      const newAnswers = [...prev.answers, newAnswer];
      const newScore = prev.score + pointsEarned;

      return {
        ...prev,
        answers: newAnswers,
        score: newScore,
        streak: newStreak,
        maxStreak: newMaxStreak,
      };
    });

    return { isCorrect, pointsEarned };
  }, [currentBlock]);

  const goToNext = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentBlockIndex + 1;
      
      if (nextIndex >= totalBlocks) {
        const completedState = {
          ...prev,
          currentBlockIndex: nextIndex,
          completedAt: new Date(),
        };
        onComplete?.(completedState);
        return completedState;
      }

      return {
        ...prev,
        currentBlockIndex: nextIndex,
      };
    });
  }, [totalBlocks, onComplete]);

  const restart = useCallback(() => {
    setState({
      currentBlockIndex: 0,
      answers: [],
      score: 0,
      streak: 0,
      maxStreak: 0,
      startedAt: new Date(),
    });
  }, []);

  return {
    state,
    currentBlock,
    currentIndex: state.currentBlockIndex,
    totalBlocks,
    progress,
    isComplete,
    scorePercent,
    submitAnswer,
    goToNext,
    restart,
  };
}

function checkAnswer(block: QuizBlock, answer: string | string[]): boolean {
  switch (block.type) {
    case 'multiple_choice':
    case 'scenario':
    case 'video_checkpoint':
      return answer === block.correctAnswerId;
    
    case 'hotspot':
      // Answer is the zone ID that was clicked
      const clickedZone = block.zones.find(z => z.id === answer);
      return clickedZone?.isCorrect ?? false;
    
    case 'sequence':
      // Answer is array of item IDs in order
      if (!Array.isArray(answer)) return false;
      const sortedItems = [...block.items].sort((a, b) => a.correctPosition - b.correctPosition);
      return answer.every((id, index) => id === sortedItems[index]?.id);
    
    case 'match':
      // Answer is array of "leftId:rightId" pairs
      if (!Array.isArray(answer)) return false;
      return block.pairs.every(pair => 
        answer.includes(`${pair.id}:${pair.id}`)
      );
    
    default:
      return false;
  }
}
