// src/components/audienceAI/session/core/SessionUtils.ts
import { DocumentData } from 'firebase/firestore';

// Define StoredEmotionData type to match the structure but be serializable
export interface StoredEmotionData {
  timestamp: number;
  faceCount: number;
  averageEmotions: Record<string, number>;
  dominantEmotion: string | null;
  faces: Array<{
    id: string;
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    lastSeen: number;
    emotions?: {
      scores: Record<string, number>;
      dominantEmotion: string | null;
      lastProcessed: number;
    };
  }>;
}

export interface SessionMetrics {
  attentionScore: number;
  engagementScore: number;
  emotionalImpactScore: number;
  overallScore: number;
}

export type SavingStatus = 'idle' | 'saving' | 'error' | 'success';

// Utility function to sanitize data for Firestore
export function sanitizeForFirestore(data: unknown): DocumentData | Record<string, never> {
  // If data is undefined or null, return empty object (Firestore compatible)
  if (data === undefined || data === null) {
    return {};
  }
  
  // Handle primitive types
  if (typeof data !== 'object') {
    return { value: data }; // Wrap primitives in an object with 'value' key
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return { items: data.map(item => sanitizeForFirestore(item)) };
  }
  
  // Handle objects
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value !== undefined) {
      result[key] = value === null ? null : value;
    }
  }
  
  return result;
}

// Clean camera names to remove parentheses and device IDs
export function cleanCameraName(label: string): string {
  // Remove anything in parentheses and trim
  return label.replace(/\s*\([^)]*\)/g, '').trim();
}