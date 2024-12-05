// src/components/emotion/analysis/rules/TimelineRules.ts

import type { EmotionLabel } from '../../types/emotion';

export interface EmotionRange {
  min?: number;
  max?: number;
}

export interface EmotionConditions {
  required: { [key in EmotionLabel]?: EmotionRange };
  forbidden?: { [key in EmotionLabel]?: EmotionRange };
}

export interface TimelineState {
  conditions: EmotionConditions;
  description: string;
  priority: number;
  isComplex: boolean;
}

export const TimelineRules = {
  config: {
    intervalSeconds: 5,        // Analysis interval (5-second intervals)
    minEmotionIntensity: 5    // Minimum intensity to consider an emotion
  },

  // Complex emotion patterns (higher priority)
  complexStates: {
    'Peak Engagement': {
      conditions: {
        required: {
          happiness: { min: 60 },
          surprise: { min: 40 }
        },
        forbidden: {
          sadness: { max: 20 },
          anger: { max: 20 }
        }
      },
      description: "Viewers showed exceptionally positive engagement with strong interest in content",
      priority: 100,
      isComplex: true
    },

    'Strong Impact': {
      conditions: {
        required: {
          happiness: { min: 50 },
          surprise: { min: 30 },
          neutral: { max: 30 }
        }
      },
      description: "Viewers demonstrated high engagement with notable emotional resonance",
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
      description: "Viewers exhibited strong focus with clear interest in content",
      priority: 90,
      isComplex: true
    },

    'Deep Focus': {
      conditions: {
        required: {
          neutral: { min: 60 },
          surprise: { min: 20 }
        },
        forbidden: {
          anger: { max: 20 }
        }
      },
      description: "Viewers maintained high attention with periodic interest peaks",
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
      description: "Viewers showed complex emotional responses indicating strong content resonance",
      priority: 80,
      isComplex: true
    },

    'Critical Engagement': {
      conditions: {
        required: {
          neutral: { min: 50 },
          contempt: { min: 20 }
        }
      },
      description: "Viewers demonstrated analytical attention with evaluative responses",
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
      description: "Viewers displayed varied emotional responses to content elements",
      priority: 70,
      isComplex: true
    }
  },

  // Single emotion states with intensity levels
  singleStates: {
    // Happiness States
    'High Joy': {
      conditions: {
        required: {
          happiness: { min: 60 }
        }
      },
      description: "Viewers expressed strong positive reactions to content",
      priority: 65,
      isComplex: false
    },
    'Moderate Joy': {
      conditions: {
        required: {
          happiness: { min: 20, max: 60 }
        }
      },
      description: "Viewers showed clear positive responses to content",
      priority: 60,
      isComplex: false
    },
    'Mild Joy': {
      conditions: {
        required: {
          happiness: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle positive reactions to content",
      priority: 55,
      isComplex: false
    },

    // Surprise States
    'High Interest': {
      conditions: {
        required: {
          surprise: { min: 60 }
        }
      },
      description: "Viewers demonstrated strong interest in content",
      priority: 50,
      isComplex: false
    },
    'Moderate Interest': {
      conditions: {
        required: {
          surprise: { min: 20, max: 60 }
        }
      },
      description: "Viewers showed clear interest in content elements",
      priority: 45,
      isComplex: false
    },
    'Mild Interest': {
      conditions: {
        required: {
          surprise: { min: 5, max: 20 }
        }
      },
      description: "Viewers exhibited subtle interest in content",
      priority: 40,
      isComplex: false
    },

    // Neutral States
    'Deep Attention': {
      conditions: {
        required: {
          neutral: { min: 60 }
        }
      },
      description: "Viewers maintained strong focused attention to content",
      priority: 35,
      isComplex: false
    },
    'Steady Attention': {
      conditions: {
        required: {
          neutral: { min: 20, max: 60 }
        }
      },
      description: "Viewers showed consistent attention to content",
      priority: 30,
      isComplex: false
    },
    'Basic Attention': {
      conditions: {
        required: {
          neutral: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed basic attention to content",
      priority: 25,
      isComplex: false
    },

    // Sadness States
    'Strong Empathy': {
      conditions: {
        required: {
          sadness: { min: 60 }
        }
      },
      description: "Viewers showed strong emotional resonance with content",
      priority: 20,
      isComplex: false
    },
    'Moderate Empathy': {
      conditions: {
        required: {
          sadness: { min: 20, max: 60 }
        }
      },
      description: "Viewers exhibited clear emotional connection to content",
      priority: 15,
      isComplex: false
    },
    'Mild Empathy': {
      conditions: {
        required: {
          sadness: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle emotional response to content",
      priority: 10,
      isComplex: false
    },

    // Anger States
    'Strong Reaction': {
      conditions: {
        required: {
          anger: { min: 60 }
        }
      },
      description: "Viewers showed strong negative response to content",
      priority: 20,
      isComplex: false
    },
    'Moderate Reaction': {
      conditions: {
        required: {
          anger: { min: 20, max: 60 }
        }
      },
      description: "Viewers exhibited clear negative reaction to content",
      priority: 15,
      isComplex: false
    },
    'Mild Reaction': {
      conditions: {
        required: {
          anger: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle negative response to content",
      priority: 10,
      isComplex: false
    },

    // Disgust States
    'Strong Aversion': {
      conditions: {
        required: {
          disgust: { min: 60 }
        }
      },
      description: "Viewers showed strong aversive response to content",
      priority: 20,
      isComplex: false
    },
    'Moderate Aversion': {
      conditions: {
        required: {
          disgust: { min: 20, max: 60 }
        }
      },
      description: "Viewers exhibited clear aversive reaction to content",
      priority: 15,
      isComplex: false
    },
    'Mild Aversion': {
      conditions: {
        required: {
          disgust: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle aversive response to content",
      priority: 10,
      isComplex: false
    },

    // Fear States
    'High Tension': {
      conditions: {
        required: {
          fear: { min: 60 }
        }
      },
      description: "Viewers showed strong anxious response to content",
      priority: 20,
      isComplex: false
    },
    'Moderate Tension': {
      conditions: {
        required: {
          fear: { min: 20, max: 60 }
        }
      },
      description: "Viewers exhibited clear anxious reaction to content",
      priority: 15,
      isComplex: false
    },
    'Mild Tension': {
      conditions: {
        required: {
          fear: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle anxious response to content",
      priority: 10,
      isComplex: false
    },

    // Contempt States
    'Strong Criticism': {
      conditions: {
        required: {
          contempt: { min: 60 }
        }
      },
      description: "Viewers showed strong skeptical response to content",
      priority: 20,
      isComplex: false
    },
    'Moderate Criticism': {
      conditions: {
        required: {
          contempt: { min: 20, max: 60 }
        }
      },
      description: "Viewers exhibited clear skeptical reaction to content",
      priority: 15,
      isComplex: false
    },
    'Mild Criticism': {
      conditions: {
        required: {
          contempt: { min: 5, max: 20 }
        }
      },
      description: "Viewers displayed subtle skeptical response to content",
      priority: 10,
      isComplex: false
    }
  }
} as const;

export type TimelineStateType = keyof (typeof TimelineRules.complexStates & typeof TimelineRules.singleStates) | 'No Face Detected';