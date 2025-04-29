// src/components/projects/analytics/EmotionAnalytics.tsx
import { useState, useEffect } from 'react';
import { collection, doc, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmotionalResponseTrend } from '@/components/emotion/visualization/EmotionalResponseTrend';
import { OverallAnalysisView } from '@/components/emotion/visualization/OverallAnalysisView';
import { EmotionalTimelineView } from '@/components/emotion/visualization/EmotionalTimelineView';
import { EmotionAnalyzer } from '@/components/emotion/analysis/EmotionAnalyzer';
import { Loader2 } from 'lucide-react';
import type { EmotionLabel } from '@/components/emotion/types/emotion';
import type { OverallAnalysis, EmotionTimelineEntry } from '@/components/emotion/types/analysis';

interface AggregatedEmotionData {
  timestamp: number;
  emotions: Array<{
    emotion: EmotionLabel;
    avgIntensity: number;
  }>;
  dominantEmotion: EmotionLabel;
  totalResponses: number;
}

interface EmotionDataPoint {
  timestamp: number;
  emotions: Array<{
    emotion: EmotionLabel;
    intensity: number;
  }>;
  faceDetected: boolean;
  dominantEmotion: EmotionLabel;
}

interface EmotionAnalyticsProps {
  projectId: string;
}

export function EmotionAnalytics({ projectId }: EmotionAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedEmotionData[]>([]);
  const [analysis, setAnalysis] = useState<{
    overall: OverallAnalysis | null;
    timeline: EmotionTimelineEntry[];
  }>({ overall: null, timeline: [] });

  useEffect(() => {
    const responsesRef = collection(doc(db, "projects", projectId), "responses");
    const responsesQuery = query(responsesRef);

    const unsubscribe = onSnapshot(responsesQuery, (snapshot) => {
      try {
        // Get all completed responses with emotion data
        const responses = snapshot.docs
          .filter(doc => 
            doc.data().status === 'completed' && 
            doc.data().data?.emotion?.data?.length > 0
          );

        if (responses.length === 0) {
          setLoading(false);
          return;
        }

        // Aggregate emotion data across all responses
        const timeMap = new Map<number, {
          emotions: Map<string, number[]>;
          count: number;
        }>();

        // Process each response
        responses.forEach(doc => {
          const emotionData = doc.data().data.emotion.data as EmotionDataPoint[];
          
          emotionData.forEach(point => {
            const timestamp = Math.floor(point.timestamp / 1000) * 1000; // Round to nearest second
            
            if (!timeMap.has(timestamp)) {
              timeMap.set(timestamp, {
                emotions: new Map(),
                count: 0
              });
            }
            
            const timePoint = timeMap.get(timestamp)!;
            timePoint.count++;

            point.emotions.forEach(({ emotion, intensity }) => {
              if (!timePoint.emotions.has(emotion)) {
                timePoint.emotions.set(emotion, []);
              }
              timePoint.emotions.get(emotion)!.push(intensity);
            });
          });
        });

        // Convert aggregated data to final format with proper types
        const aggregated: AggregatedEmotionData[] = Array.from(timeMap.entries())
          .map(([timestamp, data]) => {
            const emotions = Array.from(data.emotions.entries()).map(([emotion, intensities]) => ({
              emotion: emotion as EmotionLabel,
              avgIntensity: intensities.reduce((a, b) => a + b, 0) / intensities.length
            }));

            // Find dominant emotion with proper typing
            const dominantEmotionObj = emotions.reduce((prev, current) => 
              current.avgIntensity > prev.avgIntensity ? current : prev
            );

            return {
              timestamp,
              emotions,
              dominantEmotion: dominantEmotionObj.emotion,
              totalResponses: data.count
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);

        setAggregatedData(aggregated);

        // Generate analysis using EmotionAnalyzer
        const analyzer = new EmotionAnalyzer();
        const timeline = analyzer.processTimelineData(aggregated);
        const overall = analyzer.generateOverallAnalysis(aggregated);

        setAnalysis({ 
          overall: overall as OverallAnalysis, 
          timeline: timeline as EmotionTimelineEntry[] 
        });
        setLoading(false);
      } catch (err) {
        console.error('Error processing emotion data:', err);
        setError('Failed to process emotion data');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (aggregatedData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No emotion data collected yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Beta Notice Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p><strong>Note:</strong> The emotion detection feature is currently in beta and experimental. Results may not guarantee 100% accuracy, and emotions with very low intensities might be misdetections. This feature is continuously being improved for better accuracy.</p>
      </div>
  
      {/* Emotion Response Trend - Now wrapped in Card */}
      <Card>
        <CardHeader>
          <CardTitle>Emotional Response Trend</CardTitle>
          <CardDescription>
            Track emotion intensities over time during viewer sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmotionalResponseTrend 
            data={aggregatedData}
          />
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
              {analysis.overall ? (
                <OverallAnalysisView analysis={analysis.overall} />
              ) : (
                <div className="p-8 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-center">
                    Track your emotions to see an overall analysis of your emotional responses.
                    <br />
                    <span className="text-sm">
                      You'll see dominant emotions, patterns, and key observations.
                    </span>
                  </p>
                </div>
              )}
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
          {analysis.timeline.length > 0 ? (
            <EmotionalTimelineView timeline={analysis.timeline} />
          ) : (
            <div className="p-8 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-center">
                Start tracking to see a detailed timeline of your emotional states.
                <br />
                <span className="text-sm">
                  The timeline will show key emotional moments and transitions.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}