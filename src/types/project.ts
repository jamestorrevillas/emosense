// src\types\project.ts
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  videoUrl: string;
  videoId: string;
  videoFileName?: string;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  quickRating: QuickRatingSettings;
  survey: Survey;
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface ProjectSettings {
  allowSkip: boolean;
  showProgressBar: boolean;
  collectAnonymousResponses: boolean;
}

export type QuickRatingType = 'stars' | 'emoji' | 'numeric' | 'thumbs';

export interface QuickRatingSettings {
  enabled: boolean;
  type: QuickRatingType;
  required: boolean;
  title: string;
  description?: string;
  scale: {
    min: number;
    max: number;
    step?: number;
  };
  labels?: {
    low?: string;
    high?: string;
  };
}

export const RATING_TYPES = {
  stars: {
    min: 1,
    max: 5,
    step: 1,
    labels: {
      low: 'Poor',
      high: 'Excellent'
    }
  },
  emoji: {
    min: 1,
    max: 5,
    step: 1,
    labels: {
      low: 'Very Unsatisfied',
      high: 'Very Satisfied'
    }
  },
  numeric: {
    min: 0,
    max: 10,
    step: 1,
    labels: {
      low: 'Not at all likely',
      high: 'Extremely likely'
    }
  },
  thumbs: {
    min: 0,
    max: 1,
    step: 1,
    labels: {
      low: 'Thumbs down',
      high: 'Thumbs up'
    }
  }
} as const;

export type QuestionType = 
  | 'multiple_choice'
  | 'rating_scale'
  | 'text'
  | 'checkbox'
  | 'yes_no';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  description?: string; // Add optional description
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
}

export interface RatingScaleQuestion extends BaseQuestion {
  type: 'rating_scale';
  minValue: number;
  maxValue: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}

export interface CheckboxQuestion extends BaseQuestion {
  type: 'checkbox';
  options: string[];
}

export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
}

export type Question = 
  | MultipleChoiceQuestion 
  | RatingScaleQuestion 
  | TextQuestion 
  | CheckboxQuestion 
  | YesNoQuestion;

export interface Survey {
  id: string;
  projectId: string;
  questions: Question[];
  settings: {
    showQuestionsAtEnd: boolean;
    allowSkip: boolean;
    showProgressBar: boolean;
  };
}

export interface CreateProjectData {
  title: string;
  description: string;
  videoUrl: string;
  videoId: string;
  thumbnailUrl?: string;
}

export interface SurveyResponse {
  [questionId: string]: string | string[] | number | boolean;
}