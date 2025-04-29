// src/contexts/ReviewContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { EmotionData } from '@/components/emotion/types/emotion';
import type { ReviewProjectData } from '@/types/feedbackSession';
import type { EmotionResponse } from '@/types/response';

export type ReviewStep = 
  | 'intro'
  | 'consent'
  | 'video'
  | 'quick-rating'
  | 'survey'
  | 'thank-you';

  export interface ReviewResponses {
    cameraStream?: MediaStream | null;
    currentEmotion?: EmotionData | null;  // Add this line
    emotionResponse?: EmotionResponse;
    isFaceDetected?: boolean;
    quickRating?: number;
    surveyResponses?: Record<string, string | number | string[]>;
  }

export interface ReviewContextType {
  currentStep: ReviewStep;
  projectData: ReviewProjectData;
  consentGiven: boolean;
  responses: ReviewResponses;
  nextStep: () => void;
  previousStep: () => void;
  setConsentGiven: (value: boolean) => void;
  setProjectData: (data: ReviewProjectData) => void;
  updateResponses: (data: Partial<ReviewResponses>) => void;
  mode: 'preview' | 'public';
}

interface ReviewProviderProps {
  children: ReactNode;
  initialData: ReviewProjectData;
  mode: 'preview' | 'public';
}

const ReviewContext = createContext<ReviewContextType | null>(null);

export const ReviewProvider = ({ 
  children, 
  initialData,
  mode 
}: ReviewProviderProps) => {
  const [currentStep, setCurrentStep] = useState<ReviewStep>('intro');
  const [projectData, setProjectData] = useState<ReviewProjectData>(initialData);
  const [consentGiven, setConsentGiven] = useState(false);
  const [responses, setResponses] = useState<ReviewResponses>({});

  const steps: ReviewStep[] = [
    'intro', 
    'consent', 
    'video', 
    'quick-rating', 
    'survey', 
    'thank-you'
  ];

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const updateResponses = (data: Partial<ReviewResponses>) => {
    setResponses(prev => ({
      ...prev,
      ...data
    }));
  };

  // Cleanup effect for camera stream
  useEffect(() => {
    return () => {
      if (responses.cameraStream) {
        responses.cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [responses.cameraStream]);

  // Create context value object
  const value: ReviewContextType = {
    currentStep,
    projectData,
    consentGiven,
    responses,
    nextStep,
    previousStep,
    setConsentGiven,
    setProjectData: (data: ReviewProjectData) => setProjectData(data),
    updateResponses,
    mode
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};