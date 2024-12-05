// src/types/response.ts

export interface EmotionDataPoint {
  timestamp: number;        // Milliseconds since video start
  emotions: {
    emotion: string;
    intensity: number;
  }[];
  faceDetected: boolean;
  dominantEmotion?: string;
}

export interface EmotionResponse {
  videoId: string;         // From project data
  duration: number;        // Total video duration
  startTime: string;       // ISO string of when playback started
  endTime: string;        // ISO string of when playback ended
  data: EmotionDataPoint[];
}

export interface QuickRatingResponse {
  projectId: string;
  rating: number;
  createdAt: string;
}

export type SurveyResponse = Record<string, string | number | string[]>;

// Combined final response for Firestore
export interface ProjectResponse {
  projectId: string;
  tokenId?: string;
  status: 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string;
  responses: {
    emotion?: EmotionResponse;
    quickRating?: number;
    survey: SurveyResponse;
  }
}

// For response stats
export interface ResponseStats {
  linkId: string;  // token id
  totalResponses: number;
  lastResponse?: string;
  quickRatingAvg?: number;
  completed: number;
  abandoned: number;
}

export interface TokenResponse {
  id: string;
  tokenId: string;
  projectId: string;
  startedAt: string;
  completedAt?: string;
  quickRating?: number;
  surveyResponses?: Record<string, string | number | string[]>;
  status: 'started' | 'completed' | 'abandoned';
}