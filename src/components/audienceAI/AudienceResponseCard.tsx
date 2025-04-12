// src/components/audienceAI/AudienceResponseCard.tsx
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Zap, LineChart, AlertCircle } from 'lucide-react';
import { EmotionLabel } from '@/components/emotion/types/emotion';
import type { AudienceEmotionData } from './trackers/MultiPersonEmotionTracker';

// Emotion colors for consistent visualization
const EMOTION_COLORS: Record<string, string> = {
  happiness: "#FFD700",   // Bright gold
  surprise: "#FF8C00",    // Dark orange
  neutral: "#808080",     // Gray
  sadness: "#4169E1",     // Royal blue
  anger: "#FF0000",       // Red
  disgust: "#228B22",     // Forest green
  fear: "#800080",        // Purple
  contempt: "#8B4513"     // Saddle brown
};

// For mapping emotion labels to more friendly display names
const EMOTION_DISPLAY_NAMES: Record<string, string> = {
  happiness: "Joy",
  surprise: "Surprise",
  neutral: "Neutral",
  sadness: "Sadness",
  anger: "Anger",
  disgust: "Disgust",
  fear: "Fear",
  contempt: "Contempt"
};

interface AudienceResponseCardProps {
  emotionData: AudienceEmotionData | null;
  isTracking: boolean;
  elapsedTime?: string;
}

