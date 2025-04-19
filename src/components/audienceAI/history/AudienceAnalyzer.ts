// src/components/audienceAI/history/AudienceAnalyzer.ts
import { AudienceTimelineRules, AudienceTimelineStateType } from './rules/AudienceTimelineRules';
import { AudienceOverallRules, EmotionIntensityType } from './rules/AudienceOverallRules';
import type { EmotionLabel } from '@/components/emotion/types/emotion';
import type { 
  TrackedEmotion, 
  AudienceEmotionalMoment, 
  AudienceOverallAnalysis,
  AudienceTimelineEntry,
  PresentationMetrics
} from '@/types/audienceAI';

export class AudienceAnalyzer {
  // Analyze overall data and generate a summary
  public generateOverallAnalysis(data: AudienceEmotionalMoment[]): AudienceOverallAnalysis {
    // Check for empty data
    if (!data || data.length === 0) {
      return {
        primaryResponse: "No audience data available",
        emotionalPattern: "No emotional patterns could be detected due to lack of audience data.",
        notableObservation: "No audience members were detected during this session.",
        dominantEmotions: []
      };
    }
    
    const averageEmotions = this.getAverageEmotions(data);

    const dominantEmotions = Object.entries(averageEmotions)
      .map(([emotion, intensity]): TrackedEmotion => ({
        emotion: emotion as EmotionLabel,
        intensity
      }))
      .filter(({ intensity }) => intensity > 0)
      .sort((a, b) => b.intensity - a.intensity);

    if (dominantEmotions.length === 0) {
      return {
        primaryResponse: "No significant emotional response detected",
        emotionalPattern: "The audience did not exhibit significant emotional responses during the session.",
        notableObservation: "Consider more engaging content to evoke audience emotions.",
        dominantEmotions: []
      };
    }

    const primaryEmotion = dominantEmotions[0];
    const emotionPattern = AudienceOverallRules.emotionPatterns[primaryEmotion.emotion];
    const intensityLevel = this.getIntensityLevel(primaryEmotion.emotion, primaryEmotion.intensity);
    const pattern = emotionPattern[intensityLevel];

    const emotionsText = dominantEmotions
      .slice(0, 4) // Just show top 4 emotions for clarity
      .map(e => `${e.emotion} (${e.intensity.toFixed(1)}%)`)
      .join(', ');

    return {
      primaryResponse: pattern.summary,
      emotionalPattern: pattern.description,
      notableObservation: `Audience showed emotional responses including: ${emotionsText}`,
      dominantEmotions
    };
  }

  // Process timeline data to identify emotional states
  public processTimelineData(data: AudienceEmotionalMoment[]): AudienceTimelineEntry[] {
    // Check for empty data
    if (!data || data.length === 0) {
      return [];
    }
    
    const timeline: AudienceTimelineEntry[] = [];
    let lastState: AudienceTimelineStateType | null = null;

    // Group data by fixed time intervals
    const timeIntervals = this.groupByTimeIntervals(data, AudienceTimelineRules.config.intervalSeconds * 1000);

    for (const interval of timeIntervals) {
      const state = this.determineAudienceState(interval);
      if (state === lastState) continue;

      const dominantEmotions = this.calculateDominantEmotions(interval);

      const entry: AudienceTimelineEntry = {
        timestamp: this.formatTimestamp(interval[0].timestamp),
        state,
        description: this.getStateDescription(state),
        dominantEmotions,
        notableEmotions: dominantEmotions
          .map(({ emotion, intensity }) => `${emotion} (${intensity.toFixed(1)}%)`)
          .join(', '),
        faceCount: Math.max(...interval.map(m => m.faceCount))
      };

      timeline.push(entry);
      lastState = state;
    }

    return timeline;
  }

  // Generate presentation metrics based on audience data
  public generatePresentationMetrics(data: AudienceEmotionalMoment[]): PresentationMetrics {
    // Skip processing if no data
    if (!data || data.length === 0) {
      return {
        attentionScore: 0,
        engagementScore: 0,
        emotionalImpactScore: 0,
        overallScore: 0
      };
    }

    // Calculate average face count across all moments
    const averageFaceCount = data.reduce((sum, moment) => sum + moment.faceCount, 0) / data.length;
    
    // Calculate attention score based on face detection consistency
    const faceDetectionRatio = data.filter(moment => moment.faceDetected).length / data.length;
    const attentionScore = Math.min(100, Math.round(faceDetectionRatio * 100));
    
    // Calculate engagement score based on emotional activity
    const emotionalActivity = data.map(moment => {
      // Sum all non-neutral emotion intensities
      const totalIntensity = moment.emotions
        .filter(e => e.emotion !== 'neutral')
        .reduce((sum, e) => sum + e.intensity, 0);
      return totalIntensity;
    });
    
    const avgEmotionalActivity = emotionalActivity.reduce((sum, intensity) => sum + intensity, 0) / 
      (emotionalActivity.length || 1);
    
    // Scale engagement score - higher emotional activity = higher engagement
    const engagementScore = Math.min(100, Math.round(
      (avgEmotionalActivity / 100) * 60 + // Base on emotional activity
      (averageFaceCount * 10) // Add points for audience size
    ));
    
    // Calculate emotional impact
    const emotionalImpactScore = Math.min(100, Math.round(
      this.calculateEmotionalVariance(data) * 50 + // Variance indicates impact
      this.calculateEmotionalPeaks(data) * 50 // High peaks indicate impact
    ));
    
    // Calculate overall score as weighted average
    const overallScore = Math.round(
      (attentionScore * 0.35) +
      (engagementScore * 0.35) +
      (emotionalImpactScore * 0.3)
    );
    
    return {
      attentionScore,
      engagementScore,
      emotionalImpactScore,
      overallScore
    };
  }

