// src/components/review/steps/ThankYouStep.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReview } from "@/contexts/FeedbackSessionContext";
import { CheckCircle2 } from "lucide-react";

export const ThankYouStep = () => {
  const { projectData } = useReview();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-50 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <CardTitle className="text-2xl">Thank You!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Thank you for reviewing "{projectData.title}". Your feedback is valuable
            and will help improve future content.
          </p>
          
          <p className="text-sm text-muted-foreground">
            Your responses have been recorded successfully.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};