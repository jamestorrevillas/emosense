// src/components/audienceAI/history/rules/AudienceOverallRules.ts

export const AudienceOverallRules = {
    // Emotion-specific analysis patterns for audience reactions
    emotionPatterns: {
      happiness: {
        veryHigh: {
          threshold: 80,
          summary: "Exceptional positive audience response",
          description: "Audience demonstrated exceptionally strong positive reactions throughout the presentation, indicating highly engaging and resonant material. The consistent positive response suggests notably effective content delivery."
        },
        high: {
          threshold: 60,
          summary: "Strong collective positive response",
          description: "Audience showed consistent positive emotional responses, reflecting strong content engagement. This level of positive reaction indicates successful audience connection."
        },
        moderate: {
          threshold: 40,
          summary: "Notable positive audience reaction",
          description: "Audience displayed clear positive responses to specific content elements, suggesting good engagement with key moments. These sections effectively connected with the audience."
        },
        low: {
          threshold: 20,
          summary: "Mild positive audience engagement",
          description: "Audience expressed occasional positive reactions to certain content elements. These moments identify content segments that successfully engaged the audience."
        },
        veryLow: {
          threshold: 0,
          summary: "Minimal positive audience response",
          description: "Audience showed subtle positive reactions to specific moments. These instances highlight content elements that sparked minor audience interest."
        }
      },
  
      surprise: {
        veryHigh: {
          threshold: 80,
          summary: "Highly impactful presentation moments",
          description: "Audience showed very strong surprise responses, indicating exceptionally engaging or unexpected content elements. The material successfully captured and maintained heightened audience attention."
        },
        high: {
          threshold: 60,
          summary: "Strong audience engagement peaks",
          description: "Audience demonstrated significant surprise reactions, suggesting effectively unexpected or novel content elements. These moments successfully captured audience attention."
        },
        moderate: {
          threshold: 40,
          summary: "Notable moments of audience interest",
          description: "Audience displayed clear surprise responses to specific content elements, indicating successful attention-grabbing moments. These sections effectively maintained audience engagement."
        },
        low: {
          threshold: 20,
          summary: "Mild audience intrigue",
          description: "Audience showed occasional surprise reactions, highlighting content moments that caught audience attention. These elements provided modest engagement points."
        },
        veryLow: {
          threshold: 0,
          summary: "Subtle attention shifts",
          description: "Audience exhibited minimal surprise responses, indicating slight audience reaction to specific content elements. These moments represent minor attention-grabbing points."
        }
      },
  
      neutral: {
        veryHigh: {
          threshold: 80,
          summary: "Sustained audience focus",
          description: "Audience maintained highly consistent neutral attention throughout the presentation, indicating strong sustained focus and information processing. This suggests excellent content clarity and pacing."
        },
        high: {
          threshold: 60,
          summary: "Strong attentive viewing",
          description: "Audience showed steady neutral engagement, reflecting consistent attention and content following. The material effectively maintained audience focus."
        },
        moderate: {
          threshold: 40,
          summary: "Balanced viewer attention",
          description: "Audience displayed regular periods of neutral focus, indicating steady content processing. These segments maintained consistent audience attention."
        },
        low: {
          threshold: 20,
          summary: "Basic viewer attention",
          description: "Audience exhibited periodic neutral attention, suggesting basic content following. These moments indicate baseline audience engagement."
        },
        veryLow: {
          threshold: 0,
          summary: "Minimal focused attention",
          description: "Audience showed brief periods of neutral focus. These moments represent basic audience attention to content elements."
        }
      },
  
      sadness: {
        veryHigh: {
          threshold: 80,
          summary: "Deeply moving presentation",
          description: "Audience demonstrated very strong emotional responses, indicating highly impactful or moving content. The material successfully evoked significant empathetic audience reactions."
        },
        high: {
          threshold: 60,
          summary: "Strong emotional impact",
          description: "Audience showed significant empathetic responses, reflecting powerful emotional content moments. These sections effectively touched audience sensibilities."
        },
        moderate: {
          threshold: 40,
          summary: "Notable emotional resonance",
          description: "Audience displayed clear emotional responses to specific content elements. These moments successfully evoked audience empathy."
        },
        low: {
          threshold: 20,
          summary: "Mild emotional connection",
          description: "Audience exhibited occasional emotional reactions, indicating content elements that touched audience sensitivity. These moments created modest emotional impact."
        },
        veryLow: {
          threshold: 0,
          summary: "Subtle emotional response",
          description: "Audience showed minimal emotional reactions to specific content elements. These instances indicate slight audience sensitivity to certain moments."
        }
      },
  
      anger: {
        veryHigh: {
          threshold: 80,
          summary: "Highly provocative content",
          description: "Audience showed very strong negative reactions, indicating highly challenging or controversial content elements. This suggests potentially sensitive or divisive material."
        },
        high: {
          threshold: 60,
          summary: "Strong negative audience response",
          description: "Audience demonstrated significant negative reactions, reflecting challenging content elements. These sections provoked strong audience opposition."
        },
        moderate: {
          threshold: 40,
          summary: "Notable audience disagreement",
          description: "Audience displayed clear negative responses to specific content elements. These moments triggered noticeable audience disagreement."
        },
        low: {
          threshold: 20,
          summary: "Mild audience resistance",
          description: "Audience showed occasional negative reactions, indicating potentially challenging content elements. These moments sparked modest audience concern."
        },
        veryLow: {
          threshold: 0,
          summary: "Minimal negative reaction",
          description: "Audience exhibited subtle negative responses to specific content elements. These instances indicate slight audience resistance."
        }
      },
  
      disgust: {
        veryHigh: {
          threshold: 80,
          summary: "Highly aversive content",
          description: "Audience demonstrated very strong aversive reactions, indicating significantly challenging content. These elements produced notable audience discomfort."
        },
        high: {
          threshold: 60,
          summary: "Strong audience aversion",
          description: "Audience showed significant aversive responses, reflecting notably challenging material. These sections triggered clear audience discomfort."
        },
        moderate: {
          threshold: 40,
          summary: "Notable audience discomfort",
          description: "Audience displayed clear aversive reactions to specific content elements. These moments created noticeable audience unease."
        },
        low: {
          threshold: 20,
          summary: "Mild audience unease",
          description: "Audience exhibited occasional aversive responses, indicating potentially uncomfortable content elements. These moments caused modest audience concern."
        },
        veryLow: {
          threshold: 0,
          summary: "Subtle audience discomfort",
          description: "Audience showed minimal aversive reactions to specific content elements. These instances indicate slight audience unease."
        }
      },
  
      fear: {
        veryHigh: {
          threshold: 80,
          summary: "Highly intense presentation",
          description: "Audience demonstrated very strong anxiety responses, indicating highly intense or unsettling content. These elements produced significant audience tension."
        },
        high: {
          threshold: 60,
          summary: "Strong audience tension",
          description: "Audience showed significant anxiety responses, reflecting intense content elements. These sections effectively built audience tension."
        },
        moderate: {
          threshold: 40,
          summary: "Notable audience anxiety",
          description: "Audience displayed clear anxiety reactions to specific content elements. These moments created noticeable tension."
        },
        low: {
          threshold: 20,
          summary: "Mild audience concern",
          description: "Audience exhibited occasional anxiety responses, indicating potentially unsettling elements. These moments sparked modest audience unease."
        },
        veryLow: {
          threshold: 0,
          summary: "Subtle tension response",
          description: "Audience showed minimal anxiety reactions to specific content elements. These instances indicate slight audience concern."
        }
      },
  
      contempt: {
        veryHigh: {
          threshold: 80,
          summary: "Highly contentious presentation",
          description: "Audience demonstrated very strong skeptical reactions, indicating highly disputed or controversial content. These elements sparked significant audience criticism."
        },
        high: {
          threshold: 60,
          summary: "Strong audience skepticism",
          description: "Audience showed significant skeptical responses, reflecting questionable content elements. These sections triggered clear audience doubt."
        },
        moderate: {
          threshold: 40,
          summary: "Notable audience doubt",
          description: "Audience displayed clear skeptical reactions to specific content elements. These moments created noticeable audience reservation."
        },
        low: {
          threshold: 20,
          summary: "Mild audience reservation",
          description: "Audience exhibited occasional skeptical responses, indicating potentially questionable elements. These moments sparked modest audience doubt."
        },
        veryLow: {
          threshold: 0,
          summary: "Subtle skeptical reaction",
          description: "Audience showed minimal skeptical reactions to specific content elements. These instances indicate slight audience reservation."
        }
      }
    },
  
    // Rules for audience size interpretations
    audienceSizeMetrics: {
      veryLarge: {
        threshold: 15,
        description: "Very large audience group"
      },
      large: {
        threshold: 10,
        description: "Large audience group"
      },
      medium: {
        threshold: 5,
        description: "Medium-sized audience group"
      },
      small: {
        threshold: 2,
        description: "Small audience group"
      },
      individual: {
        threshold: 1,
        description: "Individual audience member"
      }
    },
  
    // Metrics for audience engagement categories
    engagementMetrics: {
      attentionThresholds: {
        excellent: 80,
        good: 65,
        moderate: 50,
        poor: 30
      },
      emotionalImpactThresholds: {
        powerful: 80,
        strong: 65,
        moderate: 50,
        mild: 30
      }
    },
  
    thresholds: {
      significantChange: 15     // Percentage change needed to register as a new emotional state
    }
  } as const;
  
  export type EmotionIntensityType = 'veryHigh' | 'high' | 'moderate' | 'low' | 'veryLow';
  export type AudienceSizeType = 'veryLarge' | 'large' | 'medium' | 'small' | 'individual';