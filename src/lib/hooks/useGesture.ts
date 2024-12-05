// src/lib/hooks/useGesture.ts
import { useState, useCallback } from 'react';

interface TouchInfo {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
}

interface UseGestureProps {
  onSwipe?: (deltaX: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
}

export const useGesture = ({
  onSwipe,
  onTap,
  onDoubleTap
}: UseGestureProps) => {
  const [touch, setTouch] = useState<TouchInfo | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouch({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      lastTapTime: Date.now()
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touch) return;

    const currentTouch = e.touches[0];
    const deltaX = currentTouch.clientX - touch.startX;
    const deltaY = currentTouch.clientY - touch.startY;

    // If movement is more horizontal than vertical and significant enough
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSeeking(true);
      onSwipe?.(deltaX);
    }
  }, [touch, onSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!touch) return;

    const endTime = Date.now();
    const touchDuration = endTime - touch.startTime;
    const timeSinceLastTap = endTime - touch.lastTapTime;

    // If it's a quick tap (less than 200ms)
    if (touchDuration < 200 && !isSeeking) {
      if (timeSinceLastTap < 300) {
        // Double tap
        onDoubleTap?.();
      } else {
        // Single tap
        onTap?.();
      }
    }

    setIsSeeking(false);
    setTouch(null);
  }, [touch, isSeeking, onTap, onDoubleTap]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isSeeking
  };
};