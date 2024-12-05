// src/components/emotion/tracker/EmotionTracker.tsx
import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { EmotionLabel, EmotionData, ProcessingStatus } from '../types/emotion';
import type { Box } from '@vladmandic/face-api';

interface EmotionTrackerProps {
  stream: MediaStream | null;
  detectedFace: HTMLCanvasElement | null;
  faceBox: Box | null;
  isTracking: boolean;
  onProcessingStatusChange?: (status: ProcessingStatus) => void;
  onEmotionDetected?: (data: EmotionData) => void;
}

const EMOTION_LABELS: EmotionLabel[] = [
  'neutral', 'happiness', 'surprise', 'sadness',
  'anger', 'disgust', 'fear', 'contempt'
];

// Calibration factors to compensate for class imbalance
// Higher values for underrepresented emotions to boost their signal
const CALIBRATION_FACTORS: Record<EmotionLabel, number> = {
  'neutral': 0.35,    // Reduced to prevent over-dominance (most common state)
  'happiness': 0.55,  // Slightly increased (most reliably detected positive emotion)
  'surprise': 1.4,    // Increased (brief, can be subtle, needs boost)
  'sadness': 1.8,    // Higher (often subtle, commonly confused with neutral)
  'anger': 2.0,      // Increased (important to detect, often mixed with other emotions)
  'disgust': 5.0,    // Significantly higher (very limited data, distinctive expression)
  'fear': 4.0,       // Higher (rare, often confused with surprise)
  'contempt': 6.0     // Highest (extremely limited data, subtle expression)
};

// Thresholds adjusted based on training data distribution
// Lower thresholds for emotions with less training data
const EMOTION_THRESHOLDS: Record<EmotionLabel, number> = {
  'neutral': 0.22,    // Balanced to allow other emotions to surface
  'happiness': 0.18,  // Lower (reliable detection, distinct features)
  'surprise': 0.16,   // Moderate (distinctive but can be confused with fear)
  'sadness': 0.15,    // Moderate (subtle but important to detect)
  'anger': 0.13,     // Lower threshold (important for UX insights)
  'disgust': 0.09,   // Very low (rare but distinctive when present)
  'fear': 0.11,      // Low (rare, needs to be detected when present)
  'contempt': 0.08    // Lowest (extremely subtle, needs sensitive detection)
};

const EMOTION_INTERVAL = 16;

const softmax = (arr: number[]): number[] => {
  const maxVal = Math.max(...arr);
  const expValues = arr.map(val => Math.exp(val - maxVal));
  const sumExp = expValues.reduce((acc, val) => acc + val, 0);
  return expValues.map(val => (val / sumExp));
};

// Function to apply calibration factors
const applyCalibration = (scores: number[]): number[] => {
  // Apply calibration factors
  const calibratedScores = scores.map((score, index) => 
    score * CALIBRATION_FACTORS[EMOTION_LABELS[index]]
  );
  
  // Normalize to ensure sum is 1
  const sum = calibratedScores.reduce((a, b) => a + b, 0);
  return calibratedScores.map(score => score / sum);
};

export function EmotionTracker({
  stream,
  detectedFace,
  faceBox,
  isTracking,
  onProcessingStatusChange,
  onEmotionDetected
}: EmotionTrackerProps) {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    fps: 0,
    modelLoaded: false
  });
  
  const [startTime, setStartTime] = useState<number>(0);
  const frameRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const processingRef = useRef<boolean>(false);
  const lastProcessTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Load emotion model
  useEffect(() => {
    async function loadModel() {
      try {
        setStatus(prev => ({ ...prev, isProcessing: true }));
        
        console.log("Loading emotion model...");
        const model = await tf.loadLayersModel('/models/emotion/model.json');
        
        // Warmup
        const dummyInput = tf.zeros([1, 48, 48, 1]);
        await model.predict(dummyInput) as tf.Tensor;
        dummyInput.dispose();

        modelRef.current = model;
        setStatus(prev => ({ 
          ...prev, 
          modelLoaded: true,
          isProcessing: false 
        }));
      } catch (err) {
        console.error('Error loading emotion model:', err);
        setStatus(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to load model',
          isProcessing: false
        }));
      }
    }

    loadModel();

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, []);

  // Process emotions when face is detected
  useEffect(() => {
    const processEmotions = async () => {
      if (!stream || !modelRef.current || processingRef.current || !detectedFace) {
        return;
      }

      try {
        processingRef.current = true;

        // Calculate FPS
        const now = performance.now();
        frameCountRef.current++;
        
        if (now - lastProcessTimeRef.current >= 1000) {
          const fps = frameCountRef.current;
          frameCountRef.current = 0;
          lastProcessTimeRef.current = now;
          setStatus(prev => ({ ...prev, fps }));
        }

        // Setup canvas for preprocessing
        const canvas = frameRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (!canvas || !ctx) return;

        // Prepare face for emotion detection
        canvas.width = 48;
        canvas.height = 48;
        ctx.drawImage(detectedFace, 0, 0, 48, 48);
        
        // Get image data and process
        const imageData = ctx.getImageData(0, 0, 48, 48);
        
        // Convert to tensor
        const tensor = tf.tidy(() => {
          return tf.browser.fromPixels(imageData)
            .mean(2)
            .expandDims(2)
            .expandDims(0)
            .toFloat()
            .div(255.0);
        });

        // Predict emotions
        const predictions = await modelRef.current.predict(tensor) as tf.Tensor;
        const emotionScores = await predictions.data();
        const scoresArray = Array.from(emotionScores);

        // Process scores
        const normalizedScores = softmax(scoresArray);
        
        // Apply calibration and thresholds
        const calibratedScores = applyCalibration(normalizedScores);
        const thresholdedScores = calibratedScores.map((score, index) => 
          score > EMOTION_THRESHOLDS[EMOTION_LABELS[index]] ? score : 0
        );
        
        // Convert to percentages
        const finalScores = thresholdedScores.map(score => score * 100);

        // Format results
        const emotionData: EmotionData = {
          timestamp: now - startTime,
          scores: {
            neutral: Math.max(0, Math.min(100, finalScores[0])),
            happiness: Math.max(0, Math.min(100, finalScores[1])),
            surprise: Math.max(0, Math.min(100, finalScores[2])),
            sadness: Math.max(0, Math.min(100, finalScores[3])),
            anger: Math.max(0, Math.min(100, finalScores[4])),
            disgust: Math.max(0, Math.min(100, finalScores[5])),
            fear: Math.max(0, Math.min(100, finalScores[6])),
            contempt: Math.max(0, Math.min(100, finalScores[7]))
          },
          dominantEmotion: EMOTION_LABELS[
            finalScores.indexOf(Math.max(...finalScores))
          ],
          faceBox: faceBox ? {
            x: faceBox.x,
            y: faceBox.y,
            width: faceBox.width,
            height: faceBox.height
          } : undefined
        };

        onEmotionDetected?.(emotionData);

        // Cleanup
        tensor.dispose();
        predictions.dispose();

      } catch (err) {
        console.error('Error processing emotions:', err);
      } finally {
        processingRef.current = false;
      }
    };

    if (isTracking) {
      setStartTime(performance.now());
      const interval = window.setInterval(processEmotions, EMOTION_INTERVAL);
      return () => window.clearInterval(interval);
    }
  }, [isTracking, stream, detectedFace, faceBox]);

  // Update status
  useEffect(() => {
    onProcessingStatusChange?.(status);
  }, [status, onProcessingStatusChange]);

  return (
    <canvas 
      ref={frameRef}
      className="hidden"
      width={48}
      height={48}
    />
  );
}