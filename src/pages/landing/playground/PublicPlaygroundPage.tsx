// src/pages/landing/playground/PublicPlaygroundPage.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import { WebcamFeed } from '@/components/emotion/tracker/WebcamFeed';
import { EmotionTracker } from '@/components/emotion/tracker/EmotionTracker';
import { FaceTracker } from '@/components/emotion/tracker/FaceTracker';
import { EmotionAnalyzer } from '@/components/emotion/analysis/EmotionAnalyzer';
import { EmotionalResponseTrend } from '@/components/emotion/visualization/EmotionalResponseTrend';
import { OverallAnalysisView } from '@/components/emotion/visualization/OverallAnalysisView';
import { EmotionalTimelineView } from '@/components/emotion/visualization/EmotionalTimelineView';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, AlertCircle, Info, Webcam, Camera, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EmotionData, ProcessingStatus, EmotionLabel } from '@/components/emotion/types/emotion';
import type { EmotionalMoment, EmotionTimelineEntry, OverallAnalysis } from '@/components/emotion/types/analysis';
import type { Box } from '@vladmandic/face-api';
import { Container } from '../sections/Container';

interface AggregatedEmotionData {
  timestamp: number;
  emotions: Array<{
    emotion: EmotionLabel;
    avgIntensity: number;
  }>;
  dominantEmotion: EmotionLabel;
  totalResponses: number;
}

interface EmotionSummary {
  emotion: EmotionLabel;
  intensity: number;
}

