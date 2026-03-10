/**
 * Quiz Block Type Definitions
 * These types define the structure for interactive quiz elements in training courses
 */

export type QuizBlockType = 
  | 'multiple_choice'
  | 'hotspot'
  | 'sequence'
  | 'scenario'
  | 'video_checkpoint'
  | 'match';

export interface QuizOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface HotspotZone {
  id: string;
  x: number;      // Percentage from left
  y: number;      // Percentage from top
  width: number;  // Percentage of image width
  height: number; // Percentage of image height
  isCorrect: boolean;
  label?: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

export interface BaseQuizBlock {
  id: string;
  type: QuizBlockType;
  question: string;
  explanation?: string;
  points: number;
  timeLimit?: number; // Seconds, optional
}

export interface MultipleChoiceBlock extends BaseQuizBlock {
  type: 'multiple_choice';
  options: QuizOption[];
  correctAnswerId: string;
  imageUrl?: string;
  allowMultiple?: boolean;
}

export interface HotspotBlock extends BaseQuizBlock {
  type: 'hotspot';
  imageUrl: string;
  zones: HotspotZone[];
  instruction?: string; // e.g., "Klikk på sikkerhetsventilen"
}

export interface SequenceBlock extends BaseQuizBlock {
  type: 'sequence';
  items: Array<{
    id: string;
    text: string;
    imageUrl?: string;
    correctPosition: number;
  }>;
}

export interface ScenarioBlock extends BaseQuizBlock {
  type: 'scenario';
  imageUrl?: string;
  scenarioDescription: string;
  options: QuizOption[];
  correctAnswerId: string;
}

export interface VideoCheckpointBlock extends BaseQuizBlock {
  type: 'video_checkpoint';
  videoUrl: string;
  checkpointTime: number; // Seconds into video
  options: QuizOption[];
  correctAnswerId: string;
}

export interface MatchBlock extends BaseQuizBlock {
  type: 'match';
  pairs: MatchPair[];
}

export type QuizBlock = 
  | MultipleChoiceBlock 
  | HotspotBlock 
  | SequenceBlock 
  | ScenarioBlock 
  | VideoCheckpointBlock 
  | MatchBlock;

// Quiz state management
export interface QuizAnswer {
  blockId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: Date;
  timeSpent?: number;
}

export interface QuizState {
  currentBlockIndex: number;
  answers: QuizAnswer[];
  score: number;
  streak: number;
  maxStreak: number;
  startedAt: Date;
  completedAt?: Date;
}

// Mastery levels based on score percentage
export type MasteryLevel = 'none' | 'bronze' | 'silver' | 'gold';

export function getMasteryLevel(scorePercent: number): MasteryLevel {
  if (scorePercent >= 90) return 'gold';
  if (scorePercent >= 70) return 'silver';
  if (scorePercent >= 50) return 'bronze';
  return 'none';
}

export function getMasteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'gold': return 'Mester';
    case 'silver': return 'Dyktig';
    case 'bronze': return 'Godkjent';
    default: return 'Ikke bestått';
  }
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'gold': return 'text-yellow-500';
    case 'silver': return 'text-gray-400';
    case 'bronze': return 'text-orange-600';
    default: return 'text-muted-foreground';
  }
}