  // Group data by time intervals
  private groupByTimeIntervals(data: AudienceEmotionalMoment[], intervalMs: number): AudienceEmotionalMoment[][] {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sorted[0].timestamp;
    
    const intervals: AudienceEmotionalMoment[][] = [];
    let currentInterval: AudienceEmotionalMoment[] = [];
    let currentIntervalEnd = startTime + intervalMs;

    for (const moment of sorted) {
      if (moment.timestamp <= currentIntervalEnd) {
        currentInterval.push(moment);
      } else {
        if (currentInterval.length > 0) {
          intervals.push(currentInterval);
        }
        
        // Skip empty intervals
        const skippedIntervals = Math.floor((moment.timestamp - currentIntervalEnd) / intervalMs);
        currentIntervalEnd += (skippedIntervals + 1) * intervalMs;
        
        currentInterval = [moment];
      }
    }

    // Add the last interval if not empty
    if (currentInterval.length > 0) {
      intervals.push(currentInterval);
    }

    return intervals;
  }

  // Get average emotions across all moments
  private getAverageEmotions(data: AudienceEmotionalMoment[]): Record<EmotionLabel, number> {
    const emotionSums = new Map<EmotionLabel, { sum: number; count: number }>();

    const allEmotions: EmotionLabel[] = [
      'neutral', 'happiness', 'surprise', 'sadness',
      'anger', 'disgust', 'fear', 'contempt'
    ];
    
    // Initialize sums for all emotions
    allEmotions.forEach(emotion => {
      emotionSums.set(emotion, { sum: 0, count: 0 });
    });

    // Accumulate values
    data.forEach(moment => {
      moment.emotions.forEach(({ emotion, intensity }) => {
        const current = emotionSums.get(emotion as EmotionLabel)!;
        emotionSums.set(emotion as EmotionLabel, {
          sum: current.sum + intensity,
          count: current.count + 1
        });
      });
    });

    // Calculate averages
    const result: Partial<Record<EmotionLabel, number>> = {};
    emotionSums.forEach((value, emotion) => {
      result[emotion] = value.count > 0 ? value.sum / value.count : 0;
    });

    return result as Record<EmotionLabel, number>;
  }

  // Determine the audience emotional state for a given time interval
  private determineAudienceState(moments: AudienceEmotionalMoment[]): AudienceTimelineStateType {
    if (!moments || moments.length === 0 || !moments.some(m => m.faceDetected)) {
      return 'No Audience Detected';
    }

    // Calculate average emotions for this interval
    const averageEmotions: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    
    // Count faces for audience size check
    const maxFaceCount = Math.max(...moments.map(m => m.faceCount));

    // Get the average of each emotion across all moments in this interval
    moments.forEach(moment => {
      moment.emotions.forEach(({ emotion, intensity }) => {
        if (!averageEmotions[emotion]) {
          averageEmotions[emotion] = 0;
          emotionCounts[emotion] = 0;
        }
        
        averageEmotions[emotion] += intensity;
        emotionCounts[emotion]++;
      });
    });

    // Calculate final averages
    Object.keys(averageEmotions).forEach(emotion => {
      if (emotionCounts[emotion] > 0) {
        averageEmotions[emotion] = averageEmotions[emotion] / emotionCounts[emotion];
      }
    });

    // Check complex states first (higher priority)
    for (const [stateName, definition] of Object.entries(AudienceTimelineRules.complexStates)) {
      if (this.meetsStateConditions(averageEmotions, definition.conditions, maxFaceCount)) {
        return stateName as AudienceTimelineStateType;
      }
    }

    // Check single states
    for (const [stateName, definition] of Object.entries(AudienceTimelineRules.singleStates)) {
      if (this.meetsStateConditions(averageEmotions, definition.conditions, maxFaceCount)) {
        return stateName as AudienceTimelineStateType;
      }
    }

    // Default to basic attention if no other state matches
    return 'Basic Attention';
  }

