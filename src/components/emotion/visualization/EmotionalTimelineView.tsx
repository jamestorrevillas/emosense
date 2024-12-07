// src/components/emotion/visualization/EmotionalTimelineView.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmotionAnalyzer } from "@/components/emotion/analysis/EmotionAnalyzer";
import type { EmotionTimelineEntry } from '@/components/emotion/types/analysis';

interface EmotionalTimelineViewProps {
  timeline: EmotionTimelineEntry[];
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

export function EmotionalTimelineView({ timeline }: EmotionalTimelineViewProps) {
  const analyzer = new EmotionAnalyzer();

  return (
    <Card>
      <CardContent>
        <div className="space-y-6 pt-4 mt-4 max-h-[400px] overflow-y-auto">
          {timeline.map((entry, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-4">
                <div className="text-sm font-mono text-primary w-16 pt-1">
                  {entry.timestamp}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg capitalize">
                    {entry.state}
                  </div>
                  <p className="text-muted-foreground">
                    {entry.description}
                  </p>
                  {entry.notableEmotions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.dominantEmotions.map((emotion, i) => {
                        const level = analyzer.getIntensityLevel(emotion.emotion, emotion.intensity);
                        return (
                          <Badge 
                            key={i}
                            variant="secondary"
                            className="capitalize"
                          >
                            {emotion.emotion}: {emotion.intensity.toFixed(2)}% ({formatIntensityLevel(level)})
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}