// src/components/emotion/types/analysis.ts

// Basic emotion types
export type EmotionLabel = 
  | 'neutral'
  | 'happiness'
  | 'surprise'
  | 'sadness'
  | 'anger'
  | 'disgust'
  | 'fear'
  | 'contempt';

export interface EmotionScores {
  neutral: number;
  happiness: number;
  surprise: number;
  sadness: number;
  anger: number;
  disgust: number;
  fear: number;
  contempt: number;
}

// Single emotion measurement
export interface EmotionMeasurement {
  emotion: EmotionLabel;
  intensity: number;
}

// Raw emotional moment from detection
export interface EmotionalMoment {
  timestamp: number;
  emotions: EmotionMeasurement[];
  faceDetected: boolean;
  confidence: number;
}

// Timeline entry for display
export interface EmotionTimelineEntry {
  timestamp: string;
  state: TimelineStateType;
  description: string;
  dominantEmotions: EmotionMeasurement[];
  notableEmotions: string;
}

// Overall analysis report
export interface OverallAnalysis {
  primaryResponse: string;
  emotionalPattern: string;
  notableObservation: string;
  dominantEmotions: EmotionMeasurement[];
}

// Import types from rules
import type { TimelineStateType } from '../analysis/rules/TimelineRules';