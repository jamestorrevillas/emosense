// src/components/emotion/visualization/OverallAnalysisView.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmotionAnalyzer } from "@/components/emotion/analysis/EmotionAnalyzer";
import { OverallRules } from "@/components/emotion/analysis/rules/OverallRules";
import type { OverallAnalysis, EmotionMeasurement } from '@/components/emotion/types/analysis';

interface OverallAnalysisViewProps {
  analysis: OverallAnalysis;
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
const getEmotionSummary = (emotion: EmotionMeasurement): string => {
  const patterns = OverallRules.emotionPatterns[emotion.emotion as keyof typeof OverallRules.emotionPatterns];
  
  if (!patterns) return "";

  if (emotion.intensity >= patterns.veryHigh.threshold) return patterns.veryHigh.summary;
  if (emotion.intensity >= patterns.high.threshold) return patterns.high.summary;
  if (emotion.intensity >= patterns.moderate.threshold) return patterns.moderate.summary;
  if (emotion.intensity >= patterns.low.threshold) return patterns.low.summary;
  return patterns.veryLow.summary;
};

// Helper function to get emotion description
const getEmotionDescription = (emotion: EmotionMeasurement): string => {
  const patterns = OverallRules.emotionPatterns[emotion.emotion as keyof typeof OverallRules.emotionPatterns];
  
  if (!patterns) return "";

  if (emotion.intensity >= patterns.veryHigh.threshold) return patterns.veryHigh.description;
  if (emotion.intensity >= patterns.high.threshold) return patterns.high.description;
  if (emotion.intensity >= patterns.moderate.threshold) return patterns.moderate.description;
  if (emotion.intensity >= patterns.low.threshold) return patterns.low.description;
  return patterns.veryLow.description;
};

export function OverallAnalysisView({ analysis }: OverallAnalysisViewProps) {
  const analyzer = new EmotionAnalyzer();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Analysis</CardTitle>
        <CardDescription>Analysis based on full session data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <h3 className="font-medium text-lg">Emotional Response Analysis</h3>
          
          {analysis.dominantEmotions.map((emotion: EmotionMeasurement) => {
            const level = analyzer.getIntensityLevel(emotion.emotion, emotion.intensity);
            return (
              <div key={emotion.emotion} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{emotion.emotion}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-muted px-2 py-1 rounded-full">
                      {emotion.intensity.toFixed(4)}%
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

        <Separator />
      </CardContent>
    </Card>
  );
}