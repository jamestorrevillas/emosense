// src/components/audienceAI/history/visualizations/AudienceEmotionalResponseTrend.tsx
import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface AudienceDataPoint {
  timestamp: number;
  emotions: Record<string, number>;
  faceCount: number;
}

interface AudienceEmotionalResponseTrendProps {
  data: AudienceDataPoint[];
  sessionDuration?: number;
}

// Emotion colors for consistent visualization
const EMOTION_COLORS = {
  happiness: "#FFD700",   // Bright gold
  surprise: "#FF8C00",    // Dark orange
  neutral: "#808080",     // Gray
  sadness: "#4169E1",     // Royal blue
  anger: "#FF0000",       // Red
  disgust: "#228B22",     // Forest green
  fear: "#800080",        // Purple
  contempt: "#8B4513"     // Saddle brown
};

export function AudienceEmotionalResponseTrend({ 
  data, 
  sessionDuration 
}: AudienceEmotionalResponseTrendProps) {
  // Aggregate and sample data to prevent cluttering
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    // For longer sessions, aggregate data points to reduce visual clutter
    // Group by time intervals based on session length
    const intervalSize = calculateOptimalIntervalSize(sortedData, sessionDuration);
    
    // Group data points by intervals
    const groupedData: Record<number, AudienceDataPoint[]> = {};
    
    sortedData.forEach(point => {
      // Round timestamp to nearest interval
      const intervalKey = Math.floor(point.timestamp / intervalSize) * intervalSize;
      
      if (!groupedData[intervalKey]) {
        groupedData[intervalKey] = [];
      }
      
      groupedData[intervalKey].push(point);
    });
    
    // Aggregate emotions within each interval
    return Object.entries(groupedData).map(([timestamp, points]) => {
      const emotions: Record<string, number> = {};
      
      // Get all unique emotions
      const allEmotions = new Set<string>();
      points.forEach(point => {
        Object.keys(point.emotions).forEach(emotion => {
          allEmotions.add(emotion);
        });
      });
      
      // Calculate average for each emotion
      allEmotions.forEach(emotion => {
        let total = 0;
        let count = 0;
        
        points.forEach(point => {
          if (point.emotions[emotion] !== undefined) {
            total += point.emotions[emotion];
            count++;
          }
        });
        
        emotions[emotion] = count > 0 ? total / count : 0;
      });
      
      return {
        timestamp: parseInt(timestamp),
        ...emotions
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [data, sessionDuration]);

  // Get all unique emotions
  const emotions = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    const emotionSet = new Set<string>();
    chartData.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp') {
          emotionSet.add(key);
        }
      });
    });
    
    return Array.from(emotionSet);
  }, [chartData]);

  // Calculate domain for X-axis
  const xDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 60000]; // Default 1 minute
    
    // If sessionDuration is provided and reasonable, use it
    if (sessionDuration && sessionDuration > 0) {
      return [0, sessionDuration];
    }
    
    // Otherwise calculate from data
    const minTime = Math.min(...data.map(d => d.timestamp));
    const maxTime = Math.max(...data.map(d => d.timestamp));
    return [minTime, maxTime];
  }, [data, sessionDuration]);

  // Helper function to calculate optimal interval size based on data
  function calculateOptimalIntervalSize(data: AudienceDataPoint[], duration?: number): number {
    if (!data || data.length === 0) return 5000; // Default 5 seconds
    
    // Calculate total time span
    const minTime = Math.min(...data.map(d => d.timestamp));
    const maxTime = Math.max(...data.map(d => d.timestamp));
    const timeSpan = duration || (maxTime - minTime);
    
    // Set target number of data points based on screen width
    // Aim for roughly 1 data point per ~50-100px of chart width
    const targetPointCount = 30; // Adjust based on typical chart width
    
    // Calculate interval size (round to nearest sensible interval)
    const interval = Math.max(1000, Math.ceil(timeSpan / targetPointCount));
    
    // Round to nearest "clean" interval
    if (interval < 5000) {
      return 5000; // 5 seconds
    } else if (interval < 15000) {
      return 15000; // 15 seconds
    } else if (interval < 30000) {
      return 30000; // 30 seconds
    } else if (interval < 60000) {
      return 60000; // 1 minute
    } else {
      return Math.ceil(interval / 60000) * 60000; // Round to nearest minute
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center h-64">
        <InfoIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-slate-500 text-center">No audience emotion data available for this session.</p>
      </div>
    );
  }

  return (
    <CardContent className="pt-6 space-y-4">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => {
                // Convert to seconds and format as MM:SS
                const seconds = Math.floor(value / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
              }}
              label={{ 
                value: 'Time (MM:SS)', 
                position: 'bottom',
                offset: 20
              }}
              domain={xDomain}
              // Let the aggregated data control intervals rather than forcing them
              ticks={chartData.map(d => d.timestamp)}
            />
            <YAxis 
              label={{ 
                value: 'Average Intensity (%)', 
                angle: -90, 
                position: 'insideLeft', 
                offset: 10,
                style: { textAnchor: 'middle' }
              }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              labelFormatter={(value: number) => {
                const seconds = Math.floor(value / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ 
                paddingTop: '40px'
              }}
            />
            
            {emotions.map(emotion => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                stroke={EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || '#999'}
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  );
}