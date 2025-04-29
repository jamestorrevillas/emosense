// src/components/review/ReviewProgress.tsx
import { useReview } from "@/contexts/FeedbackSessionContext";
import { Progress } from "@/components/ui/progress";
import { ReviewStep } from "@/types/feedbackSession";

const STEP_TITLES: Record<ReviewStep, string> = {
  'intro': 'Welcome',
  'consent': 'Consent',
  'video': 'Watch Video',
  'quick-rating': 'Quick Rating',
  'survey': 'Survey',
  'thank-you': 'Complete'
};

export const ReviewProgress = () => {
  const { currentStep } = useReview();
  const steps = Object.keys(STEP_TITLES) as ReviewStep[];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentIndex + 1} of {steps.length}</span>
        <span>{STEP_TITLES[currentStep]}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};