// src/lib/hooks/useTrackingTime.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTrackingTimeReturn {
  elapsedTime: string;
  elapsedMs: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

export function useTrackingTime(): UseTrackingTimeReturn {
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const totalElapsedRef = useRef<number>(0);
  const lastResumeRef = useRef<number | null>(null);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    lastResumeRef.current = Date.now();
    totalElapsedRef.current = 0;
    setElapsedMs(0);
    
    intervalRef.current = window.setInterval(() => {
      if (lastResumeRef.current) {
        const currentElapsed = Date.now() - lastResumeRef.current;
        const total = totalElapsedRef.current + currentElapsed;
        setElapsedTime(formatTime(total));
        setElapsedMs(total);
      }
    }, 1000);
  }, [formatTime]);

  const pauseTimer = useCallback(() => {
    if (lastResumeRef.current) {
      totalElapsedRef.current += Date.now() - lastResumeRef.current;
      lastResumeRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (!intervalRef.current) {
      lastResumeRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        if (lastResumeRef.current) {
          const currentElapsed = Date.now() - lastResumeRef.current;
          const total = totalElapsedRef.current + currentElapsed;
          setElapsedTime(formatTime(total));
          setElapsedMs(total);
        }
      }, 1000);
    }
  }, [formatTime]);

  const stopTimer = useCallback(() => {
    if (lastResumeRef.current) {
      totalElapsedRef.current += Date.now() - lastResumeRef.current;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastResumeRef.current = null;
    setElapsedTime(formatTime(totalElapsedRef.current));
    setElapsedMs(totalElapsedRef.current);
  }, [formatTime]);

  const resetTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = null;
    lastResumeRef.current = null;
    totalElapsedRef.current = 0;
    setElapsedTime("00:00");
    setElapsedMs(0);
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsedTime,
    elapsedMs,
    startTimer,
    stopTimer,
    resetTimer,
    pauseTimer,
    resumeTimer
  };
}