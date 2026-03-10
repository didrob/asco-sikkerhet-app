import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HotspotBlock } from '@/types/quiz';

interface HotspotProps {
  block: HotspotBlock;
  onAnswer: (zoneId: string) => { isCorrect: boolean; pointsEarned: number } | undefined;
  onNext: () => void;
}

export function HotspotBlockComponent({ block, onAnswer, onNext }: HotspotProps) {
  const [clickedZoneId, setClickedZoneId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickedZoneId) return; // Already clicked

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate click position as percentage
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setClickPosition({ x, y });

    // Find if click is inside any zone
    const clickedZone = block.zones.find(zone => {
      const inX = x >= zone.x && x <= zone.x + zone.width;
      const inY = y >= zone.y && y <= zone.y + zone.height;
      return inX && inY;
    });

    if (clickedZone) {
      setClickedZoneId(clickedZone.id);
      const result = onAnswer(clickedZone.id);
      
      if (result) {
        setIsCorrect(result.isCorrect);
        setShowResult(true);
      }
    } else {
      // Clicked outside any zone - show miss feedback
      setIsCorrect(false);
      setShowResult(true);
      // Reset after short delay to allow retry
      setTimeout(() => {
        setShowResult(false);
        setClickPosition(null);
      }, 1000);
    }
  };

  const handleContinue = () => {
    setClickedZoneId(null);
    setShowResult(false);
    setClickPosition(null);
    onNext();
  };

  const correctZone = block.zones.find(z => z.isCorrect);

  return (
    <div className="flex flex-col gap-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-xl font-bold md:text-2xl">{block.question}</h2>
        {block.instruction && (
          <p className="mt-2 text-muted-foreground">{block.instruction}</p>
        )}
      </div>

      {/* Interactive Image */}
      <div 
        ref={imageRef}
        onClick={handleImageClick}
        className={cn(
          'relative mx-auto max-w-2xl overflow-hidden rounded-xl shadow-lg',
          !clickedZoneId && 'cursor-crosshair'
        )}
      >
        <img
          src={block.imageUrl}
          alt="Klikk på riktig område"
          className="w-full"
          draggable={false}
        />

        {/* Show zones after answer (for learning) */}
        {showResult && clickedZoneId && (
          <>
            {block.zones.map(zone => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'absolute border-2 rounded-lg',
                  zone.isCorrect 
                    ? 'border-green-500 bg-green-500/20' 
                    : 'border-red-500 bg-red-500/20'
                )}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                }}
              >
                {zone.label && (
                  <span className={cn(
                    'absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium',
                    zone.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  )}>
                    {zone.label}
                  </span>
                )}
              </motion.div>
            ))}
          </>
        )}

        {/* Click indicator */}
        {clickPosition && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4',
              isCorrect ? 'border-green-500 bg-green-500/30' : 'border-red-500 bg-red-500/30'
            )}
            style={{
              left: `${clickPosition.x}%`,
              top: `${clickPosition.y}%`,
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white drop-shadow">
              {showResult && clickedZoneId ? (isCorrect ? '✓' : '✗') : '●'}
            </span>
          </motion.div>
        )}

        {/* Pulse animation for hint */}
        {!clickedZoneId && !clickPosition && (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        )}
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {showResult && clickedZoneId && (
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
              {isCorrect ? '🎯 Perfekt treff!' : '❌ Feil område'}
            </p>
            {!isCorrect && correctZone?.label && (
              <p className="mt-2 text-sm text-muted-foreground">
                Riktig svar: {correctZone.label}
              </p>
            )}
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
