// src/components/emotion/types/emotion.ts
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

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EmotionData {
  timestamp: number;
  scores: EmotionScores;
  dominantEmotion?: EmotionLabel;
  faceBox?: FaceBox;  // Added face detection data
}

export interface ProcessingStatus {
  isProcessing: boolean;
  fps: number;
  modelLoaded: boolean;
  error?: string;
  isInitializing?: boolean;
}

export interface LoadingStatus {
  faceDetector: boolean;
  emotionDetector: boolean;
  error?: string;
}