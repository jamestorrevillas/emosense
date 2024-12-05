//src/components/review/steps/QuickRatingStep.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReview } from "@/contexts/ReviewContext";
import { QuickRating } from "@/components/projects/QuickRating";

export function QuickRatingStep() {
  const { nextStep, projectData, updateResponses, mode } = useReview();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRate = async (value: number) => {
    // Store response in context
    updateResponses({ quickRating: value });

    // For preview mode, just move to next step
    if (mode === 'preview') {
      nextStep();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Just move to next step - actual submission will happen in SurveyStep
      nextStep();
    } catch (err) {
      console.error("Error processing rating:", err);
      setError("Failed to process rating. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!projectData.quickRating.enabled) {
    nextStep(); // Skip if quick rating is disabled
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Quick Rating</CardTitle>
        <CardDescription>
          {mode === 'preview' 
            ? 'Preview the rating component (responses will not be saved)'
            : 'Share your immediate feedback about the video'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
          <QuickRating
            settings={projectData.quickRating}
            onRate={handleRate}
            disabled={isSubmitting}
          />
        </div>
      </CardContent>
    </Card>
  );
}