// src/components/review/steps/QuickRatingStep.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReview } from "@/contexts/FeedbackSessionContext";
import { QuickRating } from "@/components/videoReview/QuickRating";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Loader2 } from "lucide-react";

export function QuickRatingStep() {
  const { nextStep, projectData, updateResponses, mode, responses } = useReview();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Skip quick rating if disabled
  useEffect(() => {
    if (!projectData.quickRating?.enabled) {
      nextStep();
    }
  }, [projectData.quickRating?.enabled, nextStep]);

  const handleRate = async (value: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Store response in context
      updateResponses({ quickRating: value });

      // For preview mode, just move to next step
      if (mode === 'preview') {
        nextStep();
        return;
      }

      // If no survey questions, submit the response here
      if (!projectData.survey?.questions?.length) {
        const finalResponse = {
          projectId: projectData.id,
          status: 'completed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          data: {
            emotion: responses.emotionResponse || null,
            quickRating: value,
            survey: {}
          },
          mode: mode,
          metadata: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: Date.now()
          }
        };

        const responseRef = collection(doc(db, "projects", projectData.id), "responses");
        await addDoc(responseRef, finalResponse);
      }
      
      // Move to next step (either survey or thank you)
      nextStep();

      // If no survey, skip to thank you
      if (!projectData.survey?.questions?.length) {
        nextStep();
      }

    } catch (err) {
      console.error("Error processing rating:", err);
      setError("Failed to process rating. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Return null if quick rating is not enabled
  if (!projectData.quickRating?.enabled) {
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>
          {isSubmitting ? 'Submitting Response...' : 'Quick Rating'}
        </CardTitle>
        <CardDescription>
          {isSubmitting 
            ? 'Please wait while we process your feedback'
            : mode === 'preview'
              ? 'Preview the rating component (responses will not be saved)'
              : 'Share your immediate feedback about the video'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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