  // Check if emotions meet the conditions for a state
  private meetsStateConditions(
    scores: Record<string, number>,
    conditions: {
      required?: Record<string, { min?: number; max?: number }>;
      forbidden?: Record<string, { min?: number; max?: number }>;
      audienceSize?: { min?: number; max?: number };
    },
    faceCount: number
  ): boolean {
    // Check audience size condition if present
    if (conditions.audienceSize) {
      if (conditions.audienceSize.min !== undefined && faceCount < conditions.audienceSize.min) {
        return false;
      }
      if (conditions.audienceSize.max !== undefined && faceCount > conditions.audienceSize.max) {
        return false;
      }
    }

    // Check required emotions
    if (conditions.required) {
      for (const [emotion, range] of Object.entries(conditions.required)) {
        const score = scores[emotion] || 0;
        if (range.min !== undefined && score < range.min) return false;
        if (range.max !== undefined && score > range.max) return false;
      }
    }

    // Check forbidden emotions
    if (conditions.forbidden) {
      for (const [emotion, range] of Object.entries(conditions.forbidden)) {
        const score = scores[emotion] || 0;
        if (range.min !== undefined && score >= range.min) return false;
        if (range.max !== undefined && score > range.max) return false;
      }
    }

    return true;
  }

  // Calculate dominant emotions for an interval
  private calculateDominantEmotions(moments: AudienceEmotionalMoment[]): TrackedEmotion[] {
    // Get average emotions for this interval
    const avgEmotions: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};

    moments.forEach(moment => {
      moment.emotions.forEach(({ emotion, intensity }) => {
        if (!avgEmotions[emotion]) {
          avgEmotions[emotion] = 0;
          emotionCounts[emotion] = 0;
        }
        
        avgEmotions[emotion] += intensity;
        emotionCounts[emotion]++;
      });
    });

    // Calculate averages
    Object.keys(avgEmotions).forEach(emotion => {
      if (emotionCounts[emotion] > 0) {
        avgEmotions[emotion] = avgEmotions[emotion] / emotionCounts[emotion];
      }
    });

    // Convert to array and sort
    return Object.entries(avgEmotions)
      .map(([emotion, intensity]): TrackedEmotion => ({
        emotion: emotion as EmotionLabel,
        intensity
      }))
      .filter(({ intensity }) => intensity > AudienceTimelineRules.config.minEmotionIntensity)
      .sort((a, b) => b.intensity - a.intensity);
  }

  // Get description for a given state
  private getStateDescription(state: AudienceTimelineStateType): string {
    const complexState = AudienceTimelineRules.complexStates[state as keyof typeof AudienceTimelineRules.complexStates];
    const singleState = AudienceTimelineRules.singleStates[state as keyof typeof AudienceTimelineRules.singleStates];
    
    if (state === 'No Audience Detected') {
      return "No audience members detected during this interval";
    }
    
    return complexState?.description || singleState?.description || 'Unknown state';
  }

  // Get intensity level for an emotion
  public getIntensityLevel(emotion: EmotionLabel, intensity: number): EmotionIntensityType {
    const patterns = AudienceOverallRules.emotionPatterns[emotion];
    if (intensity >= patterns.veryHigh.threshold) return 'veryHigh';
    if (intensity >= patterns.high.threshold) return 'high';
    if (intensity >= patterns.moderate.threshold) return 'moderate';
    if (intensity >= patterns.low.threshold) return 'low';
    return 'veryLow';
  }

  // Format timestamp for display (MM:SS)
  private formatTimestamp(timestamp: number): string {
    // Convert to seconds from start
    const totalSeconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  
  // Calculate emotional variance (how much emotions fluctuate)
  private calculateEmotionalVariance(data: AudienceEmotionalMoment[]): number {
    if (data.length <= 1) return 0;
    
    // Track variance of dominant emotions over time
    const dominantEmotions = data.map(moment => {
      if (!moment.emotions.length) return 0;
      
      const dominant = moment.emotions.reduce((prev, current) => 
        current.intensity > prev.intensity ? current : prev
      );
      return dominant.intensity;
    });
    
    // Calculate variance
    const mean = dominantEmotions.reduce((sum, val) => sum + val, 0) / dominantEmotions.length;
    const variance = dominantEmotions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dominantEmotions.length;
    
    // Normalize to 0-1 range (assuming max variance would be around 2500)
    return Math.min(1, variance / 2500);
  }
  
  // Calculate emotional peaks (moments of high emotion)
  private calculateEmotionalPeaks(data: AudienceEmotionalMoment[]): number {
    if (data.length === 0) return 0;
    
    // Count moments with high emotion intensity (above 50%)
    const highEmotionMoments = data.filter(moment => {
      if (!moment.emotions.length) return false;
      const maxIntensity = Math.max(...moment.emotions.map(e => e.intensity));
      return maxIntensity > 50;
    });
    
    // Return ratio of high emotion moments
    return highEmotionMoments.length / data.length;
  }
}