// src/components/audienceAI/history/SessionDetails.tsx
import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar, Clock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AudienceAnalyzer } from "./AudienceAnalyzer";
import { PerformanceMetricsView } from "./visualizations/PerformanceMetricsView";
import { AudienceEmotionalResponseTrend } from "./visualizations/AudienceEmotionalResponseTrend";
import { AudienceOverallAnalysisView } from "./visualizations/AudienceOverallAnalysisView";
import { AudienceEmotionalTimelineView } from "./visualizations/AudienceEmotionalTimelineView";
import type { AudienceSession, AudienceEmotionalMoment, AudienceOverallAnalysis, AudienceTimelineEntry } from "@/types/audienceAI";
import type { EmotionLabel } from '@/components/emotion/types/emotion';

interface SessionDetailsProps {
  session: AudienceSession;
  onBack: () => void;
}

export default function SessionDetails({ session, onBack }: SessionDetailsProps) {
  const [emotionData, setEmotionData] = useState<AudienceEmotionalMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<{
    overall: AudienceOverallAnalysis | null;
    timeline: AudienceTimelineEntry[];
  }>({ overall: null, timeline: [] });
  
  // Define a union type for various date formats
  type DateValue = 
    | string 
    | Date 
    | { toDate: () => Date }
    | { seconds: number; nanoseconds?: number }
    | number 
    | null 
    | undefined;
    
  // Format date for display with robust error handling for Firestore timestamps
  const formatDate = (dateValue: DateValue) => {
    try {
      // Handle different date formats from Firestore
      if (!dateValue) return "No date available";
      
      let date;
      
      // If it's a Firestore Timestamp
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        date = dateValue.toDate();
      } 
      // If it's a timestamp object with seconds and nanoseconds
      else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        date = new Date(dateValue.seconds * 1000);
      }
      // If it's a string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // If it's already a Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // If it's a number (timestamp)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Otherwise use as is
      else {
        date = new Date(String(dateValue));
      }
      
      // Check if the date is valid
      if (!date || isNaN(date.getTime())) {
        return "No date available";
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "No date available";
    }
  };
  
  // Format duration for display
  const formatDuration = (ms: number) => {
    if (!ms || isNaN(ms)) return "0 min 0 sec";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes} min ${seconds} sec`;
  };

  // Helper function to normalize timestamps relative to session start
  const normalizeTimestamps = (moments: AudienceEmotionalMoment[]): AudienceEmotionalMoment[] => {
    if (!moments || !moments.length) return moments;
    
    // Find the earliest timestamp
    const startTime = Math.min(...moments.map(m => m.timestamp));
    
    // Normalize all timestamps relative to the start
    return moments.map(moment => ({
      ...moment,
      timestamp: moment.timestamp - startTime // Make timestamps relative to session start
    }));
  };

  // Fetch emotion data
  useEffect(() => {
    const fetchEmotionData = async () => {
      try {
        setLoading(true);
        
        const emotionCollectionRef = collection(db, `audienceSessions/${session.id}/emotionData`);
        const emotionSnapshot = await getDocs(query(emotionCollectionRef));
        
        if (emotionSnapshot.empty) {
          setLoading(false);
          return;
        }
        
        // Convert Firestore data to AudienceEmotionalMoment format
        let moments: AudienceEmotionalMoment[] = emotionSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Map emotions data with type assertion for EmotionLabel
          const emotions = data.averageEmotions ? 
            Object.entries(data.averageEmotions).map(([emotion, intensity]) => ({
              emotion: emotion as EmotionLabel,
              intensity: Number(intensity)
            })) : [];
            
          return {
            timestamp: data.timestamp,
            faceCount: data.faceCount || 0,
            faceDetected: data.faceCount > 0,
            emotions
          };
        }).sort((a, b) => a.timestamp - b.timestamp);
        
        // Normalize timestamps to make them relative to session start
        moments = normalizeTimestamps(moments);
        
        setEmotionData(moments);
        
        if (moments.length > 0) {
          // Process data with our analyzer
          const analyzer = new AudienceAnalyzer();
          
          try {
            const overallAnalysis = analyzer.generateOverallAnalysis(moments);
            const timelineEntries = analyzer.processTimelineData(moments);
            
            setAnalysis({
              overall: overallAnalysis,
              timeline: timelineEntries
            });
          } catch (analysisError) {
            console.error("Error analyzing data:", analysisError);
            setAnalysis({ overall: null, timeline: [] });
          }
        }
        
      } catch (error) {
        console.error("Error fetching emotion data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmotionData();
  }, [session.id]);

  // Create data points for the chart
  const chartData = emotionData.map(moment => ({
    timestamp: moment.timestamp,
    emotions: Object.fromEntries(moment.emotions.map(e => [e.emotion, e.intensity])),
    faceCount: moment.faceCount
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{session.title}</CardTitle>
          <CardDescription>
            Session recorded on {formatDate(session.createdAt)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Session Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Recorded</p>
                <p className="text-base">{formatDate(session.createdAt)}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-base">{formatDuration(session.duration)}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Audience Size</p>
                <p className="text-base">{session.maxFaceCount || 0} {(session.maxFaceCount || 0) === 1 ? 'person' : 'people'}</p>
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Performance Metrics - Updated UI to match image */}
          {session.presentationMetrics && (
            <>
              <Separator />
              <PerformanceMetricsView metrics={session.presentationMetrics} />
            </>
          )}
          
          <Separator />
          
          {/* Visualizations with Loading States */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading session analysis...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Emotional Response Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Emotional Response Trend</CardTitle>
                  <CardDescription>
                    Track emotion intensities over time during viewer sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudienceEmotionalResponseTrend 
                    data={chartData}
                    sessionDuration={session.duration}
                  />
                </CardContent>
              </Card>
              
              {/* 2. Overall Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Analysis</CardTitle>
                  <CardDescription>
                    Comprehensive analysis of emotional patterns and responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudienceOverallAnalysisView analysis={analysis.overall} />
                </CardContent>
              </Card>
              
              {/* 3. Emotional Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Emotional Timeline</CardTitle>
                  <CardDescription>
                    Moment-by-moment breakdown of emotional states
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudienceEmotionalTimelineView timeline={analysis.timeline} />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}