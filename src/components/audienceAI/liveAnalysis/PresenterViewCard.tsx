// src/components/audienceAI/liveAnalysis/PresenterViewCard.tsx
import { useRef, useEffect, MutableRefObject } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Square, Users } from "lucide-react";
import { MultiPersonFaceTracker, TrackedFace, TrackerRefHandle } from '@/components/audienceAI/trackers/MultiPersonFaceTracker';
import { MultiPersonEmotionTracker, AudienceEmotionData } from '@/components/audienceAI/trackers/MultiPersonEmotionTracker';

interface PresenterViewCardProps {
  cameraEnabled: boolean;
  stream: MediaStream | null;
  isTracking: boolean;
  isTransitioning: boolean;
  cameraLoading: boolean;
  faceCount: number;
  elapsedTime: string;
  faceModelLoaded: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onFacesDetected: (faces: TrackedFace[], count: number) => void;
  onFaceModelLoaded: (loaded: boolean) => void;
  onEmotionsDetected: (data: AudienceEmotionData) => void;
  onModelsLoaded: (loaded: {face?: boolean, emotion?: boolean}) => void;
  trackerRef?: MutableRefObject<TrackerRefHandle | null>;
  resetKey: number;
}

export function PresenterViewCard({
  cameraEnabled,
  stream,
  isTracking,
  isTransitioning,
  cameraLoading,
  faceCount,
  elapsedTime,
  faceModelLoaded,
  onStartTracking,
  onStopTracking,
  onFacesDetected,
  onFaceModelLoaded,
  onEmotionsDetected,
  onModelsLoaded,
  trackerRef,
  resetKey
}: PresenterViewCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle setting srcObject on the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presenter View</CardTitle>
        <CardDescription>
          Face the camera to capture audience in the frame
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={videoContainerRef}
          className="relative aspect-video bg-muted rounded-lg overflow-hidden"
        >
          {/* Show camera feed when enabled and not transitioning */}
          {cameraEnabled || isTransitioning ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Face tracker overlay */}
              {stream && (
                <MultiPersonFaceTracker 
                  ref={trackerRef}
                  stream={stream}
                  isActive={cameraEnabled && !isTransitioning}
                  showFaceBoxes={false}
                  onFacesDetected={onFacesDetected}
                  onModelLoaded={onFaceModelLoaded}
                  resetKey={resetKey}
                />
              )}

              {/* Emotion Tracker */}
              {stream && (
                <MultiPersonEmotionTracker
                  stream={stream}
                  isActive={cameraEnabled && !isTransitioning}
                  showFaceBoxes={true}
                  onEmotionsDetected={onEmotionsDetected}
                  onModelsLoaded={onModelsLoaded}
                  resetKey={resetKey}
                />
              )}
              
              {/* Loading overlay - show for initialization or transitions */}
              {(cameraLoading || isTransitioning) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                  <div className="text-white text-sm">
                    {isTransitioning ? "Switching camera..." : "Initializing camera..."}
                  </div>
                </div>
              )}
              
              {/* Face count indicator - only show when not transitioning */}
              {!isTransitioning && (
                <div className="absolute top-2 left-2 bg-black/50 text-white text-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{faceCount} {faceCount === 1 ? 'face' : 'faces'} detected</span>
                </div>
              )}
              
              {/* Simple time display when tracking */}
              {isTracking && (
                <div className="absolute top-2 right-2 bg-primary/80 text-white rounded-md px-3 py-1">
                  {elapsedTime}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Camera disabled</p>
            </div>
          )}
        </div>
        
        {/* Controls */}
        {cameraEnabled && stream && stream.active && faceModelLoaded && !isTransitioning && (
          <div className="flex justify-center gap-4">
            <Button
              onClick={onStartTracking}
              disabled={!stream || isTracking}
              size="lg"
              className="bg-[#011BA1] hover:bg-[#00008B]"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
            <Button
              onClick={onStopTracking}
              disabled={!isTracking}
              variant="destructive"
              size="lg"
            >
              <Square className="mr-2 h-4 w-4" />
              End Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}