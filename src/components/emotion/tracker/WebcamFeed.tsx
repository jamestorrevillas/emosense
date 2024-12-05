// src/components/emotion/tracker/WebcamFeed.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface WebcamFeedProps {
  onStreamReady?: (stream: MediaStream) => void;
  enabled: boolean;
}

export function WebcamFeed({ onStreamReady, enabled }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startWebcam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean up any existing stream first
      cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        onStreamReady?.(stream);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please make sure you have granted camera permissions.');
    } finally {
      setLoading(false);
    }
  };

  // Handle camera enable/disable
  useEffect(() => {
    if (enabled) {
      startWebcam();
    } else {
      cleanup();
    }
  }, [enabled, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (error) {
    return (
      <Card className="p-4 text-center">
        <div className="text-destructive mb-2">{error}</div>
        <Button onClick={startWebcam}>Try Again</Button>
      </Card>
    );
  }

  if (!enabled) {
    return (
      <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Camera disabled</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg bg-muted"
        onCanPlay={() => setLoading(false)}
      />
    </div>
  );
}