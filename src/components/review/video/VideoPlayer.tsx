// src/components/review/video/VideoPlayer.tsx
import { useEffect, useCallback } from 'react';
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
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export function VideoPlayer({
  src,
  poster,
  onComplete,
  onStart,
  className,
  isPlaying: externalIsPlaying,
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

  // Handle video start
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!video.paused && onStart) {
        onStart();
      }
    };

    video.addEventListener('play', handlePlay);
    return () => video.removeEventListener('play', handlePlay);
  }, [onStart]);

  // Handle play state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      if (externalIsPlaying) {
        try {
          await video.play();
        } catch (error) {
          console.error("Error playing video:", error);
          externalSetIsPlaying(false);
        }
      } else {
        video.pause();
      }
    };

    playVideo();

    return () => {
      if (video && !video.paused) {
        video.pause();
      }
    };
  }, [externalIsPlaying, externalSetIsPlaying]);

  // Handle play/pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    externalSetIsPlaying(!externalIsPlaying);
  }, [externalIsPlaying, externalSetIsPlaying]);

  // Handle gestures
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isSeeking
  } = useGesture({
    onTap: togglePlay,
  });

  // Handle video time update
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if video is near the end
    if (video.currentTime >= video.duration - 0.1) {
      video.pause();
      externalSetIsPlaying(false);
    }

    handleTimeUpdate();
  }, [handleTimeUpdate, externalSetIsPlaying]);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger if clicking on controls
    if ((e.target as HTMLElement).closest('.video-controls')) {
      return;
    }
    togglePlay();
  }, [togglePlay]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black overflow-hidden rounded-lg cursor-pointer",
        isFullscreen && "fixed inset-0 z-50 h-screen w-screen rounded-none",
        className
      )}
      onClick={handleVideoClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onTimeUpdate={handleVideoTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        playsInline
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

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

      {/* Add 'video-controls' class to prevent click propagation */}
      <div className="video-controls">
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
      </div>

      {isSeeking && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-lg p-4 text-white">
          Seeking disabled
        </div>
      )}
    </div>
  );
}