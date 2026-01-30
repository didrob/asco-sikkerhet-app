import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MultipleChoiceBlock } from '@/types/quiz';

interface MultipleChoiceProps {
  block: MultipleChoiceBlock;
  onAnswer: (answerId: string) => { isCorrect: boolean; pointsEarned: number } | undefined;
  onNext: () => void;
}

// Kahoot-inspired colors for options
const OPTION_COLORS = [
  'bg-red-500 hover:bg-red-600 border-red-600',
  'bg-blue-500 hover:bg-blue-600 border-blue-600',
  'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  'bg-green-500 hover:bg-green-600 border-green-600',
];

const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export function MultipleChoiceBlockComponent({ block, onAnswer, onNext }: MultipleChoiceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (optionId: string) => {
    if (selectedId) return; // Already answered

    setSelectedId(optionId);
    const result = onAnswer(optionId);
    
    if (result) {
      setIsCorrect(result.isCorrect);
      setShowResult(true);
    }
  };

  const handleContinue = () => {
    setSelectedId(null);
    setShowResult(false);
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-xl font-bold md:text-2xl">{block.question}</h2>
      </div>

      {/* Image if present */}
      {block.imageUrl && (
        <div className="mx-auto max-w-md">
          <img
            src={block.imageUrl}
            alt="Spørsmålsbilde"
            className="rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {block.options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = option.id === block.correctAnswerId;
          const colorClass = OPTION_COLORS[index % OPTION_COLORS.length];
          const shape = OPTION_SHAPES[index % OPTION_SHAPES.length];

          return (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!!selectedId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative flex min-h-[80px] items-center gap-4 rounded-xl border-b-4 p-4 text-left text-white transition-all',
                colorClass,
                !selectedId && 'transform hover:scale-[1.02] active:scale-[0.98]',
                selectedId && !isSelected && !isCorrectOption && 'opacity-40',
                showResult && isCorrectOption && 'ring-4 ring-white ring-offset-2',
                showResult && isSelected && !isCorrectOption && 'opacity-60'
              )}
            >
              <span className="text-2xl font-bold opacity-50">{shape}</span>
              <span className="flex-1 font-medium">{option.text}</span>
              
              {/* Result indicator */}
              {showResult && isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold',
                    isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  )}
                >
                  {isCorrect ? '✓' : '✗'}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'rounded-lg p-4 text-center',
              isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            )}
          >
            <p className="text-lg font-bold">
              {isCorrect ? '🎉 Riktig!' : '❌ Feil svar'}
            </p>
            {!isCorrect && block.explanation && (
              <p className="mt-2 text-sm text-muted-foreground">{block.explanation}</p>
            )}
            
            <motion.button
              onClick={handleContinue}
              className="mt-4 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Fortsett →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
