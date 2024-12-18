// src/components/emotion/tracker/FaceTracker.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface FaceTrackerProps {
  stream: MediaStream | null;
  isTracking: boolean;
  lostThreshold?: number; // Threshold for confirming face lost
  foundThreshold?: number; // Threshold for confirming face found (lower)
  onFaceDetected?: (detected: boolean, face?: HTMLCanvasElement, box?: faceapi.Box) => void;
  onFaceDetectedStable?: (detected: boolean) => void;
  onModelLoaded?: (loaded: boolean) => void;
}

// Type guard for DOMException
function isDOMException(error: unknown): error is DOMException {
  return error instanceof DOMException;
}

export function FaceTracker({
  stream,
  isTracking,
  lostThreshold = 15, // Higher threshold for confirming face lost
  foundThreshold = 1,  // Lower threshold for confirming face found
  onFaceDetected,
  onFaceDetectedStable,
  onModelLoaded
}: FaceTrackerProps) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const processingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const lastStableStateRef = useRef<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(true);
  const modelsLoadingRef = useRef(false);

  const updateStableState = useCallback((detected: boolean) => {
    if (!mounted.current) return;

    if (detected) {
      consecutiveDetectionsRef.current++;
      consecutiveNonDetectionsRef.current = 0;
    } else {
      consecutiveDetectionsRef.current = 0;
      consecutiveNonDetectionsRef.current++;
    }

    // Use different thresholds for detection vs loss
    if (consecutiveDetectionsRef.current >= foundThreshold && lastStableStateRef.current !== true) {
      lastStableStateRef.current = true;
      onFaceDetectedStable?.(true);
    } else if (consecutiveNonDetectionsRef.current >= lostThreshold && lastStableStateRef.current !== false) {
      lastStableStateRef.current = false;
      onFaceDetectedStable?.(false);
    }
  }, [foundThreshold, lostThreshold, onFaceDetectedStable]);

  // Load models when camera is enabled
  useEffect(() => {
    if (!stream || modelsLoadingRef.current || modelLoaded) return;

    async function loadModels() {
      if (modelsLoadingRef.current) return;
      modelsLoadingRef.current = true;

      try {
        console.log('Loading face detection models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api')
        ]);

        if (mounted.current) {
          console.log('Face detection models loaded successfully');
          setModelLoaded(true);
          onModelLoaded?.(true);
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        onModelLoaded?.(false);
      } finally {
        modelsLoadingRef.current = false;
      }
    }

    loadModels();
  }, [stream, modelLoaded, onModelLoaded]);

  // Initialize video element
  useEffect(() => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
    };
  }, []);

  // Update video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const detectFace = useCallback(async () => {
    if (!stream || !modelLoaded || processingRef.current || !videoRef.current || !mounted.current) {
      return;
    }

    try {
      processingRef.current = true;

      if (videoRef.current.paused || videoRef.current.ended) {
        try {
          await videoRef.current.play();
        } catch (error: unknown) {
          if (isDOMException(error) && error.name !== 'AbortError') {
            console.error('Error playing video:', error);
          }
          return;
        }
      }

      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (!mounted.current) return;

      if (!detection) {
        updateStableState(false);
        onFaceDetected?.(false);
        return;
      }

      const faces = await faceapi.extractFaces(videoRef.current, [detection.detection.box]);
      
      if (!mounted.current) return;

      const face = faces[0];
      if (face) {
        updateStableState(true);
        onFaceDetected?.(true, face, detection.detection.box);
      } else {
        updateStableState(false);
        onFaceDetected?.(false);
      }

    } catch (error: unknown) {
      if (isDOMException(error) && error.name !== 'AbortError') {
        console.error('Error detecting face:', error);
      }
      updateStableState(false);
      onFaceDetected?.(false);
    } finally {
      processingRef.current = false;
    }
  }, [stream, modelLoaded, onFaceDetected, updateStableState]);

  // Handle tracking state
  useEffect(() => {
    const cleanupInterval = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isTracking && modelLoaded) {
      intervalRef.current = window.setInterval(detectFace, 16);
    } else {
      cleanupInterval();
      consecutiveDetectionsRef.current = 0;
      consecutiveNonDetectionsRef.current = 0;
      lastStableStateRef.current = null;
    }

    return cleanupInterval;
  }, [isTracking, modelLoaded, detectFace]);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
}