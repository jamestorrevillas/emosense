// src/pages/review/ReviewPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ReviewProvider, useReview } from "@/contexts/FeedbackSessionContext";
import { ReviewProgress } from "@/components/feedbackSession/ReviewProgress";
import { IntroStep } from "@/components/feedbackSession/steps/IntroStep";
import { ConsentStep } from "@/components/feedbackSession/steps/ConsentStep";
import { VideoStep } from "@/components/feedbackSession/steps/VideoStep";
import { QuickRatingStep } from "@/components/feedbackSession/steps/QuickRatingStep";
import { SurveyStep } from "@/components/feedbackSession/steps/SurveyStep";
import { ThankYouStep } from "@/components/feedbackSession/steps/ThankYouStep";
import { ReviewProjectData } from "@/types/feedbackSession";
import { Project } from "@/types/videoReview";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateToken } from "@/lib/utils/token";

const ReviewStepComponent = () => {
  const { currentStep } = useReview();

  switch (currentStep) {
    case 'intro':
      return <IntroStep />;
    case 'consent':
      return <ConsentStep />;
    case 'video':
      return <VideoStep />;
    case 'quick-rating':
      return <QuickRatingStep />;
    case 'survey':
      return <SurveyStep />;
    case 'thank-you':
      return <ThankYouStep />;
    default:
      return null;
  }
};

const ReviewContent = () => {
  const { mode } = useReview();
  
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {mode === 'preview' && (
        <div className="max-w-4xl mx-auto mb-6">
          <Alert>
            <AlertTitle>Preview Mode</AlertTitle>
            <AlertDescription>
              You are previewing how your review will appear to participants. 
              Responses in preview mode are not recorded.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-8">
        <ReviewProgress />
        <ReviewStepComponent />
      </div>
    </div>
  );
};

interface ReviewPageProps {
  mode?: 'preview' | 'public';
}

export const FeedbackSessionPage = ({ mode = 'public' }: ReviewPageProps) => {
  const { projectId, token } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [projectData, setProjectData] = useState<ReviewProjectData | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
        if (!projectId) {
          setError("No project ID provided");
          setLoading(false);
          return;
        }
      
        try {
          console.log('Starting project fetch for:', projectId);
      
          // For public mode, validate token first
          if (mode === 'public') {
            if (!token) {
              console.log('No token provided');
              setError("Access token required");
              setLoading(false);
              return;
            }
      
            console.log('Starting token validation');
            const validation = await validateToken(projectId, token);
            console.log('Token validation result:', validation);
      
            if (!validation.isValid) {
              setError(validation.error || "Invalid access token");
              setLoading(false);
              return;
            }
          }
      
          // Get project data
          console.log('Fetching project data');
          const projectRef = doc(db, "projects", projectId);
          const projectSnap = await getDoc(projectRef);
      
          if (!projectSnap.exists()) {
            console.log('Project not found');
            setError("Project not found");
            setLoading(false);
            return;
          }
      
          const project = projectSnap.data() as Project;
          
          // For preview mode, verify user owns the project
          if (mode === 'preview') {
            if (!user || project.userId !== user.uid) {
              console.log('Permission denied for preview');
              setError("You don't have permission to preview this project");
              setLoading(false);
              return;
            }
          }
      
          // Check if project is active
          if (project.status !== 'active' && mode === 'public') {
            console.log('Project is not active');
            setError("This project is not currently accepting responses");
            setLoading(false);
            return;
          }
      
          console.log('Project data retrieved successfully');
          const reviewData: ReviewProjectData = {
            id: project.id,
            title: project.title,
            description: project.description,
            videoUrl: project.videoUrl,
            thumbnailUrl: project.thumbnailUrl,
            quickRating: project.quickRating,
            survey: project.survey
          };
      
          setProjectData(reviewData);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching project:", err);
          setError("Failed to load project");
          setLoading(false);
        }
      };

    fetchProject();
  }, [projectId, token, mode, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please check the URL and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReviewProvider 
      initialData={projectData} 
      mode={mode}
    >
      <ReviewContent />
    </ReviewProvider>
  );
};