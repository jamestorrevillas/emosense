// src/components/emotion/tracker/TrackingTime.tsx
import { Clock, Pause } from 'lucide-react';

interface TrackingTimeProps {
  elapsedTime: string;
  isTracking: boolean;
  isPaused?: boolean;
}

export function TrackingTime({ elapsedTime, isTracking, isPaused }: TrackingTimeProps) {
  return (
    <div className={`flex items-center gap-2 justify-center p-2 rounded-md ${
      !isTracking ? 'bg-muted text-muted-foreground' :
      isPaused ? 'bg-yellow-500/10 text-yellow-600' :
      'bg-primary/10 text-primary'
    }`}>
      {isPaused ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span className="text-sm font-mono">
        {!isTracking ? "Time: " :
         isPaused ? "Paused: " :
         "Recording: "}{elapsedTime}
      </span>
    </div>
  );
}