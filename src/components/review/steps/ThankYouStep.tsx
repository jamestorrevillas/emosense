// src/components/review/steps/ThankYouStep.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReview } from "@/contexts/ReviewContext";
import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export const ThankYouStep = () => {
  const { projectData } = useReview();

  useEffect(() => {
    // Listen for beforeunload to prevent accidental closure
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = '');
    };

    // Add listener when component mounts
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Remove listener when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleClose = () => {
    // Check if window was opened by another window
    if (window.opener) {
      // If it was opened in a new window/tab, close it
      window.close();
      
      // Fallback for browsers that block window.close()
      setTimeout(() => {
        // Show message if window couldn't be closed
        if (!window.closed) {
          const message = document.getElementById('close-message');
          if (message) {
            message.classList.remove('hidden');
          }
        }
      }, 100);
    } else {
      // If it wasn't opened in a new window/tab, redirect to a safe URL
      window.location.href = '/';
    }
  };

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

        <div className="pt-4 space-y-2">
          <Button 
            onClick={handleClose}
            className="min-w-[200px] bg-[#011BA1] hover:bg-[#00008B]"
          >
            <X className="mr-2 h-4 w-4" />
            Close Review
          </Button>

          <div 
            id="close-message" 
            className="hidden text-xs text-muted-foreground bg-muted p-2 rounded-lg mt-2"
          >
            Your browser prevented automatic closing. Please close this tab manually.
          </div>

          {window.opener && (
            <p className="text-xs text-muted-foreground">
              You can safely close this window
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};