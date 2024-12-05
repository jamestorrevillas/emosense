// src/components/review/video/VideoControls.tsx
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  progress: number;
  volume: number;
  duration: number;
  isFullscreen: boolean;
  loading?: boolean;
  disableSeeking?: boolean;
  onPlayPause: () => void;
  onVolumeChange: (value: number) => void;
  onToggleFullscreen: () => void;
  formatTime: (time: number) => string;
}

export const VideoControls = ({
  isPlaying,
  progress,
  volume,
  duration,
  isFullscreen,
  loading = false,
  disableSeeking = false,
  onPlayPause,
  onVolumeChange,
  onToggleFullscreen,
  formatTime
}: VideoControlsProps) => {
  const currentTime = (progress / 100) * duration;

  return (
    <div className="absolute inset-0 flex flex-col justify-end opacity-0 hover:opacity-100 transition-opacity">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Controls */}
      <div className="relative px-4 pb-4">
        {/* Progress bar (non-interactive when seeking disabled) */}
        <div className="mb-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onPlayPause}
              disabled={loading}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Volume */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Time */}
            <div className="text-sm text-white">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Additional info when seeking is disabled */}
            {disableSeeking && (
              <div className="text-xs text-white/70 mr-2">
                Seeking disabled in review mode
              </div>
            )}

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};