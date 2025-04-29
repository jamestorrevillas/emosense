// src/components/review/steps/IntroStep.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReview } from "@/contexts/FeedbackSessionContext";
import { Clock, Video, Star, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/videoReview";

// Get video duration
const getVideoLength = async (videoUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    // Fallback if metadata loading fails
    video.onerror = () => resolve(300); // Default to 5 minutes
  });
};

// Estimate time per question type
const estimateQuestionTime = (question: Question): number => {
  switch (question.type) {
    case 'text':
      return question.maxLength && question.maxLength > 100 ? 60 : 45; // Longer for large text fields
    case 'multiple_choice':
      return question.options.length > 5 ? 25 : 15; // More time for more options
    case 'rating_scale':
      return 20;
    case 'checkbox':
      return question.options.length > 5 ? 40 : 30; // More time for more options
    case 'yes_no':
      return 10;
    default:
      return 20;
  }
};

export const IntroStep = () => {
  const { nextStep, projectData, mode } = useReview();
  const [estimatedTime, setEstimatedTime] = useState<string>('calculating...');
  const [isCalculating, setIsCalculating] = useState(true);

  // Dynamic process steps
  const processSteps = [
    {
      key: 'video',
      icon: Video,
      title: 'Watch Video',
      description: 'Watch the complete video content'
    },
    ...(projectData.quickRating?.enabled ? [{
      key: 'rating',
      icon: Star,
      title: 'Quick Rating',
      description: projectData.quickRating.title || 'Provide your immediate feedback'
    }] : []),
    ...(projectData.survey?.questions?.length ? [{
      key: 'survey',
      icon: ClipboardList,
      title: 'Short Survey',
      description: `Answer ${projectData.survey.questions.length} brief question${projectData.survey.questions.length === 1 ? '' : 's'}`
    }] : [])
  ];

  useEffect(() => {
    const calculateEstimatedTime = async () => {
      try {
        setIsCalculating(true);
        
        // Initial setup time (camera, consent)
        const setupTime = 60; // 60 seconds for setup
        
        // Get video duration
        const videoDuration = await getVideoLength(projectData.videoUrl);
        
        // Quick rating time if enabled
        const ratingTime = projectData.quickRating?.enabled ? 20 : 0;
        
        // Calculate survey time based on question types and complexity
        const surveyTime = projectData.survey?.questions?.reduce((total, question) => {
          // Add question reading time (based on text length)
          const readingTime = Math.ceil(question.text.length / 20) * 2; // ~2 seconds per 20 characters
          // Add response time based on question type
          const responseTime = estimateQuestionTime(question);
          return total + readingTime + responseTime;
        }, 0) || 0;

        // Calculate total time in seconds
        const totalSeconds = Math.ceil(videoDuration + setupTime + ratingTime + surveyTime);

        // Add 10% buffer time
        const totalWithBuffer = Math.ceil(totalSeconds * 1.1);
        
        // Format time string
        if (totalWithBuffer < 60) {
          setEstimatedTime(`${totalWithBuffer} seconds`);
        } else if (totalWithBuffer < 3600) {
          const minutes = Math.ceil(totalWithBuffer / 60);
          setEstimatedTime(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          const hours = Math.floor(totalWithBuffer / 3600);
          const minutes = Math.ceil((totalWithBuffer % 3600) / 60);
          setEstimatedTime(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes > 0 ? `and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`);
        }
      } catch (error) {
        console.error('Error calculating time:', error);
        setEstimatedTime('5-10 minutes'); // Fallback estimate
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEstimatedTime();
  }, [projectData]);

  // Determine grid columns based on number of steps
  const getGridClass = (stepCount: number) => {
    switch (stepCount) {
      case 1:
        return 'max-w-sm mx-auto'; // Single centered column
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'; // Two columns on larger screens
      case 3:
        return 'grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto'; // Three columns on larger screens
      default:
        return '';
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{projectData.title}</CardTitle>
        <CardDescription className="text-base">
          {mode === 'preview' 
            ? 'Preview mode - responses will not be saved'
            : 'Thank you for participating in this review'
          }
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
        {processSteps.length > 0 && (
          <div className={cn(
            "grid gap-4",
            getGridClass(processSteps.length)
          )}>
            {processSteps.map((step) => (
              <div 
                key={step.key} 
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg bg-accent/50 transition-all duration-200",
                  "hover:bg-accent/70"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-lg">{step.title}</h3>
                <p className="text-sm text-center text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Time Estimate */}
        {processSteps.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating estimated time...</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                <span>Estimated time: {estimatedTime}</span>
              </>
            )}
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center pt-4">
          <Button 
            size="lg" 
            onClick={nextStep}
            className="bg-[#011BA1] hover:bg-[#00008B]"
          >
            {mode === 'preview' ? 'Start Preview' : 'Start Review'}
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground">
          You can pause the video at any time. Your responses will help improve future content.
        </p>
      </CardContent>
    </Card>
  );
}