// src/components/review/steps/VideoStep.tsx
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReview } from "@/contexts/ReviewContext";
import { VideoPlayer } from "../video/VideoPlayer";
import { WebcamFeed } from "@/components/emotion/tracker/WebcamFeed";
import { FaceTracker } from "@/components/emotion/tracker/FaceTracker";
import { EmotionTracker } from "@/components/emotion/tracker/EmotionTracker";
import { AlertCircle, Lightbulb } from 'lucide-react';
import type { Box } from '@vladmandic/face-api';
import type { EmotionData } from '@/components/emotion/types/emotion';
import type { EmotionDataPoint, EmotionResponse } from '@/types/response';

export function VideoStep() {
  const { nextStep, projectData, responses, updateResponses } = useReview();
  const [detectedFace, setDetectedFace] = useState<HTMLCanvasElement | null>(null);
  const [faceBox, setFaceBox] = useState<Box | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTrackingEmotions, setIsTrackingEmotions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const emotionDataRef = useRef<EmotionDataPoint[]>([]);
  const activePlayStartRef = useRef<number>(0);
  const totalPlayTimeRef = useRef<number>(0);
  const videoStartRef = useRef<number>(0);
  
  // Handle emotion tracking state
  useEffect(() => {
    if (isPlaying) {
      activePlayStartRef.current = Date.now();
      setIsTrackingEmotions(true);
    } else {
      if (activePlayStartRef.current > 0) {
        totalPlayTimeRef.current += Date.now() - activePlayStartRef.current;
      }
      setIsTrackingEmotions(false);
    }
  }, [isPlaying]);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  const handleFaceDetected = (detected: boolean, face?: HTMLCanvasElement, box?: Box) => {
    if (detected && face) {
      setDetectedFace(face);
      setFaceBox(box || null);
    } else {
      setDetectedFace(null);
      setFaceBox(null);
    }
  };

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFaceDetectedStable = (detected: boolean) => {
    updateResponses({ isFaceDetected: detected });
    if (!detected) {
      // Exit fullscreen if face is not detected
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('Error exiting fullscreen:', err);
        });
      }
      // Pause video
      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  };

  const handlePlayAttempt = (wantsToPlay: boolean) => {
    if (wantsToPlay && !responses.isFaceDetected) {
      setIsPlaying(false);
      return;
    }
    
    setIsPlaying(wantsToPlay);
  };

  const handleEmotionDetected = (data: EmotionData) => {
    if (!isTrackingEmotions) return;

    const currentTime = Date.now();
    const videoTimestamp = currentTime - videoStartRef.current;

    const dataPoint: EmotionDataPoint = {
      timestamp: videoTimestamp,
      emotions: Object.entries(data.scores).map(([emotion, intensity]) => ({
        emotion,
        intensity
      })),
      faceDetected: true,
      dominantEmotion: data.dominantEmotion
    };

    emotionDataRef.current.push(dataPoint);
    updateResponses({ currentEmotion: data });
  };

  const handleVideoStart = () => {
    videoStartRef.current = Date.now();
    activePlayStartRef.current = Date.now();
    totalPlayTimeRef.current = 0;
    emotionDataRef.current = [];
  };

  const handleVideoComplete = async () => {
    const finalPlayDuration = totalPlayTimeRef.current + 
      (activePlayStartRef.current > 0 ? Date.now() - activePlayStartRef.current : 0);

    const emotionResponse: EmotionResponse = {
      videoId: projectData.id,
      duration: finalPlayDuration,
      startTime: new Date(videoStartRef.current).toISOString(),
      endTime: new Date().toISOString(),
      data: emotionDataRef.current
    };

    updateResponses({ emotionResponse });

    if (projectData?.quickRating.enabled) {
      setTimeout(nextStep, 500);
    } else {
      setTimeout(() => {
        nextStep();
        nextStep(); // Skip quick-rating step
      }, 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{projectData.title}</CardTitle>
          <CardDescription>
            Please watch the complete video to continue. Video will pause and exit fullscreen if no face is detected.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <VideoPlayer
              src={projectData.videoUrl}
              poster={projectData.thumbnailUrl || undefined}
              onComplete={handleVideoComplete}
              onStart={handleVideoStart}
              isPlaying={isPlaying}
              setIsPlaying={handlePlayAttempt}
              className="rounded-none"
            />
            
            {/* Face Detection Overlay - Shows in non-fullscreen mode */}
            {!isFullscreen && !responses.isFaceDetected && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 z-[60]">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <Alert 
                  variant="destructive"
                  className="w-[90%] max-w-md border-red-500 bg-red-50/95 shadow-lg transform transition-all duration-300"
                >
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                    <AlertDescription className="text-red-800 space-y-2">
                      <p>No face detected. Please face the camera to continue watching.</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 flex-shrink-0" />
                        <p>Ensure proper lighting and face the camera directly for better detection.</p>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}
          </div>

          {projectData.description && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                {projectData.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Video Feed and Trackers */}
      {responses.cameraStream && (
        <div className="hidden">
          <WebcamFeed 
            onStreamReady={(stream) => updateResponses({ cameraStream: stream })} 
            enabled={true}
          />
          <FaceTracker
            stream={responses.cameraStream}
            isTracking={true}
            detectionThreshold={10}
            onFaceDetected={handleFaceDetected}
            onFaceDetectedStable={handleFaceDetectedStable}
          />
          <EmotionTracker
            stream={responses.cameraStream}
            detectedFace={detectedFace}
            faceBox={faceBox}
            isTracking={isTrackingEmotions}
            onEmotionDetected={handleEmotionDetected}
          />
        </div>
      )}
    </div>
  );
}