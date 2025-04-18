// src/components/audienceAI/trackers/MultiPersonEmotionTracker.tsx
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import { EmotionLabel } from 'src/components/emotion/types/emotion';

// Emotion scoring and calibration constants (from EmotionTracker.tsx)
const EMOTION_LABELS: EmotionLabel[] = [
  'neutral', 
  'happiness', 
  'surprise', 
  'sadness',
  'anger', 
  'disgust', 
  'fear', 
  'contempt'
];

// Calibration factors remain the same as in EmotionTracker
const CALIBRATION_FACTORS: Record<EmotionLabel, number> = {
  'neutral': 0.35,
  'happiness': 0.55,
  'surprise': 1.4,
  'sadness': 1.8,
  'anger': 2.0,
  'disgust': 5.0,
  'fear': 4.0,
  'contempt': 6.0
};

const EMOTION_THRESHOLDS: Record<EmotionLabel, number> = {
  'neutral': 0.22,
  'happiness': 0.18,
  'surprise': 0.16,
  'sadness': 0.15,
  'anger': 0.13,
  'disgust': 0.09,
  'fear': 0.11,
  'contempt': 0.08
};

// Processing intervals
const FACE_DETECTION_INTERVAL = 100; // ms between face detection runs
const EMOTION_DETECTION_INTERVAL = 250; // ms between emotion detection runs (less frequent)

// Extended interface for tracked faces including emotions
export interface TrackedFaceWithEmotion {
  id: string;
  box: faceapi.Box;
  landmarks?: faceapi.FaceLandmarks68;
  detection: faceapi.FaceDetection;
  lastSeen: number;
  // Emotion data
  emotions?: {
    scores: Record<EmotionLabel, number>;
    dominantEmotion?: EmotionLabel;
    lastProcessed: number;
  };
}

// Audience emotion summary data
export interface AudienceEmotionData {
  timestamp: number;
  faceCount: number;
  // Average emotions across all faces
  averageEmotions: Record<EmotionLabel, number>;
  // Dominant emotion across all faces
  dominantEmotion?: EmotionLabel;
  // Individual face data
  faces: TrackedFaceWithEmotion[];
}

interface MultiPersonEmotionTrackerProps {
  stream: MediaStream | null;
  isActive: boolean;
  showFaceBoxes?: boolean;
  showEmotionLabels?: boolean;
  faceDetectionInterval?: number;
  emotionDetectionInterval?: number;
  maxFacesPerFrame?: number;
  onEmotionsDetected?: (data: AudienceEmotionData) => void;
  onModelsLoaded?: (loaded: {face?: boolean, emotion?: boolean}) => void;
  resetKey?: number;
}

// Export ref interface for external control
export interface EmotionTrackerRefHandle {
  resetTracking: () => void;
}

/**
 * MultiPersonEmotionTracker component
 * 
 * Tracks multiple faces and their emotions in real-time using a webcam stream.
 * Uses face-api.js for face detection and TensorFlow.js for emotion recognition.
 */
