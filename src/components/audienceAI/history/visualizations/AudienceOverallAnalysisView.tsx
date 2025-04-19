// src/components/audienceAI/history/visualizations/AudienceOverallAnalysisView.tsx
import { Separator } from "@/components/ui/separator";
import { InfoIcon } from "lucide-react";
import { AudienceAnalyzer } from "../AudienceAnalyzer";
import { AudienceOverallRules } from "../rules/AudienceOverallRules";
import type { AudienceOverallAnalysis, TrackedEmotion } from '@/types/audienceAI';
import type { EmotionLabel } from '@/components/emotion/types/emotion';

interface AudienceOverallAnalysisViewProps {
  analysis: AudienceOverallAnalysis | null;
}

// Helper function to format intensity levels
const formatIntensityLevel = (level: string): string => {
  return level
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

// Helper function to get emotion summary
const getEmotionSummary = (emotion: TrackedEmotion): string => {
  const patterns = AudienceOverallRules.emotionPatterns[emotion.emotion as keyof typeof AudienceOverallRules.emotionPatterns];
  
  if (!patterns) return "";

  if (emotion.intensity >= patterns.veryHigh.threshold) return patterns.veryHigh.summary;
  if (emotion.intensity >= patterns.high.threshold) return patterns.high.summary;
  if (emotion.intensity >= patterns.moderate.threshold) return patterns.moderate.summary;
  if (emotion.intensity >= patterns.low.threshold) return patterns.low.summary;
  return patterns.veryLow.summary;
};

// Helper function to get emotion description
const getEmotionDescription = (emotion: TrackedEmotion): string => {
  const patterns = AudienceOverallRules.emotionPatterns[emotion.emotion as keyof typeof AudienceOverallRules.emotionPatterns];
  
  if (!patterns) return "";

  if (emotion.intensity >= patterns.veryHigh.threshold) return patterns.veryHigh.description;
  if (emotion.intensity >= patterns.high.threshold) return patterns.high.description;
  if (emotion.intensity >= patterns.moderate.threshold) return patterns.moderate.description;
  if (emotion.intensity >= patterns.low.threshold) return patterns.low.description;
  return patterns.veryLow.description;
};

export function AudienceOverallAnalysisView({ analysis }: AudienceOverallAnalysisViewProps) {
  const analyzer = new AudienceAnalyzer();

  if (!analysis) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center h-64">
        <InfoIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-slate-500 text-center">No audience analysis data available for this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{analysis.primaryResponse}</h3>
        <p className="text-muted-foreground">
          {analysis.emotionalPattern}
        </p>
        <p className="text-muted-foreground mt-2">
          {analysis.notableObservation}
        </p>
      </div>

      <Separator />

      {/* Emotional Response Analysis */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Audience Emotional Response Analysis</h3>
        
        {analysis.dominantEmotions.slice(0, 4).map((emotion: TrackedEmotion) => {
          const level = analyzer.getIntensityLevel(emotion.emotion as EmotionLabel, emotion.intensity);
          return (
            <div key={emotion.emotion} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{emotion.emotion}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-muted px-2 py-1 rounded-full">
                    {emotion.intensity.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({formatIntensityLevel(level)})
                  </span>
                </div>
              </div>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p className="font-medium text-primary">
                  {getEmotionSummary(emotion)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {getEmotionDescription(emotion)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}