export function PublicPlaygroundPage() {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [webStream, setWebStream] = useState<MediaStream | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    fps: 0,
    modelLoaded: false
  });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [isFaceDetectedStable, setIsFaceDetectedStable] = useState(false);
  const [detectedFace, setDetectedFace] = useState<HTMLCanvasElement | null>(null);
  const [faceBox, setFaceBox] = useState<Box | null>(null);
  const [trackingStartTime, setTrackingStartTime] = useState<number | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionalMoment[]>([]);
  const [analysis, setAnalysis] = useState<{
    overall: OverallAnalysis | null;
    timeline: EmotionTimelineEntry[];
  }>({ overall: null, timeline: [] });

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setIsTracking(false);
      setCameraEnabled(false);
      setCurrentEmotion(null);
      setDetectedFace(null);
      setFaceBox(null);
      setEmotionData([]);
      setAnalysis({ overall: null, timeline: [] });
    };
  }, []);

  // Handle camera toggle
  const handleCameraToggle = (enabled: boolean) => {
    if (!enabled) {
      if (isTracking) {
        setIsTracking(false);
      }
      
      if (webStream) {
        webStream.getTracks().forEach(track => {
          track.stop();
          webStream.removeTrack(track);
        });
      }
      
      setWebStream(null);
      setStream(null);
      setCurrentEmotion(null);
      setDetectedFace(null);
      setFaceBox(null);
      setIsFaceDetectedStable(false);
    }
    
    setCameraEnabled(enabled);
  };

  // Transform emotion data for analysis
  const aggregatedData = useMemo((): AggregatedEmotionData[] => {
    if (!trackingStartTime) return [];

    // Group data by second intervals
    const groupedData = emotionData.reduce((acc: Map<number, EmotionalMoment[]>, moment) => {
      const second = Math.floor((moment.timestamp - trackingStartTime) / 1000) * 1000;
      if (!acc.has(second)) {
        acc.set(second, []);
      }
      acc.get(second)!.push(moment);
      return acc;
    }, new Map());

    // Convert to aggregated format
    return Array.from(groupedData.entries()).map(([timestamp, moments]): AggregatedEmotionData => {
      // Calculate average intensities for each emotion
      const emotionSums = new Map<EmotionLabel, number>();
      const emotionCounts = new Map<EmotionLabel, number>();

      moments.forEach((moment: EmotionalMoment) => {
        moment.emotions.forEach(({ emotion, intensity }: EmotionSummary) => {
          emotionSums.set(emotion, (emotionSums.get(emotion) || 0) + intensity);
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
        });
      });

      // Calculate averages and find dominant emotion
      const emotions = Array.from(emotionSums.entries()).map(([emotion, sum]) => ({
        emotion,
        avgIntensity: sum / emotionCounts.get(emotion)!
      }));

      const dominantEmotion = emotions.reduce((prev, curr) => 
        curr.avgIntensity > prev.avgIntensity ? curr : prev
      ).emotion;

      return {
        timestamp,
        emotions,
        dominantEmotion,
        totalResponses: moments.length
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [emotionData, trackingStartTime]);

  const handleStreamReady = useCallback((mediaStream: MediaStream) => {
    setWebStream(mediaStream);
    setStream(mediaStream);
  }, []);

  const handleEmotionDetected = useCallback((data: EmotionData) => {
    setCurrentEmotion(data);
    
    if (isTracking) {
      const moment: EmotionalMoment = {
        timestamp: Date.now(),
        emotions: Object.entries(data.scores).map(([emotion, intensity]) => ({
          emotion: emotion as EmotionLabel,
          intensity
        })),
        faceDetected: true,
        confidence: 1.0
      };
      
      setEmotionData(prev => [...prev, moment]);
    }
  }, [isTracking]);

  const handleProcessingStatusChange = (status: ProcessingStatus) => {
    setStatus(status);
  };

  const handleFaceDetected = (detected: boolean, face?: HTMLCanvasElement, box?: Box) => {
    if (detected && face) {
      setDetectedFace(face);
      setFaceBox(box || null);
    } else {
      setDetectedFace(null);
      setFaceBox(null);
    }
  };

  const handleFaceDetectedStable = (detected: boolean) => {
    setIsFaceDetectedStable(detected);
  };

  const startTracking = () => {
    setTrackingStartTime(Date.now());
    setEmotionData([]);
    setAnalysis({ overall: null, timeline: [] });
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    if (aggregatedData.length > 0) {
      try {
        const analyzer = new EmotionAnalyzer();
        const overall = analyzer.generateOverallAnalysis(aggregatedData);
        const timeline = analyzer.processTimelineData(aggregatedData);
        setAnalysis({ overall, timeline });
      } catch (err) {
        console.error('Error analyzing emotion data:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Container className="py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            asChild 
            className="text-slate-600 hover:text-[#011BA1]"
          >
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">EmoSense Playground</h1>
            <p className="text-slate-600">
              Try our emotion detection technology in real-time
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Use this playground to experiment with and understand how EmoSense detects and analyzes emotions. 
            Enable your camera and start tracking to see real-time emotion analysis and visualizations. 
            For best results, please remove glasses and face masks, as they may interfere with facial detection.
          </AlertDescription>
        </Alert>

        {/* Camera Toggle */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                <div className="space-y-1">
                  <h4 className="font-medium">Camera Access</h4>
                  <p className="text-sm text-slate-500">
                    Enable camera to start emotion detection
                  </p>
                </div>
              </div>
              <Switch
                checked={cameraEnabled}
                onCheckedChange={handleCameraToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          {/* Video Feed Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webcam className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Camera Feed</CardTitle>
                  <CardDescription>Live webcam feed with face detection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <WebcamFeed 
                onStreamReady={handleStreamReady}
                enabled={cameraEnabled}
              />
              
              {cameraEnabled && isTracking && (
                <div className={`flex items-center gap-2 justify-center p-2 rounded-md ${
                  isFaceDetectedStable ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {isFaceDetectedStable ? 'Face Detected' : 'No Face Detected'}
                  </span>
                </div>
              )}

              {cameraEnabled && (
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={startTracking}
                    disabled={!stream || isTracking || !status.modelLoaded}
                    size="lg"
                    className="bg-[#011BA1] hover:bg-[#00008B]"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Tracking
                  </Button>
                  <Button
                    onClick={stopTracking}
                    disabled={!isTracking}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Tracking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Emotions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Emotions</CardTitle>
              <CardDescription>Live emotion detection results</CardDescription>
            </CardHeader>
            <CardContent>
              {currentEmotion ? (
                <div className="space-y-4">
                  <div className="text-xl font-bold text-center">
                    {currentEmotion.dominantEmotion?.toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(currentEmotion.scores).map(([emotion, score]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <span className="capitalize">{emotion}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                            />
                          </div>
                          <span className="min-w-[4ch] text-sm">
                            {Math.round(score)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground">
                  {cameraEnabled ? 
                    'Start tracking to see real-time emotion detection results' :
                    'Enable camera to start emotion detection'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results Section */}
        <div className="space-y-6">
          <Separator />
          
          {/* Emotion Trend Section */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Response Trend</CardTitle>
              <CardDescription>
                Visualization of emotion intensities over time during the tracking session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.overall ? (
                <EmotionalResponseTrend data={aggregatedData} />
              ) : (
                <div className="aspect-[2/1] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-center px-4">
                    Complete tracking to see your emotional response trend graph.
                    <br />
                    <span className="text-sm">
                      The graph will show how your emotions varied over the session.
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Analysis Section */}
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

          {/* Timeline Section */}
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

        {/* Hidden Trackers */}
        {stream && cameraEnabled && (
          <>
            <FaceTracker
              stream={stream}
              isTracking={isTracking}
              detectionThreshold={5}
              onFaceDetected={handleFaceDetected}
              onFaceDetectedStable={handleFaceDetectedStable}
            />
            <EmotionTracker
              stream={stream}
              detectedFace={detectedFace}
              faceBox={faceBox}
              isTracking={isTracking}
              onEmotionDetected={handleEmotionDetected}
              onProcessingStatusChange={handleProcessingStatusChange}
            />
          </>
        )}
      </Container>
    </div>
  );
}