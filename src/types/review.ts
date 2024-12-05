// src/types/review.ts
import { QuickRatingSettings, Question } from './project';

export type ReviewStep = 
  | 'intro'
  | 'consent'
  | 'video'
  | 'quick-rating'
  | 'survey'
  | 'thank-you';

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

export interface ReviewProjectData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  quickRating: QuickRatingSettings;
  survey: {
    questions: Question[];
    settings: {
      showQuestionsAtEnd: boolean;
      allowSkip: boolean;
      showProgressBar: boolean;
    };
  };
}

export interface ReviewResponses {
  quickRating?: number;
  surveyResponses?: Record<string, string | number | string[]>;
}