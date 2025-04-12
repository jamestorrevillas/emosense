// src/components/emotion/tracker/WebcamFeed.tsx
import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface WebcamFeedProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  enabled: boolean;
}

export function WebcamFeed({ onStreamReady, onError, enabled }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Completely isolated useEffect for camera management
  useEffect(() => {
    console.log(`WebcamFeed effect running - enabled: ${enabled}`);
    let isMounted = true;
    
    async function setupCamera() {
      if (!enabled) return;
      
      // Start loading state
      if (isMounted) setLoading(true);
      
      try {
        // Stop any existing tracks to prevent webcam light staying on
        if (streamRef.current) {
          console.log('Stopping existing tracks');
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        console.log('Requesting media stream');
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        // Guard against state updates if component unmounted
        if (!isMounted) {
          console.log('Component unmounted, stopping new stream');
          newStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log('Media stream obtained', newStream.getTracks().length, 'tracks');
        streamRef.current = newStream;
        
        // Apply stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          console.log('Stream applied to video element');
        }
        
        // Notify parent component
        onStreamReady?.(newStream);
        
        // Reset error state
        if (isMounted) setError(null);
      } catch (err) {
        console.error('Failed to access camera:', err);
        if (isMounted) {
          const errorMsg = 'Could not access webcam. Please make sure you have granted camera permissions.';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    if (enabled) {
      setupCamera();
    } else {
      // Clean up when disabled
      if (streamRef.current) {
        console.log('Cleanup: stopping tracks because enabled=false');
        streamRef.current.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind} ${track.id}`);
          track.stop();
        });
        streamRef.current = null;
        
        // Clear video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
    
    // Cleanup function
    return () => {
      console.log('WebcamFeed cleanup running');
      isMounted = false;
      
      if (streamRef.current) {
        console.log('Cleanup: stopping tracks on component unmount');
        streamRef.current.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind} ${track.id}`);
          track.stop();
        });
      }
    };
  }, [enabled, onStreamReady, onError]);
  
  // Render based on state
  if (!enabled) {
    return (
      <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Camera disabled</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="aspect-video flex flex-col items-center justify-center bg-muted rounded-lg text-destructive">
        <p className="text-center px-4">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Fallback if video isn't showing */}
      {!loading && !streamRef.current && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Initializing camera...</p>
        </div>
      )}
    </div>
  );
}