// src/pages/audience emotion detection/AudienceEmotionDetectionPage.tsx
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
import { Play, Square, AlertCircle, Info, Webcam, Camera, Loader2 } from 'lucide-react';
import type { EmotionData, ProcessingStatus, EmotionLabel } from '@/components/emotion/types/emotion';
import type { EmotionalMoment, EmotionTimelineEntry, OverallAnalysis } from '@/components/emotion/types/analysis';
import type { Box } from '@vladmandic/face-api';

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

export function AudienceEmotionDetectionPage() {
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [webStream, setWebStream] = useState<MediaStream | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<ProcessingStatus>({
        isProcessing: false,
        fps: 0,
        modelLoaded: false,
        isInitializing: false
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
    const [isFaceModelLoaded, setIsFaceModelLoaded] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isFirstTrackingStart, setIsFirstTrackingStart] = useState(true);
    
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
        if (isFirstTrackingStart) {
            setIsInitializing(true);
            // Use default FaceTracker lost threshold (10) * 50ms
            setTimeout(() => {
                setIsInitializing(false);
                setIsFirstTrackingStart(false);
            }, 15 * 100); // Using FaceTracker's default lostThreshold
        }
      
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
        <div className="container space-y-8 py-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">AudienceAI</h1>
                <p className="text-slate-600">
                Experience real-time audience emotion detection and analysis
                </p>
            </div>
    
            {/* Info Alert */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                EmoSense is a real-time emotion detection system designed to help public speakers gauge audience reactions as they speak. 
                By analyzing facial expressions, it provides insights into engagement, sentiment, and overall audience mood. 
                Enable your camera to track emotions live and adjust your delivery based on real-time feedback.
                For best results, please remove glasses and face masks, as they may interfere with facial detection.
                </AlertDescription>
            </Alert>
    
            {/* Camera Toggle */}
            <Card>
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
            <div className="grid gap-8">
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
                    <div className="relative">
                    <WebcamFeed 
                        onStreamReady={handleStreamReady}
                        enabled={cameraEnabled}
                    />
        
                    {/* Initialization/Face Detection Overlay */}
                    {cameraEnabled && (
                        (isInitializing || (!isFaceDetectedStable && isTracking && !isInitializing)) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                            {isInitializing ? (
                            <Alert className="w-[90%] max-w-md border-blue-500 bg-blue-50/95 shadow-lg">
                                <div className="flex gap-3">
                                <Loader2 className="h-5 w-5 flex-shrink-0 text-blue-500 animate-spin" />
                                <AlertDescription className="text-blue-800">
                                    <p>Initializing emotion detection models...</p>
                                    <p className="text-sm mt-1">This may take a few moments.</p>
                                </AlertDescription>
                                </div>
                            </Alert>
                            ) : (
                            <Alert 
                                variant="destructive"
                                className="w-[90%] max-w-md border-red-500 bg-red-50/95 shadow-lg"
                            >
                                <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                                <AlertDescription className="text-red-800">
                                    No face detected. Please face the camera directly.
                                </AlertDescription>
                                </div>
                            </Alert>
                            )}
                        </div>
                        )
                    )}
                    </div>
        
                    {/* Controls Section */}
                    {cameraEnabled && (
                    <div className="flex justify-center gap-4">
                        <Button
                        onClick={startTracking}
                        disabled={!stream || isTracking || !status.modelLoaded || !isFaceModelLoaded}
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
                        <div className="text-3xl font-bold text-center">
                            {currentEmotion.dominantEmotion?.toUpperCase()}
                        </div>
                        <div className="space-y-2">
                            {Object.entries(currentEmotion.scores).map(([emotion, score]) => (
                            <div key={emotion} className="flex items-center justify-between">
                                <span className="capitalize text-xl">{emotion}</span>
                                <div className="flex items-center gap-2">
                                <div className="w-32 bg-muted rounded-full h-2">
                                    <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                                    />
                                </div>
                                <span className="min-w-[4ch] text-xl">
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
                
                {/* Beta Notice Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    <p><strong>Note:</strong> The emotion detection feature is currently in beta and experimental. Results may not guarantee 100% accuracy, and emotions with very low intensities might be misdetections. This feature is continuously being improved for better accuracy.</p>
                </div>

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
                    onFaceDetected={handleFaceDetected}
                    onFaceDetectedStable={handleFaceDetectedStable}
                    onModelLoaded={setIsFaceModelLoaded}
                    />
                    <EmotionTracker
                    stream={stream}
                    detectedFace={detectedFace}
                    faceBox={faceBox}
                    isTracking={isTracking}
                    isFaceDetected={isFaceDetectedStable}
                    onEmotionDetected={handleEmotionDetected}
                    onProcessingStatusChange={handleProcessingStatusChange}
                    />
                </>
            )}
          </div>
        );
}