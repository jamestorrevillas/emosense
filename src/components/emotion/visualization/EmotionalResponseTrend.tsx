// src/components/emotion/visualization/EmotionalResponseTrend.tsx
import { Card, CardContent } from "@/components/ui/card";
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

interface AggregatedEmotionData {
  timestamp: number;
  emotions: {
    emotion: string;
    avgIntensity: number;
  }[];
  dominantEmotion: string;
  totalResponses: number;
}

interface EmotionalResponseTrendProps {
  data: AggregatedEmotionData[];
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

export function EmotionalResponseTrend({ data }: EmotionalResponseTrendProps) {
  // Format data for chart
  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    ...Object.fromEntries(
      point.emotions.map(e => [e.emotion, e.avgIntensity])
    ),
    totalResponses: point.totalResponses
  }));

  // Get all unique emotions
  const emotions = Array.from(
    new Set(data.flatMap(point => point.emotions.map(e => e.emotion)))
  );

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mb-4">
        <p><strong>Note:</strong> The emotion detection feature is currently in beta and experimental. Results may not guarantee 100% accuracy, and emotions with very low intensities might be misdetections. This feature is continuously being improved for better accuracy.</p>
      </div>
      <Card>
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
                />
                <YAxis 
                  label={{ 
                    value: 'Average Intensity (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: 10 
                  }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(2)}%`}
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
                    paddingTop: '40px' // Add padding above legend to create space from axis label
                  }}
                />
                
                {emotions.map(emotion => (
                  <Line
                    key={emotion}
                    type="monotone"
                    dataKey={emotion}
                    name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    stroke={EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}  