// src/components/audienceAI/liveAnalysis/CameraSetupCard.tsx
// No imports needed for React hooks
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Camera } from "lucide-react";

// Helper function to clean camera names
const cleanCameraName = (label: string): string => {
  // Remove anything in parentheses and trim
  return label.replace(/\s*\([^)]*\)/g, '').trim();
};

interface CameraSetupCardProps {
  cameraEnabled: boolean;
  onCameraToggle: (enabled: boolean) => void;
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  videoDevices: MediaDeviceInfo[];
  isRefreshingDevices: boolean;
  isTransitioning: boolean;
  cameraError: string | null;
}

export function CameraSetupCard({
  cameraEnabled,
  onCameraToggle,
  selectedDeviceId,
  onDeviceChange,
  videoDevices,
  isRefreshingDevices,
  isTransitioning,
  cameraError
}: CameraSetupCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <div className="space-y-1">
              <h4 className="font-medium">Camera Access</h4>
              <p className="text-sm text-slate-500">
                Enable camera to start audience analysis
              </p>
            </div>
          </div>
          <Switch
            checked={cameraEnabled}
            onCheckedChange={onCameraToggle}
          />
        </div>
        
        {/* Camera selection dropdown */}
        <div className="mt-4">
          <Label htmlFor="camera-select">Select Camera</Label>
          <Select
            value={selectedDeviceId}
            onValueChange={onDeviceChange}
            disabled={!cameraEnabled || isRefreshingDevices || isTransitioning}
          >
            <SelectTrigger id="camera-select" className="w-full rounded-xl">
              <SelectValue placeholder="Select a camera" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {videoDevices.length > 0 ? (
                videoDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label ? cleanCameraName(device.label) : `Camera ${videoDevices.findIndex(d => d.deviceId === device.deviceId) + 1}`}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-camera" disabled>
                  No cameras found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Display camera errors if any */}
        {cameraError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Camera Error</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}