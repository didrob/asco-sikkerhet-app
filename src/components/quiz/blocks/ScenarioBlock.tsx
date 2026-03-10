import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScenarioBlock } from '@/types/quiz';

interface ScenarioProps {
  block: ScenarioBlock;
  onAnswer: (answerId: string) => { isCorrect: boolean; pointsEarned: number } | undefined;
  onNext: () => void;
}

// Different colors for scenario options (less vibrant than multiple choice)
const SCENARIO_COLORS = [
  'border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
  'border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950',
  'border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950',
  'border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950',
];

export function ScenarioBlockComponent({ block, onAnswer, onNext }: ScenarioProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (optionId: string) => {
    if (selectedId) return;

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
      {/* Scenario Header */}
      <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-4">
        <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-600" />
        <div>
          <h3 className="font-bold text-amber-800 dark:text-amber-400">Situasjon</h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {block.scenarioDescription}
          </p>
        </div>
      </div>

      {/* Scenario Image */}
      {block.imageUrl && (
        <div className="mx-auto max-w-xl overflow-hidden rounded-xl shadow-lg">
          <img
            src={block.imageUrl}
            alt="Situasjonsbilde"
            className="w-full"
          />
        </div>
      )}

      {/* Question */}
      <div className="text-center">
        <h2 className="text-xl font-bold md:text-2xl">{block.question}</h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {block.options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = option.id === block.correctAnswerId;
          const colorClass = SCENARIO_COLORS[index % SCENARIO_COLORS.length];

          return (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!!selectedId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative w-full rounded-xl border-2 p-4 text-left transition-all',
                colorClass,
                !selectedId && 'hover:shadow-md',
                selectedId && !isSelected && !isCorrectOption && 'opacity-40',
                showResult && isCorrectOption && 'border-green-500 bg-green-500/10',
                showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-500/10'
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold',
                  showResult && isCorrectOption && 'bg-green-500 text-white',
                  showResult && isSelected && !isCorrectOption && 'bg-red-500 text-white',
                  !showResult && 'bg-muted'
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 font-medium">{option.text}</span>
              </div>
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
              {isCorrect ? '✅ Riktig beslutning!' : '⚠️ Ikke beste valg'}
            </p>
            {block.explanation && (
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
