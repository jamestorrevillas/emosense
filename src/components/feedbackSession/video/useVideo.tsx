// src/components/feedbackSession/video/useVideo.tsx
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVideoProps {
  onComplete?: () => void;
}

export function useVideo({ onComplete }: UseVideoProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const completedRef = useRef(false); // Track if video has completed

  // Format time from seconds to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle time update with completion check
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const progress = (currentTime / duration) * 100;
    
    setProgress(progress);

    // Check for completion only once when reaching end
    if (progress >= 99.5 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  // Handle seeking with position validation
  const handleSeek = useCallback((value: number) => {
    if (!videoRef.current) return;
    
    const time = (value / 100) * videoRef.current.duration;
    // Ensure seeking doesn't go past the end
    videoRef.current.currentTime = Math.min(time, videoRef.current.duration - 0.1);
    setProgress(value);
  }, []);

  // Handle volume change with bounds
  const handleVolumeChange = useCallback((value: number) => {
    if (!videoRef.current) return;
    
    const boundedValue = Math.max(0, Math.min(1, value));
    videoRef.current.volume = boundedValue;
    setVolume(boundedValue);
  }, []);

  // Handle fullscreen with proper cleanup
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
    setLoading(false);
    // Reset completion state when video is loaded
    completedRef.current = false;
  }, []);

  // Handle video error
  const handleError = useCallback(() => {
    setError("Failed to load video");
    setLoading(false);
  }, []);

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset completion state when video source changes
  useEffect(() => {
    completedRef.current = false;
  }, [videoRef.current?.src]);

  return {
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
    handleSeek,
    handleVolumeChange,
    handleLoadedMetadata,
    handleError,
    toggleFullscreen,
  };
}