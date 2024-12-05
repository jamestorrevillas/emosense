// src/components/review/video/VideoPlayer.tsx
import { useEffect } from 'react';
import { useVideo } from './useVideo';
import { VideoControls } from './VideoControls';
import { useGesture } from '@/lib/hooks/useGesture';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onComplete?: () => void;
  onStart?: () => void;
  className?: string;
  isPlaying?: boolean;
  setIsPlaying?: (playing: boolean) => void;
}

export function VideoPlayer({
  src,
  poster,
  onComplete,
  onStart,
  className,
  isPlaying: externalIsPlaying = false,
  setIsPlaying: externalSetIsPlaying
}: VideoPlayerProps) {
  const {
    videoRef,
    containerRef,
    progress,
    duration,
    volume,
    loading,
    error,
    isFullscreen,
    formatTime,
    handleTimeUpdate,
    handleVolumeChange,
    handleLoadedMetadata,
    handleError,
    toggleFullscreen
  } = useVideo({ onComplete });

  // Effect to sync video state with external play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (externalIsPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing video:", error);
          externalSetIsPlaying?.(false);
        });
      }
    } else {
      video.pause();
    }
  }, [externalIsPlaying, externalSetIsPlaying]);

  // Handle play click
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      externalSetIsPlaying?.(true);
    } else {
      externalSetIsPlaying?.(false);
    }
  };

  // Handle video start
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      onStart?.();
    };

    video.addEventListener('play', handlePlay);
    return () => video.removeEventListener('play', handlePlay);
  }, [onStart]);

  // Handle touch gestures
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isSeeking
  } = useGesture({
    onTap: togglePlay,
  });

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black overflow-hidden rounded-lg",
        isFullscreen && "fixed inset-0 z-50 h-screen w-screen rounded-none",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        playsInline
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <p className="text-sm">{error}</p>
            <button 
              className="mt-2 text-sm underline"
              onClick={() => videoRef.current?.load()}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <VideoControls
        isPlaying={externalIsPlaying}
        progress={progress}
        volume={volume}
        duration={duration}
        isFullscreen={isFullscreen}
        loading={loading}
        onPlayPause={togglePlay}
        onVolumeChange={handleVolumeChange}
        onToggleFullscreen={toggleFullscreen}
        formatTime={formatTime}
        disableSeeking={true}
      />

      {/* Seeking indicator (disabled) */}
      {isSeeking && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-lg p-4 text-white">
          Seeking disabled
        </div>
      )}
    </div>
  );
}