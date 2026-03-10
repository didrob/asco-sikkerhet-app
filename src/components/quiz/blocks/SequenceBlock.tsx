import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SequenceBlock } from '@/types/quiz';

interface SequenceProps {
  block: SequenceBlock;
  onAnswer: (orderedIds: string[]) => { isCorrect: boolean; pointsEarned: number } | undefined;
  onNext: () => void;
}

export function SequenceBlockComponent({ block, onAnswer, onNext }: SequenceProps) {
  // Shuffle items initially
  const [items, setItems] = useState(() => 
    [...block.items].sort(() => Math.random() - 0.5)
  );
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (submitted) return;

    const orderedIds = items.map(item => item.id);
    const result = onAnswer(orderedIds);
    
    if (result) {
      setIsCorrect(result.isCorrect);
      setShowResult(true);
      setSubmitted(true);
    }
  };

  const handleContinue = () => {
    setShowResult(false);
    setSubmitted(false);
    onNext();
  };

  // Get correct order for showing feedback
  const correctOrder = [...block.items].sort((a, b) => a.correctPosition - b.correctPosition);

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-xl font-bold md:text-2xl">{block.question}</h2>
        <p className="mt-2 text-muted-foreground">
          Dra elementene i riktig rekkefølge
        </p>
      </div>

      {/* Sortable List */}
      <div className="mx-auto w-full max-w-md">
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="space-y-2"
        >
          {items.map((item, index) => {
            const correctPosition = item.correctPosition;
            const isInCorrectPosition = showResult && index + 1 === correctPosition;
            const isWrongPosition = showResult && index + 1 !== correctPosition;

            return (
              <Reorder.Item
                key={item.id}
                value={item}
                dragListener={!submitted}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm',
                  !submitted && 'cursor-grab active:cursor-grabbing',
                  submitted && 'cursor-default',
                  isInCorrectPosition && 'border-green-500 bg-green-500/10',
                  isWrongPosition && 'border-red-500 bg-red-500/10'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full font-bold',
                  isInCorrectPosition && 'bg-green-500 text-white',
                  isWrongPosition && 'bg-red-500 text-white',
                  !showResult && 'bg-primary/10 text-primary'
                )}>
                  {showResult ? (
                    isInCorrectPosition ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="flex-1">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="mb-2 h-16 w-full rounded object-cover"
                    />
                  )}
                  <span className="font-medium">{item.text}</span>
                </div>

                {!submitted && (
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                )}

                {showResult && isWrongPosition && (
                  <span className="text-xs text-muted-foreground">
                    (#{correctPosition})
                  </span>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Submit Button */}
      {!showResult && (
        <div className="text-center">
          <Button onClick={handleSubmit} size="lg" className="min-w-[200px]">
            Sjekk svar
          </Button>
        </div>
      )}

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
              {isCorrect ? '🎉 Perfekt rekkefølge!' : '❌ Ikke helt riktig'}
            </p>
            
            {!isCorrect && (
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="font-medium">Riktig rekkefølge:</p>
                <ol className="mt-2 space-y-1">
                  {correctOrder.map((item, i) => (
                    <li key={item.id} className="flex items-center justify-center gap-2">
                      <span className="font-bold">{i + 1}.</span> {item.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {block.explanation && (
              <p className="mt-3 text-sm text-muted-foreground">{block.explanation}</p>
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
