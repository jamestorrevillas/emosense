// src/components/audienceAI/trackers/MultiPersonFaceTracker.tsx
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

export interface TrackedFace {
  id: string;
  box: faceapi.Box;
  landmarks?: faceapi.FaceLandmarks68;
  detection: faceapi.FaceDetection;
  lastSeen: number;
}

interface MultiPersonFaceTrackerProps {
  stream: MediaStream | null;
  isActive: boolean;
  showFaceBoxes?: boolean;
  detectionInterval?: number;
  onFacesDetected?: (faces: TrackedFace[], faceCount: number) => void;
  onModelLoaded?: (loaded: boolean) => void;
  resetKey?: number;
}

// Export ref interface for external control
export interface TrackerRefHandle {
  resetTracking: () => void;
}

export const MultiPersonFaceTracker = forwardRef<TrackerRefHandle, MultiPersonFaceTrackerProps>(({
  stream,
  isActive,
  showFaceBoxes = true,
  detectionInterval = 150, // Slightly increased interval for heavier model
  onFacesDetected,
  onModelLoaded,
  resetKey
}: MultiPersonFaceTrackerProps, ref) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const processingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackedFacesRef = useRef<Map<string, TrackedFace>>(new Map());
  const faceIdCounterRef = useRef(0);
  const mounted = useRef(true);
  const modelsLoadingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  
  // ref to store the latest callback
  const onFacesDetectedRef = useRef(onFacesDetected);
  
  // Update ref when the callback changes
  useEffect(() => {
    onFacesDetectedRef.current = onFacesDetected;
  }, [onFacesDetected]);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resetTracking: () => {
      console.log('Explicitly resetting face tracking');
      trackedFacesRef.current.clear();
      faceIdCounterRef.current = 0;
      if (onFacesDetectedRef.current) {
        onFacesDetectedRef.current([], 0);
      }
    }
  }));
  
  // Reset tracking when resetKey changes or stream changes
  useEffect(() => {
    console.log('Stream or resetKey changed, resetting tracking');
    trackedFacesRef.current.clear();
    faceIdCounterRef.current = 0;
    // Call onFacesDetected with empty array, using the ref
    onFacesDetectedRef.current?.([], 0);
    
    // Update ref to current stream
    streamRef.current = stream;
  }, [stream, resetKey]);
  
  // Function to generate a unique face ID
  const generateFaceId = useCallback(() => {
    return `face_${faceIdCounterRef.current++}`;
  }, []);

  // Load face detection models
  useEffect(() => {
    if (!isActive || modelsLoadingRef.current || modelLoaded) return;

    async function loadModels() {
      if (modelsLoadingRef.current) return;
      modelsLoadingRef.current = true;

      try {
        console.log('Loading face detection models for AudienceAI...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models/face-api'), // Using SSD MobileNet instead
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api')
        ]);

        if (mounted.current) {
          console.log('Face detection models loaded successfully for AudienceAI');
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
  }, [isActive, modelLoaded, onModelLoaded]);

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

  // Update video stream with improved handling
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Clean up previous stream
    if (videoRef.current.srcObject) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    
    if (!stream) return;
    
    // Set video constraints to higher resolution
    if (stream.getVideoTracks().length > 0) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack.getConstraints) {
        const constraints = videoTrack.getConstraints();
        console.log('Video track constraints:', constraints);
      }
    }
    
    // Small delay to ensure clean state between stream switches
    const timer = setTimeout(() => {
      if (!mounted.current || !videoRef.current) return;
      
      try {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError' && mounted.current) {
              console.error('Error playing video:', error);
            }
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError' && mounted.current) {
          console.error('Error setting up video:', err);
        }
      }
    }, 150); // Small delay to allow previous stream cleanup
    
    return () => clearTimeout(timer);
  }, [stream]);

  // Detect and track multiple faces with improved stream checking
  const detectFaces = useCallback(async () => {
    // Extra check to ensure we're using the current stream
    if (!stream || stream !== streamRef.current || 
        !modelLoaded || processingRef.current || 
        !videoRef.current || !mounted.current) {
      return;
    }

    try {
      processingRef.current = true;

      // Skip detection if video isn't ready
      if (videoRef.current.paused || 
          videoRef.current.ended || 
          videoRef.current.readyState < 2) {
        processingRef.current = false;
        return;
      }

      // Detect all faces in the frame using SSD MobileNet
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.2, // Lower threshold for better distance detection
          maxResults: 100 // Allow more face detections
        })
      ).withFaceLandmarks();

      if (!mounted.current) return;

      const currentTime = Date.now();
      const newFacesMap = new Map<string, TrackedFace>();
      const FACE_TIMEOUT = 1200; // Increased from 500ms to 1200ms for better persistence

      // Update or add new faces
      for (const detection of detections) {
        // Skip extremely small faces (likely false positives)
        if (detection.detection.box.width < 15 || detection.detection.box.height < 15) {
          continue; 
        }
        
        // Try to match with existing tracked faces
        let matchedId: string | null = null;
        let minDistance = Number.MAX_VALUE;
        
        // Tracking by position with more lenient matching for distance detection
        for (const [id, trackedFace] of trackedFacesRef.current.entries()) {
          const centerX1 = trackedFace.box.x + trackedFace.box.width / 2;
          const centerY1 = trackedFace.box.y + trackedFace.box.height / 2;
          const centerX2 = detection.detection.box.x + detection.detection.box.width / 2;
          const centerY2 = detection.detection.box.y + detection.detection.box.height / 2;
          
          // Calculate distance as percentage of frame size for size-independent matching
          const distance = Math.sqrt(
            Math.pow(centerX1 - centerX2, 2) + 
            Math.pow(centerY1 - centerY2, 2)
          );
          
          // Scale threshold by face size for better matching at distance
          const threshold = Math.max(
            detection.detection.box.width, 
            detection.detection.box.height
          ) * 0.75; // More lenient threshold
          
          // If close enough to be considered the same face
          if (distance < threshold && distance < minDistance) {
            matchedId = id;
            minDistance = distance;
          }
        }
        
        if (matchedId) {
          // Update existing face with some position smoothing for stability
          const existingFace = trackedFacesRef.current.get(matchedId)!;
          // Simple smoothing to reduce jitter
          const smoothX = existingFace.box.x * 0.3 + detection.detection.box.x * 0.7;
          const smoothY = existingFace.box.y * 0.3 + detection.detection.box.y * 0.7;
          const smoothWidth = existingFace.box.width * 0.3 + detection.detection.box.width * 0.7;
          const smoothHeight = existingFace.box.height * 0.3 + detection.detection.box.height * 0.7;
          
          newFacesMap.set(matchedId, {
            id: matchedId,
            box: new faceapi.Box({
              x: smoothX,
              y: smoothY,
              width: smoothWidth,
              height: smoothHeight
            }),
            landmarks: detection.landmarks,
            detection: detection.detection,
            lastSeen: currentTime,
          });
        } else {
          // Add new face
          const newId = generateFaceId();
          newFacesMap.set(newId, {
            id: newId,
            box: detection.detection.box,
            landmarks: detection.landmarks,
            detection: detection.detection,
            lastSeen: currentTime,
          });
        }
      }

      // Check for still-valid faces that weren't matched in this frame
      for (const [id, trackedFace] of trackedFacesRef.current.entries()) {
        if (!newFacesMap.has(id) && currentTime - trackedFace.lastSeen < FACE_TIMEOUT) {
          // Keep face in tracking but don't update lastSeen
          newFacesMap.set(id, trackedFace);
        }
      }

      // Update tracked faces
      trackedFacesRef.current = newFacesMap;

      // Draw face boxes if enabled
      if (showFaceBoxes && canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          // Get the actual displayed dimensions of the video
          const videoEl = videoRef.current;
          const containerEl = canvasRef.current.parentElement;
          
          if (containerEl) {
            // Match canvas to container dimensions
            const containerWidth = containerEl.clientWidth;
            const containerHeight = containerEl.clientHeight;
            
            if (canvasRef.current.width !== containerWidth || 
                canvasRef.current.height !== containerHeight) {
              canvasRef.current.width = containerWidth;
              canvasRef.current.height = containerHeight;
            }
            
            // Clear previous drawings
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Calculate scale factors
            const scaleX = containerWidth / videoEl.videoWidth;
            const scaleY = containerHeight / videoEl.videoHeight;
            
            // Draw each face box with proper scaling
            for (const face of newFacesMap.values()) {
              // Apply padding to ensure the box includes the chin and full face
              const paddingX = 0.05 * face.box.width; // 5% horizontal padding
              const paddingTop = 0.15 * face.box.height; // 15% padding at the top
              const paddingBottom = 0.15 * face.box.height; // 15% extra padding at the bottom for chin
              
              // Create padded box
              const paddedBox = {
                x: Math.max(0, face.box.x - paddingX),
                y: Math.max(0, face.box.y - paddingTop),
                width: face.box.width + (paddingX * 2),
                height: face.box.height + paddingTop + paddingBottom
              };
              
              // Scale box coordinates to match display size
              const scaledBox = {
                x: paddedBox.x * scaleX,
                y: paddedBox.y * scaleY,
                width: paddedBox.width * scaleX,
                height: paddedBox.height * scaleY
              };
              
              // Determine age of the face detection for color coding
              const faceFreshness = Math.min(1, (currentTime - face.lastSeen) / FACE_TIMEOUT);
              const alpha = 1 - faceFreshness; // Fade out old detections
              
              // Draw a box with transparency based on detection age
              context.beginPath();
              context.rect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);
              context.lineWidth = 2;
              context.strokeStyle = `rgba(0, 255, 0, ${alpha})`; // Green with variable alpha
              context.stroke();
              
              // Add ID label for debugging
              context.font = '10px Arial';
              context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              context.fillText(face.id, scaledBox.x, scaledBox.y - 5);
            }
          }
        }
      }

      // Notify about detected faces using the ref
      const facesList = Array.from(newFacesMap.values());
      onFacesDetectedRef.current?.(facesList, facesList.length);

    } catch (error) {
      console.error('Error detecting faces:', error);
    } finally {
      processingRef.current = false;
    }
  }, [stream, modelLoaded, showFaceBoxes, generateFaceId]);

  // Handle tracking state
  useEffect(() => {
    const cleanupInterval = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isActive && modelLoaded && stream) {
      // Reset tracked faces when starting tracking after a stream change
      if (!intervalRef.current) {
        trackedFacesRef.current.clear();
        faceIdCounterRef.current = 0;
      }
      
      cleanupInterval(); // Ensures no duplicate intervals
      intervalRef.current = window.setInterval(detectFaces, detectionInterval);
    } else {
      cleanupInterval();
      
      // Clear tracked faces when stopping tracking
      if (!isActive || !stream) {
        trackedFacesRef.current.clear();
        // Call via ref instead
        onFacesDetectedRef.current?.([], 0);
      }
    }

    return cleanupInterval;
  }, [isActive, modelLoaded, stream, detectFaces, detectionInterval]);

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
      trackedFacesRef.current.clear();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 z-10 ${showFaceBoxes ? '' : 'hidden'}`}
    />
  );
});