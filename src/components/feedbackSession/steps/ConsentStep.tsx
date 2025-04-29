// src/components/review/steps/ConsentStep.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useReview } from "@/contexts/FeedbackSessionContext";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WebcamFeed } from "@/components/emotion/tracker/WebcamFeed";
import { 
  AlertCircle,
  ClipboardList, 
  ShieldCheck, 
  VideoIcon,
  Star,
  UserCircle2,
  Lock,
  Camera
} from "lucide-react";

export const ConsentStep = () => {
  const { nextStep, setConsentGiven, projectData, updateResponses } = useReview();
  const [consent, setConsent] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleStreamReady = (newStream: MediaStream) => {
    setStream(newStream);
    updateResponses({ cameraStream: newStream });
    setCameraError(null);
  };

  const handleCameraToggle = (enabled: boolean) => {
    setCameraEnabled(enabled);
    if (!enabled && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      updateResponses({ cameraStream: null });
    }
  };

  const handleContinue = () => {
    if (!consent) {
      return;
    }
    
    if (!stream) {
      setCameraError("Camera access is required to continue");
      setCameraEnabled(true); // Attempt to enable camera automatically
      return;
    }

    setConsentGiven(true);
    nextStep();
  };

  // Dynamically generate data collection points
  const dataCollectionPoints = [
    {
      icon: Camera,
      text: "Face detection data for attention tracking (no video is stored)"
    },
    {
      icon: VideoIcon,
      text: "Video viewing information (completion, attention points)"
    },
    ...(projectData.quickRating?.enabled ? [{
      icon: Star,
      text: "Your rating and immediate feedback"
    }] : []),
    ...(projectData.survey?.questions?.length ? [{
      icon: ClipboardList,
      text: "Your responses to the survey questions"
    }] : [])
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Consent Form
        </CardTitle>
        <CardDescription>
          Please review and accept before participating
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Collection Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              What we collect
            </h3>
            <div className="grid gap-3 pl-7">
              {dataCollectionPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <point.icon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {point.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Data Usage Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lock className="h-5 w-5" />
              How we use your data
            </h3>
            <div className="space-y-3 pl-7">
              <p className="text-sm text-muted-foreground">
                • Your responses help improve future content and user experience
              </p>
              <p className="text-sm text-muted-foreground">
                • All data is collected anonymously and stored securely
              </p>
              <p className="text-sm text-muted-foreground">
                • We do not share your individual responses with third parties
              </p>
              <p className="text-sm text-muted-foreground">
                • No video or images are recorded or stored
              </p>
            </div>
          </div>

          <Separator />

          {/* Your Rights Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              Your rights
            </h3>
            <div className="space-y-3 pl-7">
              <p className="text-sm text-muted-foreground">
                • Participation is entirely voluntary
              </p>
              <p className="text-sm text-muted-foreground">
                • You can stop the review at any time
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Camera Access Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Access
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Required for attention tracking during video playback
              </p>
            </div>
            <Switch
              checked={cameraEnabled}
              onCheckedChange={handleCameraToggle}
            />
          </div>
          
          {cameraError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <WebcamFeed 
              onStreamReady={handleStreamReady} 
              enabled={cameraEnabled}
            />
          </div>

          <div className="text-sm text-muted-foreground pl-7">
            <ul className="space-y-2">
              <li>• Your camera will be used to track attention during video playback</li>
              <li>• No video is recorded or stored</li>
              <li>• The video will pause if you look away or switch tabs</li>
            </ul>
          </div>
        </div>

        <Separator />

        {/* Consent Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="consent">I agree to participate</Label>
            <p className="text-sm text-muted-foreground">
              You must agree and allow camera access to continue
            </p>
          </div>
          <Switch
            id="consent"
            checked={consent}
            onCheckedChange={setConsent}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleContinue}
            disabled={!consent}
            className="w-full sm:w-auto bg-[#011BA1] hover:bg-[#00008B]"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};