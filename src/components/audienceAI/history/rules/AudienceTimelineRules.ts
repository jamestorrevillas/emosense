// src/components/audienceAI/history/rules/AudienceTimelineRules.ts
import type { EmotionLabel } from '@/components/emotion/types/emotion';

export interface EmotionRange {
  min?: number;
  max?: number;
}

export interface EmotionConditions {
  required: { [key in EmotionLabel]?: EmotionRange };
  forbidden?: { [key in EmotionLabel]?: EmotionRange };
  audienceSize?: { min?: number; max?: number }; // Optional audience size constraint
}

export interface AudienceTimelineState {
  conditions: EmotionConditions;
  description: string;
  priority: number;
  isComplex: boolean;
}

export const AudienceTimelineRules = {
  config: {
    intervalSeconds: 5,        // Analysis interval (5-second intervals)
    minEmotionIntensity: 5,    // Minimum intensity to consider an emotion
    faceConfidenceThreshold: 0.7 // Confidence threshold for face detection
  },

  // Complex audience emotion patterns (higher priority)
  complexStates: {
    'High Engagement': {
      conditions: {
        required: {
          happiness: { min: 60 },
          surprise: { min: 40 }
        },
        forbidden: {
          sadness: { max: 20 },
          anger: { max: 20 }
        },
        audienceSize: { min: 2 } // At least 2 people
      },
      description: "Audience showed exceptionally positive engagement with strong interest",
      priority: 100,
      isComplex: true
    },

    'Collective Interest': {
      conditions: {
        required: {
          happiness: { min: 40 },
          surprise: { min: 50 },
          neutral: { max: 30 }
        },
        audienceSize: { min: 1 }
      },
      description: "Audience demonstrated high collective engagement with notable emotional resonance",
      priority: 95,
      isComplex: true
    },

    'Active Learning': {
      conditions: {
        required: {
          surprise: { min: 40 },
          neutral: { min: 40 }
        },
        forbidden: {
          sadness: { max: 20 },
          anger: { max: 20 }
        }
      },
      description: "Audience exhibited strong focus with clear interest in content",
      priority: 90,
      isComplex: true
    },

    'Deep Concentration': {
      conditions: {
        required: {
          neutral: { min: 60 },
          surprise: { min: 20 }
        },
        forbidden: {
          anger: { max: 20 }
        }
      },
      description: "Audience maintained high attention with periodic interest peaks",
      priority: 85,
      isComplex: true
    },

    'Emotional Connection': {
      conditions: {
        required: {
          happiness: { min: 40 },
          sadness: { min: 20 }
        }
      },
      description: "Audience showed complex emotional responses indicating strong content resonance",
      priority: 80,
      isComplex: true
    },

    'Critical Analysis': {
      conditions: {
        required: {
          neutral: { min: 50 },
          contempt: { min: 20 }
        }
      },
      description: "Audience demonstrated analytical attention with evaluative responses",
      priority: 75,
      isComplex: true
    },

    'Mixed Response': {
      conditions: {
        required: {
          happiness: { min: 30 },
          sadness: { min: 20 },
          surprise: { min: 20 }
        }
      },
      description: "Audience displayed varied emotional responses to content elements",
      priority: 70,
      isComplex: true
    },

    'Audience Confusion': {
      conditions: {
        required: {
          surprise: { min: 40 },
          contempt: { min: 20 },
          happiness: { max: 30 }
        }
      },
      description: "Audience appears confused or uncertain about the presented content",
      priority: 65,
      isComplex: true
    },

    'Audience Disagreement': {
      conditions: {
        required: {
          contempt: { min: 30 },
          anger: { min: 20 }
        },
        forbidden: {
          happiness: { min: 30 }
        }
      },
      description: "Audience showing signs of disagreement or skepticism",
      priority: 60,
      isComplex: true
    }
  },

  // Single emotion states with intensity levels
  singleStates: {
    // Happiness States
    'Collective Joy': {
      conditions: {
        required: {
          happiness: { min: 60 }
        },
        audienceSize: { min: 2 }
      },
      description: "Multiple audience members expressed strong positive reactions",
      priority: 55,
      isComplex: false
    },
    'Positive Response': {
      conditions: {
        required: {
          happiness: { min: 40, max: 60 }
        }
      },
      description: "Audience showed clear positive responses to content",
      priority: 50,
      isComplex: false
    },
    'Mild Appreciation': {
      conditions: {
        required: {
          happiness: { min: 20, max: 40 }
        }
      },
      description: "Audience displayed subtle positive reactions to content",
      priority: 45,
      isComplex: false
    },

    // Surprise States
    'Collective Interest': {
      conditions: {
        required: {
          surprise: { min: 60 }
        },
        audienceSize: { min: 2 }
      },
      description: "Multiple audience members demonstrated strong interest in content",
      priority: 40,
      isComplex: false
    },
    'Moderate Interest': {
      conditions: {
        required: {
          surprise: { min: 30, max: 60 }
        }
      },
      description: "Audience showed clear interest in content elements",
      priority: 35,
      isComplex: false
    },
    'Mild Curiosity': {
      conditions: {
        required: {
          surprise: { min: 15, max: 30 }
        }
      },
      description: "Audience exhibited subtle interest in content",
      priority: 30,
      isComplex: false
    },

    // Neutral States
    'Deep Attention': {
      conditions: {
        required: {
          neutral: { min: 70 }
        }
      },
      description: "Audience maintained strong focused attention to content",
      priority: 25,
      isComplex: false
    },
    'Steady Attention': {
      conditions: {
        required: {
          neutral: { min: 40, max: 70 }
        }
      },
      description: "Audience showed consistent attention to content",
      priority: 20,
      isComplex: false
    },
    'Basic Attention': {
      conditions: {
        required: {
          neutral: { min: 20, max: 40 }
        }
      },
      description: "Audience displayed basic attention to content",
      priority: 15,
      isComplex: false
    },

    // Negative States (combined for simplicity)
    'Negative Response': {
      conditions: {
        required: {
          sadness: { min: 40 }
        }
      },
      description: "Audience displayed significant emotional concern or sadness",
      priority: 10,
      isComplex: false
    },
    'Audience Disagreement': {
      conditions: {
        required: {
          anger: { min: 30 }
        }
      },
      description: "Audience showed strong negative response to content",
      priority: 10,
      isComplex: false
    },
    'Audience Skepticism': {
      conditions: {
        required: {
          contempt: { min: 30 }
        }
      },
      description: "Audience exhibited clear skeptical reaction to content",
      priority: 10,
      isComplex: false
    },
    'Audience Discomfort': {
      conditions: {
        required: {
          fear: { min: 20 },
          disgust: { min: 20 }
        }
      },
      description: "Audience displayed signs of discomfort with the content",
      priority: 10,
      isComplex: false
    }
  }
} as const;

export type AudienceTimelineStateType = keyof (typeof AudienceTimelineRules.complexStates & typeof AudienceTimelineRules.singleStates) | 'No Audience Detected';