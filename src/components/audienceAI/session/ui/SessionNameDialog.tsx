// src/components/audienceAI/session/ui/SessionNameDialog.tsx
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Save, Users } from 'lucide-react';

interface SessionNameDialogProps {
  isOpen: boolean;
  sessionTitle: string;
  error: string | null;
  isSaving: boolean;
  maxFaceCount: number;
  onClose: () => void;
  onSave: () => void;
  onSkip: () => void;
  onTitleChange: (title: string) => void;
}

const SessionNameDialog: React.FC<SessionNameDialogProps> = ({
  isOpen,
  sessionTitle,
  error,
  isSaving,
  maxFaceCount,
  onClose,
  onSave,
  onSkip,
  onTitleChange
}) => {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
      modal={true}
    >
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Save Your Session</DialogTitle>
          <DialogDescription>
            Your session has been recorded and saved. Give it a meaningful name for future reference.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Name</Label>
            <Input
              id="session-title"
              value={sessionTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter a name for this session"
              className="w-full"
              autoFocus
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Maximum audience size: {maxFaceCount}</span>
          </div>
          
          {/* Success message */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Your presentation data has been automatically saved and is ready to be named.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Skip"
            )}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#011BA1] hover:bg-[#00008B]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionNameDialog;