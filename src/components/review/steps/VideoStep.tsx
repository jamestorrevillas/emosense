// src/components/review/video/VideoStep.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReview } from "@/contexts/ReviewContext";
import { VideoPlayer } from "../video/VideoPlayer";
import { WebcamFeed } from "@/components/emotion/tracker/WebcamFeed";
import { FaceTracker } from "@/components/emotion/tracker/FaceTracker";
import { EmotionTracker } from "@/components/emotion/tracker/EmotionTracker";
import { AlertCircle, Lightbulb, Loader2 } from 'lucide-react';
import type { Box } from '@vladmandic/face-api';
import type { EmotionData } from '@/components/emotion/types/emotion';
import type { EmotionDataPoint, EmotionResponse } from '@/types/response';

export function VideoStep() {
  const { nextStep, projectData, responses, updateResponses } = useReview();
  const [detectedFace, setDetectedFace] = useState<HTMLCanvasElement | null>(null);
  const [faceBox, setFaceBox] = useState<Box | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTrackingEmotions, setIsTrackingEmotions] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Refs for tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const emotionDataRef = useRef<EmotionDataPoint[]>([]);
  const activePlayStartRef = useRef<number>(0);
  const totalPlayTimeRef = useRef<number>(0);
  const videoStartRef = useRef<number>(0);
  const lastPlayPositionRef = useRef<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        lastPlayPositionRef.current = videoRef.current?.currentTime || 0;
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  const handleFaceDetected = useCallback((detected: boolean, face?: HTMLCanvasElement, box?: Box) => {
    if (detected && face) {
      setDetectedFace(face);
      setFaceBox(box || null);
    } else {
      setDetectedFace(null);
      setFaceBox(null);
    }
  }, []);

  const handleFaceDetectedStable = useCallback((detected: boolean) => {
    updateResponses({ isFaceDetected: detected });
    
    if (!detected) {
      // Store position if video is playing
      if (isPlaying) {
        lastPlayPositionRef.current = videoRef.current?.currentTime || 0;
        setIsPlaying(false);
      }
  
      // Exit fullscreen regardless of play state
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    }
  }, [isPlaying, updateResponses]);

  // Handle play attempt
  const handlePlayAttempt = useCallback((wantsToPlay: boolean) => {
    // Log for debugging
    console.log('Play attempt:', { wantsToPlay, isFaceDetected: responses.isFaceDetected });

    if (wantsToPlay && !responses.isFaceDetected) {
      console.log('Blocked play: no face detected');
      return;
    }

    // If trying to play and we have a stored position
    if (wantsToPlay && lastPlayPositionRef.current > 0) {
      console.log('Resuming from position:', lastPlayPositionRef.current);
      if (videoRef.current) {
        videoRef.current.currentTime = lastPlayPositionRef.current;
      }
      lastPlayPositionRef.current = 0;
    }

    setIsPlaying(wantsToPlay);
    setIsTrackingEmotions(wantsToPlay);
  }, [responses.isFaceDetected]);

  const handleEmotionDetected = useCallback((data: EmotionData) => {
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
  }, [isTrackingEmotions, updateResponses]);

  const handleVideoStart = useCallback(() => {
    videoStartRef.current = Date.now();
    activePlayStartRef.current = Date.now();
    totalPlayTimeRef.current = 0;
    emotionDataRef.current = [];
    lastPlayPositionRef.current = 0;
  }, []);

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

    // Submit response directly if no quick rating or survey questions
    if (!projectData.quickRating?.enabled && (!projectData.survey?.questions?.length)) {
      try {
        setIsSubmitting(true); // Add loading state

        const finalResponse = {
          projectId: projectData.id,
          status: 'completed',
          startedAt: new Date(videoStartRef.current).toISOString(),
          completedAt: new Date().toISOString(),
          data: {
            emotion: emotionResponse || null,
            quickRating: null,
            survey: {}
          },
          mode: 'public',
          metadata: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: Date.now()
          }
        };

        const responseRef = collection(doc(db, "projects", projectData.id), "responses");
        await addDoc(responseRef, finalResponse);
        
        // Skip to thank you step
        setTimeout(() => {
          nextStep();
          nextStep(); // Skip quick rating
          nextStep(); // Skip survey
        }, 500);
        
        return;
      } catch (err) {
        console.error("Error submitting response:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  
    // Otherwise proceed based on what's configured
    if (projectData.quickRating?.enabled) {
      setTimeout(nextStep, 500);
    } else if (projectData.survey?.questions?.length) {
      setTimeout(() => {
        nextStep();
        nextStep(); // Skip quick-rating step
      }, 500);
    } else {
      // Safety fallback
      setTimeout(nextStep, 500);
    }
  };

  // Initialize
  useEffect(() => {
    setIsInitializing(true);
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      setIsPlaying(false);
      setIsTrackingEmotions(false);
    };
  }, []);

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
            
            {/* Face Detection Overlay */}
            {responses.cameraStream && (
              (isInitializing || !responses.isFaceDetected || isSubmitting) && (
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 z-[60]">
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
                  ) : isSubmitting ? (
                    <Alert className="w-[90%] max-w-md border-blue-500 bg-blue-50/95 shadow-lg">
                      <div className="flex gap-3">
                        <Loader2 className="h-5 w-5 flex-shrink-0 text-blue-500 animate-spin" />
                        <AlertDescription className="text-blue-800">
                          <p>Submitting your response...</p>
                          <p className="text-sm mt-1">Please wait while we process your feedback.</p>
                        </AlertDescription>
                      </div>
                    </Alert>
                  ) : (
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
                            <p>
                              Ensure proper lighting and face the camera directly for better detection. 
                              For optimal results, please remove glasses and face masks if possible.
                            </p>
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </div>
              )
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
            onFaceDetected={handleFaceDetected}
            onFaceDetectedStable={handleFaceDetectedStable}
          />
          <EmotionTracker
            stream={responses.cameraStream}
            detectedFace={detectedFace}
            faceBox={faceBox}
            isTracking={isTrackingEmotions}
            isFaceDetected={responses.isFaceDetected}
            onEmotionDetected={handleEmotionDetected}
          />
        </div>
      )}
    </div>
  );
}