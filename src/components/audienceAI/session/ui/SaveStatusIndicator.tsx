// src/components/audienceAI/session/ui/SaveStatusIndicator.tsx
import React from 'react';
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { SavingStatus } from '../core/SessionUtils';

interface SaveStatusIndicatorProps {
  savingStatus: SavingStatus;
  lastSavedTimestamp: number | null;
  isVisible: boolean;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  savingStatus,
  lastSavedTimestamp,
  isVisible
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Alert className="bg-white border shadow-md w-auto max-w-md">
        <div className="flex items-center gap-2">
          {savingStatus === 'saving' && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          {savingStatus === 'success' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {savingStatus === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {savingStatus === 'idle' && (
            <Info className="h-4 w-4 text-blue-500" />
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Recording Session
            </span>
            <Badge variant="outline" className="text-xs bg-primary/10">
              Auto-saving
            </Badge>
          </div>
        </div>
        
        {lastSavedTimestamp && (
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Last saved: {new Date(lastSavedTimestamp).toLocaleTimeString()}
          </p>
        )}
        
        {savingStatus === 'error' && (
          <p className="text-xs text-red-600 mt-1 ml-6">
            Error saving data. Retrying...
          </p>
        )}
      </Alert>
    </div>
  );
};

export default SaveStatusIndicator;