export const MultiPersonEmotionTracker = forwardRef<EmotionTrackerRefHandle, MultiPersonEmotionTrackerProps>(({
  stream,
  isActive,
  showFaceBoxes = true,
  showEmotionLabels = false,
  faceDetectionInterval = FACE_DETECTION_INTERVAL,
  emotionDetectionInterval = EMOTION_DETECTION_INTERVAL,
  maxFacesPerFrame = 200,
  onEmotionsDetected,
  onModelsLoaded,
  resetKey
}: MultiPersonEmotionTrackerProps, ref) => {
  // State for model loading
  const [faceModelLoaded, setFaceModelLoaded] = useState(false);
  const [emotionModelLoaded, setEmotionModelLoaded] = useState(false);
  
  // Processing refs
  const faceProcessingRef = useRef(false);
  const emotionProcessingRef = useRef(false);
  const faceIntervalRef = useRef<number | null>(null);
  const emotionIntervalRef = useRef<number | null>(null);
  
  // Elements and data refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackedFacesRef = useRef<Map<string, TrackedFaceWithEmotion>>(new Map());
  const faceIdCounterRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Model refs
  const emotionModelRef = useRef<tf.LayersModel | null>(null);
  const faceDetectionOptionsRef = useRef(new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  }));
  
  // Loading state refs
  const mounted = useRef(true);
  const faceModelsLoadingRef = useRef(false);
  const emotionModelsLoadingRef = useRef(false);

  // Callback refs to avoid dependency issues
  const onEmotionsDetectedRef = useRef(onEmotionsDetected);
  const onModelsLoadedRef = useRef(onModelsLoaded);
  
  // Update callback refs when props change
  useEffect(() => {
    onEmotionsDetectedRef.current = onEmotionsDetected;
    onModelsLoadedRef.current = onModelsLoaded;
  }, [onEmotionsDetected, onModelsLoaded]);
  
  // Function to generate a unique face ID
  const generateFaceId = useCallback(() => {
    return `face_${faceIdCounterRef.current++}`;
  }, []);
  
  // Helper functions for emotion processing
  const softmax = useCallback((arr: number[]): number[] => {
    const maxVal = Math.max(...arr);
    const expValues = arr.map(val => Math.exp(val - maxVal));
    const sumExp = expValues.reduce((acc, val) => acc + val, 0);
    return expValues.map(val => (val / sumExp));
  }, []);

  const applyCalibration = useCallback((scores: number[]): number[] => {
    const calibratedScores = scores.map((score, index) => 
      score * CALIBRATION_FACTORS[EMOTION_LABELS[index]]
    );
    
    const sum = calibratedScores.reduce((a, b) => a + b, 0);
    return calibratedScores.map(score => score / sum);
  }, []);
  
  // Draw faces and emotions on canvas
  const drawFacesOnCanvas = useCallback((
    facesMap: Map<string, TrackedFaceWithEmotion>, 
    currentTime: number
  ) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const videoEl = videoRef.current;
    const containerEl = canvas?.parentElement;
    
    if (!context || !videoEl || !containerEl) return;
    
    // Match canvas to container dimensions
    const containerWidth = containerEl.clientWidth;
    const containerHeight = containerEl.clientHeight;
    
    if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
      canvas.width = containerWidth;
      canvas.height = containerHeight;
    }
    
    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale factors
    const scaleX = containerWidth / videoEl.videoWidth;
    const scaleY = containerHeight / videoEl.videoHeight;
    
    // Draw each face box with emotion data
    for (const face of facesMap.values()) {
      // Apply padding to ensure the box includes the full face
      const paddingX = 0.05 * face.box.width;
      const paddingTop = 0.15 * face.box.height;
      const paddingBottom = 0.15 * face.box.height;
      
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
      
      // Determine box color based on recency and emotion data
      let boxColor = '#FFFFFF'; // Default white
      const timeSinceLastSeen = currentTime - face.lastSeen;
      
      if (face.emotions?.dominantEmotion) {
        // Use different colors for different emotions
        switch(face.emotions.dominantEmotion) {
          case 'happiness': boxColor = '#FFD700'; break; // Gold
          case 'surprise': boxColor = '#FF8C00'; break; // Dark Orange
          case 'neutral': boxColor = '#808080'; break; // Gray
          case 'sadness': boxColor = '#4169E1'; break; // Royal Blue
          case 'anger': boxColor = '#FF0000'; break; // Red
          case 'disgust': boxColor = '#228B22'; break; // Forest Green
          case 'fear': boxColor = '#800080'; break; // Purple
          case 'contempt': boxColor = '#8B4513'; break; // Saddle Brown
          default: boxColor = '#00FF00'; // Green (default)
        }
      } else if (timeSinceLastSeen > 300) {
        // Fade older faces
        boxColor = '#AAAAAA'; // Light gray for faces without emotions or older faces
      } else {
        boxColor = '#00FF00'; // Green for newly detected faces
      }
      
      // Draw box with dynamic color
      context.beginPath();
      context.rect(scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height);
      context.lineWidth = 2;
      context.strokeStyle = boxColor;
      context.stroke();
      
      // Only show emotion label if enabled and we have emotion data
      if (showEmotionLabels && face.emotions?.dominantEmotion) {
        const emotion = face.emotions.dominantEmotion;
        const score = face.emotions.scores[emotion];
        
        if (score > 5) { // Only show if above threshold
          // Add emotion label with score
          context.fillStyle = 'rgba(0, 0, 0, 0.7)';
          context.fillRect(
            scaledBox.x, 
            scaledBox.y - 24, 
            Math.min(150, scaledBox.width), 
            24
          );
          
          context.font = '12px Arial';
          context.fillStyle = '#FFFFFF';
          context.fillText(
            `${emotion} (${Math.round(score)}%)`, 
            scaledBox.x + 5, 
            scaledBox.y - 8
          );
        }
      }
    }
  }, [showEmotionLabels]);
  
  // Reference to drawFacesOnCanvas to avoid circular dependencies
  const drawFacesOnCanvasRef = useRef(drawFacesOnCanvas);
  
  // Update ref when function changes
  useEffect(() => {
    drawFacesOnCanvasRef.current = drawFacesOnCanvas;
  }, [drawFacesOnCanvas]);
  
  // Aggregate emotions across all faces and report to parent
  const aggregateAndReportEmotions = useCallback((timestamp: number) => {
    // Convert tracked faces to array
    const faces = Array.from(trackedFacesRef.current.values());
    const faceCount = faces.length;
    
    // Calculate average emotions
    const emotionSums: Record<EmotionLabel, number> = EMOTION_LABELS.reduce((obj, label) => {
      obj[label] = 0;
      return obj;
    }, {} as Record<EmotionLabel, number>);
    
    let totalProcessedFaces = 0;
    
    // Sum up all emotion scores
    faces.forEach(face => {
      if (face.emotions && face.emotions.scores) {
        totalProcessedFaces++;
        EMOTION_LABELS.forEach(emotion => {
          emotionSums[emotion] += face.emotions!.scores[emotion];
        });
      }
    });
    
    // Calculate averages
    const averageEmotions: Record<EmotionLabel, number> = {} as Record<EmotionLabel, number>;
    if (totalProcessedFaces > 0) {
      EMOTION_LABELS.forEach(emotion => {
        averageEmotions[emotion] = emotionSums[emotion] / totalProcessedFaces;
      });
    } else {
      // Explicitly set all emotions to zero when no faces are detected
      EMOTION_LABELS.forEach(emotion => {
        averageEmotions[emotion] = 0;
      });
    }
    
    // Find dominant emotion across all faces
    let maxAvgScore = -1;
    let dominantEmotion: EmotionLabel | undefined;
    
    Object.entries(averageEmotions).forEach(([emotion, score]) => {
      if (score > maxAvgScore) {
        maxAvgScore = score;
        dominantEmotion = emotion as EmotionLabel;
      }
    });
    
    // Only set dominantEmotion if there's actually a face and emotion score
    if (faceCount === 0 || maxAvgScore <= 0) {
      dominantEmotion = undefined;
    }
    
    // Report to parent component - always report, even with zero faces
    if (onEmotionsDetectedRef.current) {
      onEmotionsDetectedRef.current({
        timestamp,
        faceCount,
        averageEmotions,
        dominantEmotion,
        faces
      });
    }
  }, []);
  
  // Reference to aggregateAndReportEmotions to avoid circular dependencies
  const aggregateAndReportEmotionsRef = useRef(aggregateAndReportEmotions);
  
  // Update ref when function changes
  useEffect(() => {
    aggregateAndReportEmotionsRef.current = aggregateAndReportEmotions;
  }, [aggregateAndReportEmotions]);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resetTracking: () => {
      console.log('Resetting face and emotion tracking');
      trackedFacesRef.current.clear();
      faceIdCounterRef.current = 0;
      
      // Reset by calling with empty data - always call this with proper zero values
      if (onEmotionsDetectedRef.current) {
        onEmotionsDetectedRef.current({
          timestamp: Date.now(),
          faceCount: 0,
          averageEmotions: EMOTION_LABELS.reduce((obj, label) => {
            obj[label] = 0;
            return obj;
          }, {} as Record<EmotionLabel, number>),
          dominantEmotion: undefined,
          faces: []
        });
      }
    }
  }));

  // Reset tracking when resetKey changes or stream changes
  useEffect(() => {
    console.log('Stream or resetKey changed, resetting emotion tracking');
    trackedFacesRef.current.clear();
    faceIdCounterRef.current = 0;
    
    // Update stream ref
    streamRef.current = stream;
    
    // Call with empty data to reset UI - ensure proper zero values
    onEmotionsDetectedRef.current?.({
      timestamp: Date.now(),
      faceCount: 0,
      averageEmotions: EMOTION_LABELS.reduce((obj, label) => {
        obj[label] = 0;
        return obj;
      }, {} as Record<EmotionLabel, number>),
      dominantEmotion: undefined,
      faces: []
    });
  }, [stream, resetKey]);
  
  // Load face detection models
  useEffect(() => {
    if (!isActive || faceModelsLoadingRef.current || faceModelLoaded) return;
       
    async function loadFaceModels() {
      if (faceModelsLoadingRef.current) return;
      faceModelsLoadingRef.current = true;
  
      try {
        console.log('Loading face detection models for AudienceAI...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api')
        ]);
  
        if (mounted.current) {
          console.log('Face detection models loaded successfully for AudienceAI');
          setFaceModelLoaded(true);
          if (onModelsLoadedRef.current) {
            onModelsLoadedRef.current({
              face: true
            });
          }
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        if (onModelsLoadedRef.current) {
          onModelsLoadedRef.current({
            face: false
          });
        }
      } finally {
        faceModelsLoadingRef.current = false;
      }
    }
  
    loadFaceModels();
  }, [isActive, faceModelLoaded]);

  // Load emotion detection model
  useEffect(() => {
    if (!isActive || emotionModelsLoadingRef.current || emotionModelLoaded) return;

    async function loadEmotionModel() {
      if (emotionModelsLoadingRef.current) return;
      emotionModelsLoadingRef.current = true;

      try {
        console.log('Loading emotion detection model...');
        const model = await tf.loadLayersModel('/models/emotion/model.json');
        
        // Warmup inference to initialize the model
        const dummyInput = tf.zeros([1, 48, 48, 1]);
        await model.predict(dummyInput) as tf.Tensor;
        dummyInput.dispose();

        emotionModelRef.current = model;
        
        if (mounted.current) {
          console.log('Emotion detection model loaded successfully');
          setEmotionModelLoaded(true);
          if (onModelsLoadedRef.current) {
            onModelsLoadedRef.current({
              emotion: true
            });
          }
        }
      } catch (error) {
        console.error('Error loading emotion detection model:', error);
        if (onModelsLoadedRef.current) {
          onModelsLoadedRef.current({
            emotion: true
          });
        }
      } finally {
        emotionModelsLoadingRef.current = false;
      }
    }

    loadEmotionModel();
  }, [isActive, emotionModelLoaded, faceModelLoaded]);

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

  // Detect faces with improved accuracy and performance
  const detectFaces = useCallback(async () => {
    if (!stream || stream !== streamRef.current || 
        !faceModelLoaded || faceProcessingRef.current || 
        !videoRef.current || !mounted.current) {
      return;
    }

    try {
      faceProcessingRef.current = true;

      // Skip detection if video isn't ready
      if (videoRef.current.paused || 
          videoRef.current.ended || 
          videoRef.current.readyState < 2) {
        return;
      }

      // Detect all faces in the frame
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        faceDetectionOptionsRef.current
      ).withFaceLandmarks();

      if (!mounted.current) return;

      const currentTime = Date.now();
      const newFacesMap = new Map<string, TrackedFaceWithEmotion>();
      const FACE_TIMEOUT = 500; // How long to keep tracking a face after it's lost

      // Update or add new faces
      for (const detection of detections) {
        // Try to match with existing tracked faces
        let matchedId: string | null = null;
        let minDistance = Number.MAX_VALUE;
        
        // Simple tracking by position
        for (const [id, trackedFace] of trackedFacesRef.current.entries()) {
          const centerX1 = trackedFace.box.x + trackedFace.box.width / 2;
          const centerY1 = trackedFace.box.y + trackedFace.box.height / 2;
          const centerX2 = detection.detection.box.x + detection.detection.box.width / 2;
          const centerY2 = detection.detection.box.y + detection.detection.box.height / 2;
          
          const distance = Math.sqrt(
            Math.pow(centerX1 - centerX2, 2) + 
            Math.pow(centerY1 - centerY2, 2)
          );
          
          // If close enough to be considered the same face
          if (distance < Math.max(detection.detection.box.width, detection.detection.box.height) / 2 
              && distance < minDistance) {
            matchedId = id;
            minDistance = distance;
          }
        }
        
        if (matchedId) {
          // Update existing face position but preserve emotion data
          const existingFace = trackedFacesRef.current.get(matchedId);
          newFacesMap.set(matchedId, {
            id: matchedId,
            box: detection.detection.box,
            landmarks: detection.landmarks,
            detection: detection.detection,
            lastSeen: currentTime,
            emotions: existingFace?.emotions
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
            // Initialize with empty emotion data
            emotions: {
              scores: EMOTION_LABELS.reduce((obj, label) => {
                obj[label] = 0;
                return obj;
              }, {} as Record<EmotionLabel, number>),
              lastProcessed: 0 
            }
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
        drawFacesOnCanvasRef.current(newFacesMap, currentTime);
      }

      // If no faces are detected, report zero values
      if (newFacesMap.size === 0) {
        aggregateAndReportEmotionsRef.current(currentTime);
      }

    } catch (error) {
      console.error('Error detecting faces:', error);
    } finally {
      faceProcessingRef.current = false;
    }
  }, [stream, faceModelLoaded, showFaceBoxes, generateFaceId]);

  // Process emotions for tracked faces
  const processEmotions = useCallback(async () => {
    if (!stream || stream !== streamRef.current || 
        !emotionModelLoaded || !emotionModelRef.current ||
        emotionProcessingRef.current || 
        !videoRef.current || !mounted.current) {
      return;
    }

    try {
      emotionProcessingRef.current = true;
      
      // Skip if video or tracked faces not ready
      if (videoRef.current.paused || 
          videoRef.current.ended || 
          videoRef.current.readyState < 2) {
        return;
      }

      const currentTime = Date.now();
      const processedFaces: TrackedFaceWithEmotion[] = [];
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!tempCtx) return;
      
      tempCanvas.width = 48;
      tempCanvas.height = 48;
      
      // Process each face, but limit to max faces per frame for performance
      // Sort faces by recency (process newest faces first)
      const sortedFaces = Array.from(trackedFacesRef.current.values())
        .sort((a, b) => {
          // First sort by emotion processing time (oldest first)
          const aLastProcessed = a.emotions?.lastProcessed || 0;
          const bLastProcessed = b.emotions?.lastProcessed || 0;
          if (aLastProcessed !== bLastProcessed) {
            return aLastProcessed - bLastProcessed;
          }
          // Then by how recently seen (newest first)
          return b.lastSeen - a.lastSeen;
        });
      
      // Process up to maxFacesPerFrame faces per frame
      const facesToProcess = sortedFaces.slice(0, maxFacesPerFrame);
      
      for (const face of facesToProcess) {
        try {
          // Extract face region from video
          const { x, y, width, height } = face.box;
          
          // Expand the box slightly to make sure we get the whole face
          const paddingX = 0.05 * width;
          const paddingY = 0.05 * height;
          const paddedX = Math.max(0, x - paddingX);
          const paddedY = Math.max(0, y - paddingY);
          const paddedWidth = Math.min(videoRef.current.videoWidth - paddedX, width + (paddingX * 2));
          const paddedHeight = Math.min(videoRef.current.videoHeight - paddedY, height + (paddingY * 2));
          
          // Draw face to temp canvas for processing
          tempCtx.drawImage(
            videoRef.current,
            paddedX, paddedY, paddedWidth, paddedHeight,
            0, 0, 48, 48
          );
          
          // Get image data and process
          const imageData = tempCtx.getImageData(0, 0, 48, 48);
          
          // Convert to tensor and normalize
          const tensor = tf.tidy(() => {
            return tf.browser.fromPixels(imageData)
              .mean(2) // Convert to grayscale
              .expandDims(2) // Add channel dimension
              .expandDims(0) // Add batch dimension
              .toFloat()
              .div(255.0); // Normalize
          });
          
          // Predict emotions
          const predictions = await emotionModelRef.current.predict(tensor) as tf.Tensor;
          const emotionScores = await predictions.data();
          const scoresArray = Array.from(emotionScores);
          
          // Process scores
          const normalizedScores = softmax(scoresArray);
          const calibratedScores = applyCalibration(normalizedScores);
          
          // Apply thresholds and scale to percentages
          const finalScores: Record<EmotionLabel, number> = {
            neutral: 0,
            happiness: 0,
            surprise: 0,
            sadness: 0,
            anger: 0,
            disgust: 0,
            fear: 0,
            contempt: 0
          };
          
          EMOTION_LABELS.forEach((emotion, index) => {
            const score = calibratedScores[index];
            const thresholdedScore = score > EMOTION_THRESHOLDS[emotion] ? score : 0;
            finalScores[emotion] = Math.max(0, Math.min(100, thresholdedScore * 100));
          });
          
          // Find dominant emotion
          let maxScore = -1;
          let dominantEmotion: EmotionLabel | undefined;
          
          Object.entries(finalScores).forEach(([emotion, score]) => {
            if (score > maxScore) {
              maxScore = score;
              dominantEmotion = emotion as EmotionLabel;
            }
          });
          
          // Update the emotion data in our tracked face
          const updatedFace = { ...face };
          updatedFace.emotions = {
            scores: finalScores,
            dominantEmotion,
            lastProcessed: currentTime
          };
          
          // Update in map and add to processed array
          trackedFacesRef.current.set(face.id, updatedFace);
          processedFaces.push(updatedFace);
          
          // Clean up
          tensor.dispose();
          predictions.dispose();
          
        } catch (error) {
          console.error('Error processing emotions for face:', error);
        }
      }
      
      // Aggregate emotion data across all faces and report to parent
      // Do this always, even if no faces were processed in this iteration
      aggregateAndReportEmotionsRef.current(currentTime);
      
      // Re-draw faces with emotion data
      if (showFaceBoxes && canvasRef.current && videoRef.current) {
        drawFacesOnCanvasRef.current(trackedFacesRef.current, currentTime);
      }
      
    } catch (error) {
      console.error('Error processing emotions:', error);
    } finally {
      emotionProcessingRef.current = false;
    }
}, [stream, emotionModelLoaded, maxFacesPerFrame, showFaceBoxes, softmax, applyCalibration]);

  // Setup detection intervals
  useEffect(() => {
    const cleanupIntervals = () => {
      if (faceIntervalRef.current) {
        window.clearInterval(faceIntervalRef.current);
        faceIntervalRef.current = null;
      }
      if (emotionIntervalRef.current) {
        window.clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = null;
      }
    };

    // Start detection when active and models are loaded
    if (isActive && faceModelLoaded && emotionModelLoaded && stream) {
      cleanupIntervals(); // Clear any existing intervals
      
      // Start face detection interval
      faceIntervalRef.current = window.setInterval(detectFaces, faceDetectionInterval);
      
      // Start emotion detection interval (less frequent)
      emotionIntervalRef.current = window.setInterval(processEmotions, emotionDetectionInterval);
      
      // Initial report of zero values if we just started with no faces detected
      if (trackedFacesRef.current.size === 0) {
        aggregateAndReportEmotionsRef.current(Date.now());
      }
    } else {
      cleanupIntervals();
      
      // If we're deactivating, send zero values
      if (!isActive && onEmotionsDetectedRef.current) {
        onEmotionsDetectedRef.current({
          timestamp: Date.now(),
          faceCount: 0,
          averageEmotions: EMOTION_LABELS.reduce((obj, label) => {
            obj[label] = 0;
            return obj;
          }, {} as Record<EmotionLabel, number>),
          dominantEmotion: undefined,
          faces: []
        });
      }
    }

    return cleanupIntervals;
  }, [
    isActive, 
    faceModelLoaded, 
    emotionModelLoaded, 
    stream, 
    detectFaces, 
    processEmotions, 
    faceDetectionInterval, 
    emotionDetectionInterval
  ]);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      
      // Clean up video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      
      // Clear intervals
      if (faceIntervalRef.current) {
        window.clearInterval(faceIntervalRef.current);
        faceIntervalRef.current = null;
      }
      if (emotionIntervalRef.current) {
        window.clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = null;
      }
      
      // Clear tracked faces
      trackedFacesRef.current.clear();
      
      // Dispose of TensorFlow model
      if (emotionModelRef.current) {
        emotionModelRef.current.dispose();
        emotionModelRef.current = null;
      }
    };
  }, []);

  // Render canvas element for face and emotion visualization
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 z-10 ${showFaceBoxes ? '' : 'hidden'}`}
    />
  );
});