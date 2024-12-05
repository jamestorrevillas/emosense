// src/components/emotion/analysis/EmotionAnalyzer.ts
import { TimelineRules, type TimelineStateType } from './rules/TimelineRules';
import { OverallRules } from './rules/OverallRules';
import type { EmotionLabel } from '../types/emotion';

interface AggregatedEmotionData {
  timestamp: number;
  emotions: {
    emotion: string;
    avgIntensity: number;
  }[];
  dominantEmotion: string;
  totalResponses: number;
}

interface EmotionTimelineEntry {
  timestamp: string;
  state: TimelineStateType;
  description: string;
  dominantEmotions: { emotion: EmotionLabel; intensity: number }[];
  notableEmotions: string;
}

interface OverallAnalysis {
  primaryResponse: string;
  emotionalPattern: string;
  notableObservation: string;
  dominantEmotions: { emotion: EmotionLabel; intensity: number }[];
}

interface RangeCondition {
  min?: number;
  max?: number;
}

interface StateConditions {
  required?: Record<string, RangeCondition>;
  forbidden?: Record<string, RangeCondition>;
}

export class EmotionAnalyzer {
  private getAverageEmotions(data: AggregatedEmotionData[]): Record<string, number> {
    const emotionSums: Record<string, { sum: number; count: number }> = {};

    data.forEach(point => {
      point.emotions.forEach(({ emotion, avgIntensity }) => {
        if (!emotionSums[emotion]) {
          emotionSums[emotion] = { sum: 0, count: 0 };
        }
        emotionSums[emotion].sum += avgIntensity;
        emotionSums[emotion].count += 1;
      });
    });

    return Object.entries(emotionSums).reduce((acc, [emotion, { sum, count }]) => {
      acc[emotion] = sum / count;
      return acc;
    }, {} as Record<string, number>);
  }

  public processTimelineData(data: AggregatedEmotionData[]): EmotionTimelineEntry[] {
    const timeline: EmotionTimelineEntry[] = [];
    let lastState: string | null = null;

    // Process data in intervals
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      
      // Format timestamp
      const totalSeconds = Math.floor(point.timestamp / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      // Get dominant emotions
      const dominantEmotions = point.emotions
        .map(({ emotion, avgIntensity }) => ({
          emotion: emotion as EmotionLabel,
          intensity: avgIntensity
        }))
        .sort((a, b) => b.intensity - a.intensity)
        .filter(({ intensity }) => intensity > TimelineRules.config.minEmotionIntensity);

      if (dominantEmotions.length === 0) continue;

      // Determine emotional state
      const state = this.determineState(point);
      if (state === lastState) continue;

      // Create timeline entry
      const entry: EmotionTimelineEntry = {
        timestamp: formattedTime,
        state,
        description: this.getStateDescription(state),
        dominantEmotions,
        notableEmotions: dominantEmotions
          .map(({ emotion, intensity }) => `${emotion} (${intensity.toFixed(1)}%)`)
          .join(', ')
      };

      timeline.push(entry);
      lastState = state;
    }

    return timeline;
  }

  public generateOverallAnalysis(data: AggregatedEmotionData[]): OverallAnalysis {
    // Get average emotions across all data points
    const averageEmotions = this.getAverageEmotions(data);

    // Get dominant emotions
    const dominantEmotions = Object.entries(averageEmotions)
      .map(([emotion, intensity]) => ({
        emotion: emotion as EmotionLabel,
        intensity
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .filter(({ intensity }) => intensity > TimelineRules.config.minEmotionIntensity);

    if (dominantEmotions.length === 0) {
      throw new Error("No significant emotions detected in the session");
    }

    const primaryEmotion = dominantEmotions[0];
    const emotionPattern = OverallRules.emotionPatterns[primaryEmotion.emotion];
    const intensityLevel = this.getIntensityLevel(primaryEmotion.emotion, primaryEmotion.intensity);
    const pattern = emotionPattern[intensityLevel];

    // Generate notable observation
    const secondaryEmotions = dominantEmotions
      .slice(1)
      .map(e => `${e.emotion} (${e.intensity.toFixed(1)}%)`);

    const notableObservation = secondaryEmotions.length > 0
      ? `Primary viewer response was ${primaryEmotion.emotion} (${primaryEmotion.intensity.toFixed(1)}%) with additional responses including ${secondaryEmotions.join(', ')}.`
      : `Viewers primarily showed ${primaryEmotion.emotion} response at ${primaryEmotion.intensity.toFixed(1)}%.`;

    return {
      primaryResponse: pattern.summary,
      emotionalPattern: pattern.description,
      notableObservation,
      dominantEmotions
    };
  }

  private determineState(point: AggregatedEmotionData): TimelineStateType {
    // Convert emotions to format expected by rules
    const emotionScores = Object.fromEntries(
      point.emotions.map(({ emotion, avgIntensity }) => [emotion, avgIntensity])
    );

    // Use Timeline Rules to determine state
    for (const [stateName, definition] of Object.entries(TimelineRules.complexStates)) {
      if (this.meetsStateConditions(emotionScores, definition.conditions)) {
        return stateName as TimelineStateType;
      }
    }

    // Check single states as fallback
    for (const [stateName, definition] of Object.entries(TimelineRules.singleStates)) {
      if (this.meetsStateConditions(emotionScores, definition.conditions)) {
        return stateName as TimelineStateType;
      }
    }

    return 'Basic Attention';
  }

  private meetsStateConditions(
    scores: Record<string, number>, 
    conditions: StateConditions
  ): boolean {
    // Check required emotions
    if (conditions.required) {
      for (const [emotion, range] of Object.entries(conditions.required)) {
        const score = scores[emotion];
        if (score === undefined) return false;
        if (range.min !== undefined && score < range.min) return false;
        if (range.max !== undefined && score > range.max) return false;
      }
    }
  
    // Check forbidden emotions
    if (conditions.forbidden) {
      for (const [emotion, range] of Object.entries(conditions.forbidden)) {
        const score = scores[emotion];
        if (score === undefined) continue;
        if (range.max !== undefined && score > range.max) return false;
      }
    }
  
    return true;
  }

  private getStateDescription(state: TimelineStateType): string {
    if (state === 'No Face Detected') {
      return "No viewers detected in frame";
    }
    return (TimelineRules.complexStates[state as keyof typeof TimelineRules.complexStates] || 
            TimelineRules.singleStates[state as keyof typeof TimelineRules.singleStates])?.description || '';
  }

  public getIntensityLevel(emotion: EmotionLabel, intensity: number): 'veryHigh' | 'high' | 'moderate' | 'low' | 'veryLow' {
    const patterns = OverallRules.emotionPatterns[emotion];
    if (intensity >= patterns.veryHigh.threshold) return 'veryHigh';
    if (intensity >= patterns.high.threshold) return 'high';
    if (intensity >= patterns.moderate.threshold) return 'moderate';
    if (intensity >= patterns.low.threshold) return 'low';
    return 'veryLow';
  }
}