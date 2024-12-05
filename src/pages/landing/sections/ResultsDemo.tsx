// src/pages/landing/sections/ResultsDemo.tsx
import { Container } from "./Container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { EmotionalResponseTrend } from '@/components/emotion/visualization/EmotionalResponseTrend';
import { OverallAnalysisView } from '@/components/emotion/visualization/OverallAnalysisView';
import { EmotionalTimelineView } from '@/components/emotion/visualization/EmotionalTimelineView';
import { TimelineStateType } from '@/components/emotion/analysis/rules/TimelineRules';
import type { EmotionLabel } from '@/components/emotion/types/emotion';
import type { EmotionTimelineEntry } from '@/components/emotion/types/analysis';

// Sample data showing a full emotional journey over 1 minute
const sampleData = [
  {
    timestamp: 0,
    emotions: [
      { emotion: 'neutral' as EmotionLabel, avgIntensity: 60 },
      { emotion: 'happiness' as EmotionLabel, avgIntensity: 25 },
      { emotion: 'surprise' as EmotionLabel, avgIntensity: 15 },
      { emotion: 'sadness' as EmotionLabel, avgIntensity: 10 },
      { emotion: 'anger' as EmotionLabel, avgIntensity: 5 },
      { emotion: 'disgust' as EmotionLabel, avgIntensity: 5 },
      { emotion: 'fear' as EmotionLabel, avgIntensity: 8 },
      { emotion: 'contempt' as EmotionLabel, avgIntensity: 3 }
    ],
    dominantEmotion: 'neutral' as EmotionLabel,
    totalResponses: 1
  },
  {
    timestamp: 15000,
    emotions: [
      { emotion: 'neutral' as EmotionLabel, avgIntensity: 40 },
      { emotion: 'happiness' as EmotionLabel, avgIntensity: 55 },
      { emotion: 'surprise' as EmotionLabel, avgIntensity: 35 },
      { emotion: 'sadness' as EmotionLabel, avgIntensity: 15 },
      { emotion: 'anger' as EmotionLabel, avgIntensity: 8 },
      { emotion: 'disgust' as EmotionLabel, avgIntensity: 6 },
      { emotion: 'fear' as EmotionLabel, avgIntensity: 10 },
      { emotion: 'contempt' as EmotionLabel, avgIntensity: 5 }
    ],
    dominantEmotion: 'happiness' as EmotionLabel,
    totalResponses: 1
  },
  {
    timestamp: 30000,
    emotions: [
      { emotion: 'neutral' as EmotionLabel, avgIntensity: 30 },
      { emotion: 'happiness' as EmotionLabel, avgIntensity: 70 },
      { emotion: 'surprise' as EmotionLabel, avgIntensity: 45 },
      { emotion: 'sadness' as EmotionLabel, avgIntensity: 10 },
      { emotion: 'anger' as EmotionLabel, avgIntensity: 5 },
      { emotion: 'disgust' as EmotionLabel, avgIntensity: 3 },
      { emotion: 'fear' as EmotionLabel, avgIntensity: 7 },
      { emotion: 'contempt' as EmotionLabel, avgIntensity: 4 }
    ],
    dominantEmotion: 'happiness' as EmotionLabel,
    totalResponses: 1
  },
  {
    timestamp: 45000,
    emotions: [
      { emotion: 'neutral' as EmotionLabel, avgIntensity: 25 },
      { emotion: 'happiness' as EmotionLabel, avgIntensity: 40 },
      { emotion: 'surprise' as EmotionLabel, avgIntensity: 75 },
      { emotion: 'sadness' as EmotionLabel, avgIntensity: 12 },
      { emotion: 'anger' as EmotionLabel, avgIntensity: 6 },
      { emotion: 'disgust' as EmotionLabel, avgIntensity: 4 },
      { emotion: 'fear' as EmotionLabel, avgIntensity: 15 },
      { emotion: 'contempt' as EmotionLabel, avgIntensity: 3 }
    ],
    dominantEmotion: 'surprise' as EmotionLabel,
    totalResponses: 1
  },
  {
    timestamp: 60000,
    emotions: [
      { emotion: 'neutral' as EmotionLabel, avgIntensity: 20 },
      { emotion: 'happiness' as EmotionLabel, avgIntensity: 80 },
      { emotion: 'surprise' as EmotionLabel, avgIntensity: 40 },
      { emotion: 'sadness' as EmotionLabel, avgIntensity: 8 },
      { emotion: 'anger' as EmotionLabel, avgIntensity: 4 },
      { emotion: 'disgust' as EmotionLabel, avgIntensity: 3 },
      { emotion: 'fear' as EmotionLabel, avgIntensity: 5 },
      { emotion: 'contempt' as EmotionLabel, avgIntensity: 2 }
    ],
    dominantEmotion: 'happiness' as EmotionLabel,
    totalResponses: 1
  }
];