export function AudienceResponseCard({ 
  emotionData, 
  isTracking
}: AudienceResponseCardProps) {
  const [emotionHistory, setEmotionHistory] = useState<AudienceEmotionData[]>([]);
  const [attentionScore, setAttentionScore] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  
  // Add to emotion history - Always record data for continuous timeline
  useEffect(() => {
    if (isTracking && emotionData) {
      // Always add to history, whether faces are detected or not
      // This maintains timeline continuity
      setEmotionHistory(prev => {
        const newHistory = [...prev, emotionData];
        if (newHistory.length > 40) { // Keep last 10 seconds
          return newHistory.slice(-40);
        }
        return newHistory;
      });
    } else if (!isTracking) {
      // Reset history when tracking stops
      setEmotionHistory([]);
    }
  }, [isTracking, emotionData]);
  
  // Calculate attention score with gradual decay when no faces detected
  useEffect(() => {
    if (emotionHistory.length === 0) {
      setAttentionScore(0);
      return;
    }
    
    const hasCurrentFaces = emotionData && emotionData.faceCount > 0;
    
    if (hasCurrentFaces) {
      // Calculate face consistency
      const maxFaceCount = Math.max(...emotionHistory.map(data => data.faceCount));
      if (maxFaceCount === 0) {
        setAttentionScore(prev => Math.max(0, prev - 5)); // Gradual decay
        return;
      }
      
      const faceCounts = emotionHistory.map(data => data.faceCount);
      const averageFaceCount = faceCounts.reduce((a, b) => a + b, 0) / faceCounts.length;
      const faceConsistency = averageFaceCount / maxFaceCount;
      
      // Calculate average neutral score (indicates focus)
      let totalNeutral = 0;
      emotionHistory.forEach(data => {
        totalNeutral += data.averageEmotions.neutral || 0;
      });
      const neutralFactor = totalNeutral / emotionHistory.length / 100; // 0-1 scale
      
      // Combine factors for attention score
      const rawAttentionScore = Math.min(100, Math.round((faceConsistency * 0.6 + neutralFactor * 0.4) * 100));
      
      setAttentionScore(prev => {
        const diff = rawAttentionScore - prev;
        return Math.round(prev + (diff * 0.2)); // Smooth transition
      });
    } else {
      // Gradual decay when no faces are detected
      setAttentionScore(prev => Math.max(0, prev - 5)); // Decay by 5% each update
    }
  }, [emotionHistory, emotionData]);
  
  // Calculate engagement score with gradual decay when no faces detected
  useEffect(() => {
    if (emotionHistory.length < 2) {
      setEngagementScore(0);
      return;
    }
    
    const hasCurrentFaces = emotionData && emotionData.faceCount > 0;
    
    if (hasCurrentFaces) {
      // Get recent emotion data (last 5 data points)
      const recentEmotions = emotionHistory.slice(-5);
      
      // Calculate average intensity of non-neutral emotions
      let totalIntensity = 0;
      let nonNeutralCount = 0;
      
      recentEmotions.forEach(data => {
        Object.entries(data.averageEmotions).forEach(([emotion, intensity]) => {
          if (emotion !== 'neutral' && intensity > 10) {
            totalIntensity += intensity;
            nonNeutralCount++;
          }
        });
      });
      
      const averageIntensity = nonNeutralCount > 0 ? totalIntensity / nonNeutralCount : 0;
      
      // Calculate diversity of emotions (how many different emotions are present)
      const significantEmotions = new Set();
      recentEmotions.forEach(data => {
        Object.entries(data.averageEmotions).forEach(([emotion, intensity]) => {
          if (intensity > 15 && emotion !== 'neutral') {
            significantEmotions.add(emotion);
          }
        });
      });
      
      // Combine factors for engagement score
      const intensityFactor = Math.min(1, averageIntensity / 50); // Scale intensity
      const diversityFactor = Math.min(1, significantEmotions.size / 3); // Reward having up to 3 emotions
      const rawEngagementScore = Math.round((intensityFactor * 0.7 + diversityFactor * 0.3) * 100);
      
      // Smooth transitions for better UX
      setEngagementScore(prev => {
        const diff = rawEngagementScore - prev;
        return Math.round(prev + (diff * 0.15));
      });
    } else {
      // Gradual decay when no faces are detected
      setEngagementScore(prev => Math.max(0, prev - 3)); 
    }
  }, [emotionHistory, emotionData]);
  
  // Get sorted emotion data for visualization
  const sortedEmotions = useMemo(() => {
    // Default empty emotions list with all emotions at 0%
    const emptyEmotions = Object.keys(EMOTION_COLORS).map(emotion => ({
      emotion: emotion as EmotionLabel,
      intensity: 0,
      color: EMOTION_COLORS[emotion]
    }));
    
    if (!emotionData) return emptyEmotions;
    
    // Map current emotions with values
    return Object.entries(emotionData.averageEmotions)
      .map(([emotion, intensity]) => ({
        emotion: emotion as EmotionLabel,
        intensity: Math.round(intensity),
        color: EMOTION_COLORS[emotion] || '#CCCCCC'
      }))
      .sort((a, b) => b.intensity - a.intensity);
  }, [emotionData]);
  
  // Format attention and engagement scores
  const formatScore = (score: number) => {
    return Math.round(score);
  };
  
  // Function to get color for attention meter
  const getAttentionColor = (score: number) => {
    if (score < 30) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Function to get color for engagement meter
  const getEngagementColor = (score: number) => {
    if (score < 30) return 'bg-blue-300';
    if (score < 70) return 'bg-blue-500';
    return 'bg-blue-700';
  };
  
  // Function to get descriptive text based on score
  const getScoreDescription = (score: number, type: 'attention' | 'engagement') => {
    if (score < 30) return type === 'attention' ? 'Low' : 'Minimal';
    if (score < 70) return type === 'attention' ? 'Moderate' : 'Active';
    return type === 'attention' ? 'High' : 'Strong';
  };
  
  // Check if no faces are detected during tracking
  const noFacesDetected = isTracking && emotionData && emotionData.faceCount === 0;
  
  if (!isTracking) {
    return (
      <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground">
        Start tracking to see audience reactions
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Emotion Distribution */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-slate-700" />
              <div className="font-medium">Emotion Distribution</div>
            </div>
            {noFacesDetected && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <AlertCircle className="h-3 w-3" />
                <span>No audience detected</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {Object.keys(EMOTION_COLORS).map(emotion => {
              const emotionData = sortedEmotions.find(e => e.emotion === emotion) || 
                { emotion: emotion as EmotionLabel, intensity: 0, color: EMOTION_COLORS[emotion] };
              
              return (
                <div key={emotion} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>{EMOTION_DISPLAY_NAMES[emotion] || emotion}</span>
                    <span>{Math.round(emotionData.intensity)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${emotionData.intensity}%`,
                        backgroundColor: emotionData.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Audience Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Attention Meter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-slate-700" />
              <div className="font-medium">Attention Level</div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${getAttentionColor(attentionScore)}`}
                style={{ width: `${attentionScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-500">
                {getScoreDescription(attentionScore, 'attention')}
              </span>
              <span className="text-sm font-medium">
                {formatScore(attentionScore)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Engagement Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-slate-700" />
              <div className="font-medium">Engagement</div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${getEngagementColor(engagementScore)}`}
                style={{ width: `${engagementScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-500">
                {getScoreDescription(engagementScore, 'engagement')}
              </span>
              <span className="text-sm font-medium">
                {formatScore(engagementScore)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}