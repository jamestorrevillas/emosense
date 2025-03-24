// src/types/session.ts
export interface Session {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: SessionStatus;
    startTime: string;
    endTime?: string; // Undefined while active
    emotions: EmotionData[];
    videoUrl?: string; // Optional recording of the session
    thumbnailUrl?: string;
    createdAt: string;
    updatedAt: string;
}
  
export type SessionStatus = 'active' | 'history';
  
export interface EmotionData {
    timestamp: string;
    dominantEmotion: EmotionType;
    confidence: number;
    emotionDistribution: {
        [key in EmotionType]?: number; // Confidence per detected emotion
    };
}
  
export type EmotionType =
    | 'happy'
    | 'sad'
    | 'angry'
    | 'surprised'
    | 'neutral'
    | 'fearful'
    | 'disgusted';
  
// Used when creating a new session
export interface CreateSessionData {
    title: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
}
  
export interface SessionSummary {
    sessionId: string;
    userId: string;
    title: string;
    startTime: string;
    endTime: string;
    emotionTrends: {
        [emotion in EmotionType]?: number; // Percentage of time each emotion was dominant
    };
    peakEmotion: EmotionType; // Most frequent emotion
    avgConfidence: number;
}
  
export interface EmotionAnalysis {
    sessionId: string;
    userId: string;
    dominantEmotion: EmotionType;
    confidence: number;
    recordedAt: string;
}  