const sampleOverallAnalysis = {
  primaryResponse: "Strong viewer engagement with distinct emotional phases",
  emotionalPattern: "Viewers exhibited a dynamic range of emotional responses, transitioning from initial neutral attention through periods of happiness and surprise, with consistent engagement throughout the content.",
  notableObservation: "Primary viewer response was happiness (80.0%) with additional responses including surprise (75.0%), neutral (35.0%), sadness (11.0%), fear (9.0%), anger (5.6%), disgust (4.2%), and contempt (3.4%).",
  dominantEmotions: [
    { emotion: 'happiness' as EmotionLabel, intensity: 54 },
    { emotion: 'surprise' as EmotionLabel, intensity: 42 },
    { emotion: 'neutral' as EmotionLabel, intensity: 35 },
    { emotion: 'sadness' as EmotionLabel, intensity: 11 },
    { emotion: 'fear' as EmotionLabel, intensity: 9 },
    { emotion: 'anger' as EmotionLabel, intensity: 5.6 },
    { emotion: 'disgust' as EmotionLabel, intensity: 4.2 },
    { emotion: 'contempt' as EmotionLabel, intensity: 3.4 }
  ]
};

const sampleTimeline: EmotionTimelineEntry[] = [
  {
    timestamp: "00:00",
    state: "Deep Focus" as TimelineStateType,
    description: "Viewers maintained high attention with balanced emotional responses",
    dominantEmotions: [
      { emotion: 'neutral' as EmotionLabel, intensity: 60 },
      { emotion: 'happiness' as EmotionLabel, intensity: 25 },
      { emotion: 'surprise' as EmotionLabel, intensity: 15 }
    ],
    notableEmotions: "neutral (60%), happiness (25%), surprise (15%)"
  },
  {
    timestamp: "00:15",
    state: "Active Learning" as TimelineStateType,
    description: "Increased emotional engagement with rising happiness",
    dominantEmotions: [
      { emotion: 'happiness' as EmotionLabel, intensity: 55 },
      { emotion: 'neutral' as EmotionLabel, intensity: 40 },
      { emotion: 'surprise' as EmotionLabel, intensity: 35 }
    ],
    notableEmotions: "happiness (55%), neutral (40%), surprise (35%)"
  },
  {
    timestamp: "00:30",
    state: "Peak Engagement" as TimelineStateType,
    description: "Strong positive response with elevated surprise",
    dominantEmotions: [
      { emotion: 'happiness' as EmotionLabel, intensity: 70 },
      { emotion: 'surprise' as EmotionLabel, intensity: 45 },
      { emotion: 'neutral' as EmotionLabel, intensity: 30 }
    ],
    notableEmotions: "happiness (70%), surprise (45%), neutral (30%), fear (7%)"
  },
  {
    timestamp: "00:45",
    state: "Strong Impact" as TimelineStateType,
    description: "Peak moment of surprise with mixed emotional responses",
    dominantEmotions: [
      { emotion: 'surprise' as EmotionLabel, intensity: 75 },
      { emotion: 'happiness' as EmotionLabel, intensity: 40 },
      { emotion: 'neutral' as EmotionLabel, intensity: 25 },
      { emotion: 'fear' as EmotionLabel, intensity: 15 }
    ],
    notableEmotions: "surprise (75%), happiness (40%), neutral (25%), fear (15%)"
  },
  {
    timestamp: "01:00",
    state: "Peak Engagement" as TimelineStateType,
    description: "Maximum positive emotional response achieved",
    dominantEmotions: [
      { emotion: 'happiness' as EmotionLabel, intensity: 80 },
      { emotion: 'surprise' as EmotionLabel, intensity: 40 },
      { emotion: 'neutral' as EmotionLabel, intensity: 20 }
    ],
    notableEmotions: "happiness (80%), surprise (40%), neutral (20%)"
  }
];

export function ResultsDemo() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="rounded-full bg-[#011BA1]/10 p-2">
              <Brain className="h-6 w-6 text-[#011BA1]" />
            </div>
            <span className="inline-flex items-center rounded-full bg-[#011BA1]/10 px-3 py-1 text-sm font-medium text-[#011BA1]">
              Advanced Analytics
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Detailed Emotion Analysis
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Track and analyze viewer emotions in real-time with our advanced analytics
          </p>
        </div>

        <div className="space-y-8">
          {/* Emotion Response Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Response Trend</CardTitle>
              <CardDescription>
                Track emotion intensities over time during viewer sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[550px] w-full">
                <EmotionalResponseTrend data={sampleData} />
              </div>
            </CardContent>
          </Card>

          {/* Overall Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Analysis</CardTitle>
              <CardDescription>
                Comprehensive analysis of emotional patterns and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverallAnalysisView analysis={sampleOverallAnalysis} />
            </CardContent>
          </Card>

          {/* Timeline Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Timeline</CardTitle>
              <CardDescription>
                Moment-by-moment breakdown of emotional states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionalTimelineView timeline={sampleTimeline} />
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}