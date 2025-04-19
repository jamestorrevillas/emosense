// src/components/audienceAI/history/visualizations/AudienceEmotionalTimelineView.tsx
import { Badge } from "@/components/ui/badge";
import { InfoIcon, Users } from "lucide-react";
import { AudienceAnalyzer } from "../AudienceAnalyzer";
import type { AudienceTimelineEntry } from '@/types/audienceAI';
import type { EmotionLabel } from '@/components/emotion/types/emotion';

interface AudienceEmotionalTimelineViewProps {
  timeline: AudienceTimelineEntry[];
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

// Helper to format timestamp properly
const formatTimestamp = (timestamp: string): string => {
  // If it's already in MM:SS format, return as is
  if (timestamp.includes(':')) return timestamp;
  
  // Try to parse as a number
  const time = parseInt(timestamp);
  if (!isNaN(time)) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  
  // Fallback to original format
  return timestamp;
};

export function AudienceEmotionalTimelineView({ timeline }: AudienceEmotionalTimelineViewProps) {
  const analyzer = new AudienceAnalyzer();

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center h-64">
        <InfoIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-slate-500 text-center">No audience timeline data available for this session.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6 max-h-[400px] overflow-y-auto">
        {timeline.map((entry, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-start gap-4">
              <div className="text-sm font-mono text-primary w-16 pt-1">
                {formatTimestamp(entry.timestamp)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg capitalize">
                    {entry.state}
                  </h3>
                  {entry.faceCount > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {entry.faceCount}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {entry.description}
                </p>
                {entry.dominantEmotions && entry.dominantEmotions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.dominantEmotions.slice(0, 3).map((emotion, i) => {
                      const level = analyzer.getIntensityLevel(emotion.emotion as EmotionLabel, emotion.intensity);
                      return (
                        <Badge 
                          key={i}
                          variant="secondary"
                          className="capitalize"
                        >
                          {emotion.emotion}: {emotion.intensity.toFixed(1)}% ({formatIntensityLevel(level)})
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
    </div>
  );
}