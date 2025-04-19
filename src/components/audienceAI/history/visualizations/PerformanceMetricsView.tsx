// src/components/audienceAI/history/visualizations/PerformanceMetricsView.tsx
import { Info, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { PresentationMetrics } from "@/types/audienceAI";

interface PerformanceMetricsViewProps {
  metrics: PresentationMetrics;
}

interface MetricInfo {
  name: string;
  description: string;
  improvementTips: string[];
}

const metricsInfo: Record<keyof PresentationMetrics, MetricInfo> = {
  attentionScore: {
    name: "Attention Score",
    description: "Measures how consistently the audience was facing the camera and paying attention",
    improvementTips: [
      "Maintain eye contact with various parts of the audience",
      "Use movement or gestures to re-engage when attention drops",
      "Ask questions to keep the audience involved"
    ]
  },
  engagementScore: {
    name: "Engagement",
    description: "Indicates how emotionally engaged the audience was during your presentation",
    improvementTips: [
      "Include compelling stories or examples",
      "Use humor appropriately to boost positive engagement",
      "Incorporate interactive elements in your presentation"
    ]
  },
  emotionalImpactScore: {
    name: "Emotional Impact",
    description: "Reflects how strongly your content evoked emotional responses",
    improvementTips: [
      "Create emotional contrast in your delivery",
      "Use vivid language and imagery",
      "Personalize content to resonate with your specific audience"
    ]
  },
  overallScore: {
    name: "Overall Score",
    description: "Combined rating of attention, engagement, and emotional impact",
    improvementTips: [
      "Work on areas with the lowest scores first",
      "Analyze the timeline to identify specific moments for improvement",
      "Practice with different audience types to build versatility"
    ]
  }
};

// Function to get color based on score
const getColorForScore = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-green-400";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
};

export function PerformanceMetricsView({ metrics }: PerformanceMetricsViewProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Format percentage without decimal places
  const formatPercentage = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "0%";
    return `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(Object.keys(metrics) as Array<keyof PresentationMetrics>).map((key) => {
          const value = metrics[key];
          const info = metricsInfo[key];
          const colorClass = getColorForScore(value);
          
          return (
            <div key={key} className="border rounded-xl p-4 space-y-3 relative group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{info.name}</p>
                
                <button 
                  className="p-1 rounded-full hover:bg-slate-100 relative"
                  onClick={() => setActiveTooltip(activeTooltip === key.toString() ? null : key.toString())}
                >
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              
              {/* Simple tooltip */}
              {activeTooltip === key.toString() && (
                <Card className="absolute right-0 top-12 z-50 p-3 w-64 shadow-lg bg-white text-sm">
                  <div className="space-y-2">
                    <p>{info.description}</p>
                    {value < 70 && (
                      <>
                        <p className="font-medium">Improvement tips:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {info.improvementTips.map((tip, i) => (
                            <li key={i} className="text-sm">{tip}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </Card>
              )}
              
              <p className="text-3xl font-bold">{formatPercentage(value)}</p>
              
              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colorClass} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Beta Warning Note */}
      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm flex gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Note:</strong> The emotion detection feature is currently in beta and experimental. 
          Results may not guarantee 100% accuracy, and emotions with very low intensities might be
          misdetections. This feature is continuously being improved for better accuracy.
        </p>
      </div>
    </div>
  );
}