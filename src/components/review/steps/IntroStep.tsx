// src/components/review/steps/IntroStep.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReview } from "@/contexts/ReviewContext";
import { Clock, Video, Star, ClipboardList } from "lucide-react";

export const IntroStep = () => {
  const { nextStep, projectData } = useReview();

  // Calculate estimated time (video duration + rating + survey questions)
  const getEstimatedTime = () => {
    const videoDuration = 5; // Default 5 minutes
    const ratingTime = projectData.quickRating?.enabled ? 1 : 0;
    const surveyTime = (projectData.survey?.questions?.length || 0) * 0.5; // 30 seconds per question
    
    const totalMinutes = Math.ceil(videoDuration + ratingTime + surveyTime);
    return `${totalMinutes} minutes`;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{projectData.title}</CardTitle>
        <CardDescription className="text-base">
          Thank you for participating in this review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Description */}
        {projectData.description && (
          <p className="text-center text-muted-foreground">
            {projectData.description}
          </p>
        )}

        {/* Process Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50">
            <Video className="h-6 w-6 text-primary" />
            <h3 className="font-medium">Watch Video</h3>
            <p className="text-sm text-center text-muted-foreground">
              Watch the complete video content
            </p>
          </div>

          {projectData.quickRating?.enabled && (
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50">
              <Star className="h-6 w-6 text-primary" />
              <h3 className="font-medium">Quick Rating</h3>
              <p className="text-sm text-center text-muted-foreground">
                Provide your immediate feedback
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h3 className="font-medium">Short Survey</h3>
            <p className="text-sm text-center text-muted-foreground">
              Answer {projectData.survey?.questions.length} brief questions
            </p>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Estimated time: {getEstimatedTime()}</span>
        </div>

        {/* Start Button */}
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={nextStep}>
            Start Review
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground">
          You can pause the video at any time. Your responses will help improve future content.
        </p>
      </CardContent>
    </Card>
  );
};