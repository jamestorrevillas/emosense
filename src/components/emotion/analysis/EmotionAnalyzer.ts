// src/components/emotion/analysis/EmotionAnalyzer.ts
import { TimelineRules, type TimelineStateType } from './rules/TimelineRules';
import { OverallRules } from './rules/OverallRules';
import type { 
  EmotionLabel,
  EmotionMeasurement,
  EmotionTimelineEntry,
  OverallAnalysis,
  AggregatedEmotionData 
} from '../types/analysis';

type IntensityLevel = 'veryHigh' | 'high' | 'moderate' | 'low' | 'veryLow';

export class EmotionAnalyzer {
  public generateOverallAnalysis(data: AggregatedEmotionData[]): OverallAnalysis {
    const averageEmotions = this.getAverageEmotions(data);

    const dominantEmotions = Object.entries(averageEmotions)
      .map(([emotion, intensity]): EmotionMeasurement => ({
        emotion: emotion as EmotionLabel,
        intensity
      }))
      .filter(({ intensity }) => intensity > 0)
      .sort((a, b) => b.intensity - a.intensity);

    if (dominantEmotions.length === 0) {
      throw new Error("No significant emotions detected in the session");
    }

    const primaryEmotion = dominantEmotions[0];
    const emotionPattern = OverallRules.emotionPatterns[primaryEmotion.emotion];
    const intensityLevel = this.getIntensityLevel(primaryEmotion.emotion, primaryEmotion.intensity);
    const pattern = emotionPattern[intensityLevel];

    const emotionsText = dominantEmotions
      .map(e => `${e.emotion} (${e.intensity.toFixed(4)}%)`)
      .join(', ');

    return {
      primaryResponse: pattern.summary,
      emotionalPattern: pattern.description,
      notableObservation: `Viewers showed emotional responses including: ${emotionsText}`,
      dominantEmotions
    };
  }

  public processTimelineData(data: AggregatedEmotionData[]): EmotionTimelineEntry[] {
    const timeline: EmotionTimelineEntry[] = [];
    let lastState: TimelineStateType | null = null;

    for (const point of data) {
      const state = this.determineState(point);
      if (state === lastState) continue;

      const dominantEmotions = point.emotions
        .map(({ emotion, avgIntensity }): EmotionMeasurement => ({
          emotion: emotion as EmotionLabel,
          intensity: avgIntensity
        }))
        .sort((a, b) => b.intensity - a.intensity)
        .filter(({ intensity }) => intensity > 0);

      const entry: EmotionTimelineEntry = {
        timestamp: this.formatTimestamp(point.timestamp),
        state,
        description: this.getStateDescription(state),
        dominantEmotions,
        notableEmotions: dominantEmotions
          .map(({ emotion, intensity }) => `${emotion} (${intensity.toFixed(4)}%)`)
          .join(', ')
      };

      timeline.push(entry);
      lastState = state;
    }

    return timeline;
  }

  private getAverageEmotions(data: AggregatedEmotionData[]): Record<EmotionLabel, number> {
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
    data.forEach(point => {
      point.emotions.forEach(({ emotion, avgIntensity }) => {
        const current = emotionSums.get(emotion as EmotionLabel)!;
        emotionSums.set(emotion as EmotionLabel, {
          sum: current.sum + avgIntensity,
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

  private determineState(point: AggregatedEmotionData): TimelineStateType {
    const emotionScores = Object.fromEntries(
      point.emotions.map(({ emotion, avgIntensity }) => [emotion, avgIntensity])
    ) as Record<EmotionLabel, number>;

    for (const [stateName, definition] of Object.entries(TimelineRules.complexStates)) {
      if (this.meetsStateConditions(emotionScores, definition.conditions)) {
        return stateName as TimelineStateType;
      }
    }

    for (const [stateName, definition] of Object.entries(TimelineRules.singleStates)) {
      if (this.meetsStateConditions(emotionScores, definition.conditions)) {
        return stateName as TimelineStateType;
      }
    }

    return 'Basic Attention';
  }

  private meetsStateConditions(
    scores: Record<EmotionLabel, number>,
    conditions: { required?: Record<string, { min?: number; max?: number }> }
  ): boolean {
    if (!conditions.required) return true;

    return Object.entries(conditions.required).every(([emotion, range]) => {
      const score = scores[emotion as EmotionLabel] || 0;
      if (range.min !== undefined && score < range.min) return false;
      if (range.max !== undefined && score > range.max) return false;
      return true;
    });
  }

  private getStateDescription(state: TimelineStateType): string {
    const complexState = TimelineRules.complexStates[state as keyof typeof TimelineRules.complexStates];
    const singleState = TimelineRules.singleStates[state as keyof typeof TimelineRules.singleStates];
    return complexState?.description || singleState?.description || '';
  }

  public getIntensityLevel(emotion: EmotionLabel, intensity: number): IntensityLevel {
    const patterns = OverallRules.emotionPatterns[emotion];
    if (intensity >= patterns.veryHigh.threshold) return 'veryHigh';
    if (intensity >= patterns.high.threshold) return 'high';
    if (intensity >= patterns.moderate.threshold) return 'moderate';
    if (intensity >= patterns.low.threshold) return 'low';
    return 'veryLow';
  }

  private formatTimestamp(timestamp: number): string {
    const totalSeconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}