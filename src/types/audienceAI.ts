// src/types/audienceAI.ts

import { EmotionLabel } from "@/components/emotion/types/emotion";

// Type for a single tracked emotion with intensity
export interface TrackedEmotion {
  emotion: EmotionLabel;
  intensity: number;
  confidence?: number;
}

// Emotional moment in the timeline
export interface AudienceEmotionalMoment {
  timestamp: number;
  emotions: TrackedEmotion[];
  faceCount: number;
  faceDetected: boolean;
}

// For overall audience analysis
export interface AudienceOverallAnalysis {
  primaryResponse: string;
  emotionalPattern: string;
  notableObservation: string;
  dominantEmotions: TrackedEmotion[];
}

// For timeline entries in the analysis
export interface AudienceTimelineEntry {
  timestamp: string;
  state: string;
  description: string;
  dominantEmotions: TrackedEmotion[];
  notableEmotions: string;
  faceCount: number;
}

// Presentation metrics
export interface PresentationMetrics {
  attentionScore: number;       // How well presenter maintained audience attention
  engagementScore: number;      // How engaged the audience was
  emotionalImpactScore: number; // How strong the emotional response was
  overallScore: number;         // Combined score
}

// Full audience session data
export interface AudienceSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  duration: number;
  maxFaceCount: number;
  overallAnalysis: AudienceOverallAnalysis;
  emotionTimeline: AudienceTimelineEntry[];
  presentationMetrics: PresentationMetrics;
  recommendations: string[];
}

// Session creation data
export interface CreateAudienceSessionData {
  title: string;
  duration: number;
  maxFaceCount: number;
  emotionData: AudienceEmotionalMoment[];
}