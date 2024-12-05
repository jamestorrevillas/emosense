// src/components/emotion/analysis/rules/OverallRules.ts

export const OverallRules = {
  // Emotion-specific analysis patterns
  emotionPatterns: {
    happiness: {
      veryHigh: {
        threshold: 80,
        summary: "Exceptional positive viewer response",
        description: "Viewers demonstrated exceptionally strong positive reactions throughout the content, indicating highly engaging and resonant material. The consistent positive response suggests notably effective content delivery."
      },
      high: {
        threshold: 50,
        summary: "Strong collective positive response",
        description: "Viewers showed consistent positive emotional responses, reflecting strong content engagement. This level of positive reaction indicates successful audience connection."
      },
      moderate: {
        threshold: 20,
        summary: "Notable positive audience reaction",
        description: "Viewers displayed clear positive responses to specific content elements, suggesting good engagement with key moments. These sections effectively connected with the audience."
      },
      low: {
        threshold: 5,
        summary: "Mild positive viewer engagement",
        description: "Viewers expressed occasional positive reactions to certain content elements. These moments identify content segments that successfully engaged the audience."
      },
      veryLow: {
        threshold: 0,
        summary: "Minimal positive response",
        description: "Viewers showed subtle positive reactions to specific moments. These instances highlight content elements that sparked minor audience interest."
      }
    },

    surprise: {
      veryHigh: {
        threshold: 80,
        summary: "Highly impactful content moments",
        description: "Viewers showed very strong surprise responses, indicating exceptionally engaging or unexpected content elements. The material successfully captured and maintained heightened audience attention."
      },
      high: {
        threshold: 50,
        summary: "Strong audience engagement peaks",
        description: "Viewers demonstrated significant surprise reactions, suggesting effectively unexpected or novel content elements. These moments successfully captured audience attention."
      },
      moderate: {
        threshold: 20,
        summary: "Notable moments of audience interest",
        description: "Viewers displayed clear surprise responses to specific content elements, indicating successful attention-grabbing moments. These sections effectively maintained audience engagement."
      },
      low: {
        threshold: 5,
        summary: "Mild audience intrigue",
        description: "Viewers showed occasional surprise reactions, highlighting content moments that caught audience attention. These elements provided modest engagement points."
      },
      veryLow: {
        threshold: 0,
        summary: "Subtle attention shifts",
        description: "Viewers exhibited minimal surprise responses, indicating slight audience reaction to specific content elements. These moments represent minor attention-grabbing points."
      }
    },

    neutral: {
      veryHigh: {
        threshold: 80,
        summary: "Sustained audience focus",
        description: "Viewers maintained highly consistent neutral attention throughout the content, indicating strong sustained focus and information processing. This suggests excellent content clarity and pacing."
      },
      high: {
        threshold: 50,
        summary: "Strong attentive viewing",
        description: "Viewers showed steady neutral engagement, reflecting consistent attention and content following. The material effectively maintained audience focus."
      },
      moderate: {
        threshold: 20,
        summary: "Balanced viewer attention",
        description: "Viewers displayed regular periods of neutral focus, indicating steady content processing. These segments maintained consistent audience attention."
      },
      low: {
        threshold: 5,
        summary: "Basic viewer attention",
        description: "Viewers exhibited periodic neutral attention, suggesting basic content following. These moments indicate baseline audience engagement."
      },
      veryLow: {
        threshold: 0,
        summary: "Minimal focused attention",
        description: "Viewers showed brief periods of neutral focus. These moments represent basic audience attention to content elements."
      }
    },

    sadness: {
      veryHigh: {
        threshold: 80,
        summary: "Deeply moving content",
        description: "Viewers demonstrated very strong emotional responses, indicating highly impactful or moving content. The material successfully evoked significant empathetic audience reactions."
      },
      high: {
        threshold: 50,
        summary: "Strong emotional impact",
        description: "Viewers showed significant empathetic responses, reflecting powerful emotional content moments. These sections effectively touched audience sensibilities."
      },
      moderate: {
        threshold: 20,
        summary: "Notable emotional resonance",
        description: "Viewers displayed clear emotional responses to specific content elements. These moments successfully evoked audience empathy."
      },
      low: {
        threshold: 5,
        summary: "Mild emotional connection",
        description: "Viewers exhibited occasional emotional reactions, indicating content elements that touched audience sensitivity. These moments created modest emotional impact."
      },
      veryLow: {
        threshold: 0,
        summary: "Subtle emotional response",
        description: "Viewers showed minimal emotional reactions to specific content elements. These instances indicate slight audience sensitivity to certain moments."
      }
    },

    anger: {
      veryHigh: {
        threshold: 80,
        summary: "Highly provocative content",
        description: "Viewers showed very strong negative reactions, indicating highly challenging or controversial content elements. This suggests potentially sensitive or divisive material."
      },
      high: {
        threshold: 50,
        summary: "Strong negative response",
        description: "Viewers demonstrated significant negative reactions, reflecting challenging content elements. These sections provoked strong audience opposition."
      },
      moderate: {
        threshold: 20,
        summary: "Notable viewer disapproval",
        description: "Viewers displayed clear negative responses to specific content elements. These moments triggered noticeable audience disagreement."
      },
      low: {
        threshold: 5,
        summary: "Mild viewer resistance",
        description: "Viewers showed occasional negative reactions, indicating potentially challenging content elements. These moments sparked modest audience concern."
      },
      veryLow: {
        threshold: 0,
        summary: "Minimal negative reaction",
        description: "Viewers exhibited subtle negative responses to specific content elements. These instances indicate slight audience resistance."
      }
    },

    disgust: {
      veryHigh: {
        threshold: 80,
        summary: "Highly aversive content",
        description: "Viewers demonstrated very strong aversive reactions, indicating significantly challenging content. These elements produced notable audience discomfort."
      },
      high: {
        threshold: 50,
        summary: "Strong viewer aversion",
        description: "Viewers showed significant aversive responses, reflecting notably challenging material. These sections triggered clear audience discomfort."
      },
      moderate: {
        threshold: 20,
        summary: "Notable audience discomfort",
        description: "Viewers displayed clear aversive reactions to specific content elements. These moments created noticeable audience unease."
      },
      low: {
        threshold: 5,
        summary: "Mild viewer unease",
        description: "Viewers exhibited occasional aversive responses, indicating potentially uncomfortable content elements. These moments caused modest audience concern."
      },
      veryLow: {
        threshold: 0,
        summary: "Subtle viewer discomfort",
        description: "Viewers showed minimal aversive reactions to specific content elements. These instances indicate slight audience unease."
      }
    },

    fear: {
      veryHigh: {
        threshold: 80,
        summary: "Highly intense content",
        description: "Viewers demonstrated very strong anxiety responses, indicating highly intense or unsettling content. These elements produced significant audience tension."
      },
      high: {
        threshold: 50,
        summary: "Strong viewer tension",
        description: "Viewers showed significant anxiety responses, reflecting intense content elements. These sections effectively built audience tension."
      },
      moderate: {
        threshold: 20,
        summary: "Notable audience anxiety",
        description: "Viewers displayed clear anxiety reactions to specific content elements. These moments created noticeable tension."
      },
      low: {
        threshold: 5,
        summary: "Mild viewer concern",
        description: "Viewers exhibited occasional anxiety responses, indicating potentially unsettling elements. These moments sparked modest audience unease."
      },
      veryLow: {
        threshold: 0,
        summary: "Subtle tension response",
        description: "Viewers showed minimal anxiety reactions to specific content elements. These instances indicate slight audience concern."
      }
    },

    contempt: {
      veryHigh: {
        threshold: 80,
        summary: "Highly contentious content",
        description: "Viewers demonstrated very strong skeptical reactions, indicating highly disputed or controversial content. These elements sparked significant audience criticism."
      },
      high: {
        threshold: 50,
        summary: "Strong viewer skepticism",
        description: "Viewers showed significant skeptical responses, reflecting questionable content elements. These sections triggered clear audience doubt."
      },
      moderate: {
        threshold: 20,
        summary: "Notable audience doubt",
        description: "Viewers displayed clear skeptical reactions to specific content elements. These moments created noticeable audience reservation."
      },
      low: {
        threshold: 5,
        summary: "Mild viewer reservation",
        description: "Viewers exhibited occasional skeptical responses, indicating potentially questionable elements. These moments sparked modest audience doubt."
      },
      veryLow: {
        threshold: 0,
        summary: "Subtle skeptical reaction",
        description: "Viewers showed minimal skeptical reactions to specific content elements. These instances indicate slight audience reservation."
      }
    }
  },

  thresholds: {
    significantChange: 15     // Percentage change needed to register as a new emotional state
  }
} as const;

export type EmotionIntensityType = 'veryHigh' | 'high' | 'moderate' | 'low' | 'veryLow';