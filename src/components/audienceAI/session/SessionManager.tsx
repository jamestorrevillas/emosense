// src/components/audienceAI/session/SessionManager.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/lib/hooks/useToast";
import { AudienceEmotionData } from '@/components/audienceAI/trackers/MultiPersonEmotionTracker';
import { StoredEmotionData, SavingStatus } from './core/SessionUtils';
import { 
  createSession, 
  saveEmotionData, 
  updateSessionMetrics, 
  finalizeSession,
  checkDuplicateSessionName,
  getNextUntitledName
} from './core/SessionServices';
import SaveStatusIndicator from './ui/SaveStatusIndicator';
import SessionNameDialog from './ui/SessionNameDialog';

interface SessionManagerProps {
  userId: string | undefined;
  isTracking: boolean;
  elapsedMs: number;
  audienceEmotionData: AudienceEmotionData | null;
  faceCount: number;
  onSessionSaved?: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({
  userId,
  isTracking,
  elapsedMs,
  audienceEmotionData,
  faceCount,
  onSessionSaved
}) => {
  // Dialog state for naming session
  const [isNameSessionDialogOpen, setIsNameSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxFaceCount, setMaxFaceCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');
  
  const { toast } = useToast();
  const emotionDataRef = useRef<StoredEmotionData[]>([]);
  const lastEmotionSaveRef = useRef<number>(0);
  const dataSaveIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const dataSaveQueueRef = useRef<StoredEmotionData[]>([]);
  const isProcessingSaveQueueRef = useRef(false);
  const saveRetryTimeoutRef = useRef<number | null>(null);
  const saveErrorCountRef = useRef(0);
  const previousTrackingState = useRef(false);
  const sessionFinalizingRef = useRef(false);
  
  // Process the save queue without blocking the main thread
  const processSaveQueue = useCallback(async () => {
    if (isProcessingSaveQueueRef.current || dataSaveQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingSaveQueueRef.current = true;
    
    // Take up to 5 items from the queue
    const itemsToProcess = dataSaveQueueRef.current.splice(0, 5);
    
    if (itemsToProcess.length === 0 || !currentSessionId) {
      isProcessingSaveQueueRef.current = false;
      return;
    }
    
    try {
      setSavingStatus('saving');
      
      // Save the items to Firestore
      await saveEmotionData(currentSessionId, itemsToProcess);
      
      // After successful save, update timestamp and reset error count
      setLastSavedTimestamp(Date.now());
      setSavingStatus('success');
      saveErrorCountRef.current = 0;
      
      // Process next batch after a small delay to avoid flooding
      setTimeout(() => {
        isProcessingSaveQueueRef.current = false;
        processSaveQueue();
      }, 100);
      
    } catch (err) {
      console.error("Error saving emotion data batch:", err);
      
      // Put the items back in the queue for retry
      dataSaveQueueRef.current = [...itemsToProcess, ...dataSaveQueueRef.current];
      
      // Increment error count and increase retry delay based on failures
      saveErrorCountRef.current++;
      const retryDelay = Math.min(30000, 1000 * Math.pow(2, saveErrorCountRef.current));
      
      setSavingStatus('error');
      
      // Retry with exponential backoff
      saveRetryTimeoutRef.current = window.setTimeout(() => {
        isProcessingSaveQueueRef.current = false;
        processSaveQueue();
      }, retryDelay);
    }
  }, [currentSessionId]);
  
  // Process any pending saves before finalizing
  const processPendingSaves = useCallback(async () => {
    // If there are items in the queue, try to save them
    if (dataSaveQueueRef.current.length > 0) {
      try {
        setIsSaving(true);
        
        // Try to save any remaining items in the queue
        if (currentSessionId) {
          // Save in smaller batches to avoid timeouts
          const batches = [];
          while (dataSaveQueueRef.current.length > 0) {
            batches.push(dataSaveQueueRef.current.splice(0, 10));
          }
          
          for (const batch of batches) {
            await saveEmotionData(currentSessionId, batch);
          }
        }
        
        setIsSaving(false);
      } catch (err) {
        console.error("Error saving remaining data:", err);
        // Continue with finalization even if some data points failed to save
      }
    }
  }, [currentSessionId]);
  
  // Finalize session when tracking stops
  const finalizeSessionHandler = useCallback(async () => {
    if (!currentSessionId) {
      console.warn("Cannot finalize session: No current session ID");
      return;
    }
    
    console.log("Finalizing session:", currentSessionId);
    
    try {
      // Make sure any pending data gets saved
      await processPendingSaves();
      
      // Update the session document with final duration and metrics
      await updateSessionMetrics(currentSessionId, elapsedMs, maxFaceCount);
      
      // Show dialog to name the session
      setSessionTitle('Untitled Session'); // Reset title input
      setIsNameSessionDialogOpen(true);
      
    } catch (err) {
      console.error("Error finalizing session:", err);
      setError("Error finalizing session. Session data may be incomplete.");
      
      toast({
        title: "Session Error",
        description: "Failed to finalize session data",
        variant: "destructive"
      });
      
      // Reset finalizing flag to allow retry
      sessionFinalizingRef.current = false;
    }
  }, [currentSessionId, processPendingSaves, elapsedMs, maxFaceCount, toast]);
  
  // Handle save session name
  const handleSaveSessionName = useCallback(async () => {
    if (!currentSessionId) {
      setError("Session ID not found");
      return;
    }
    
    const titleToUse = sessionTitle.trim() || "Untitled Session";
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (!userId) {
        setError("User ID not found");
        setIsSaving(false);
        return;
      }
      
      // Check for duplicate name
      const isDuplicate = await checkDuplicateSessionName(userId, titleToUse, currentSessionId);
      
      if (isDuplicate) {
        setError("A session with this name already exists. Please choose a different name.");
        setIsSaving(false);
        return;
      }
      
      // Finalize the session with the name
      await finalizeSession(currentSessionId, titleToUse);
      
      toast({
        title: "Session Saved",
        description: "Your presentation session has been saved successfully",
        variant: "success",
        duration: 5000,
      });
      
      // Clear session in state but FIRST store in a temporary variable for the callback
      const savedSessionId = currentSessionId;
      
      // Close dialogs and reset state
      setIsNameSessionDialogOpen(false);
      
      // Reset tracking state for a new session
      sessionFinalizingRef.current = false;
      setCurrentSessionId(null);
      emotionDataRef.current = [];
      dataSaveQueueRef.current = [];
      
      // Now notify parent with the saved ID
      if (savedSessionId) {
        onSessionSaved?.();
      }
      
    } catch (err) {
      console.error("Error saving session name:", err);
      setError("Failed to save session name. Please try again.");
      // Reset finalizing flag to allow retry
      sessionFinalizingRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [currentSessionId, sessionTitle, userId, toast, onSessionSaved]);

  // Handle skip with auto-naming
  const handleSkip = useCallback(async () => {
    if (!currentSessionId) {
      setIsNameSessionDialogOpen(false);
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      if (!userId) {
        setError("User ID not found");
        setIsSaving(false);
        return;
      }
      
      const nextName = await getNextUntitledName(userId);
      
      // Finalize the session with the auto-generated name
      await finalizeSession(currentSessionId, nextName);
      
      toast({
        title: "Session Saved",
        description: `Your session has been saved as "${nextName}"`,
        variant: "success",
        duration: 5000,
      });
      
      // Clear session in state but FIRST store in a temporary variable for the callback
      const savedSessionId = currentSessionId;
      
      // Close dialogs and reset state
      setIsNameSessionDialogOpen(false);
      
      // Reset tracking state for a new session
      sessionFinalizingRef.current = false;
      setCurrentSessionId(null);
      emotionDataRef.current = [];
      dataSaveQueueRef.current = [];
      
      // Notify parent with the saved ID
      if (savedSessionId) {
        onSessionSaved?.();
      }
      
    } catch (err) {
      console.error("Error auto-naming session:", err);
      setError("Failed to auto-name session. Please try again.");
      // Reset finalizing flag to allow retry
      sessionFinalizingRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [currentSessionId, userId, toast, onSessionSaved]);
  
  // Clean up on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (dataSaveIntervalRef.current) {
        window.clearInterval(dataSaveIntervalRef.current);
        dataSaveIntervalRef.current = null;
      }
      if (saveRetryTimeoutRef.current) {
        window.clearTimeout(saveRetryTimeoutRef.current);
        saveRetryTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Update max face count
  useEffect(() => {
    if (faceCount > maxFaceCount) {
      setMaxFaceCount(faceCount);
    }
  }, [faceCount, maxFaceCount]);
  
  // Initialize session when tracking starts
  useEffect(() => {
    // Detect tracking start
    const trackingStarted = isTracking && !previousTrackingState.current;
    // Detect tracking stop
    const trackingStopped = !isTracking && previousTrackingState.current;
    
    // Update previous tracking state for next render
    previousTrackingState.current = isTracking;
    
    const initializeSession = async () => {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save session data",
          variant: "destructive"
        });
        return;
      }
      
      try {
        setIsSaving(true);
        setError(null);
        
        console.log("Creating new session in Firestore");
        
        // Create a new session
        const sessionId = await createSession(userId);
        
        console.log("Session created with ID:", sessionId);
        
        // Store the session ID
        setCurrentSessionId(sessionId);
        
        // Reset state for new session
        setMaxFaceCount(0);
        setSavingStatus('idle');
        setLastSavedTimestamp(null);
        saveErrorCountRef.current = 0;
        
        // Set up data save interval (every 5 seconds)
        if (dataSaveIntervalRef.current) {
          window.clearInterval(dataSaveIntervalRef.current);
        }
        
        dataSaveIntervalRef.current = window.setInterval(() => {
          processSaveQueue();
        }, 5000);
        
        // Clear any existing data
        emotionDataRef.current = [];
        dataSaveQueueRef.current = [];
        
        toast({
          title: "Recording Started",
          description: "Auto-saving session data",
          variant: "success",
        });
        
      } catch (err) {
        console.error("Error creating session:", err);
        setError("Failed to initialize session. Some data may not be saved.");
        
        toast({
          title: "Session Error",
          description: "Failed to initialize session recording",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    // When tracking starts, initialize the session
    if (trackingStarted) {
      // Reset the finalizing flag
      sessionFinalizingRef.current = false;
      
      // Only initialize if we don't already have a session ID
      if (!currentSessionId) {
        console.log("Tracking started, initializing new session");
        initializeSession();
      } else {
        console.log("Tracking started but session already exists:", currentSessionId);
      }
    }
    
    // When tracking stops, finalize the session
    if (trackingStopped && currentSessionId && elapsedMs > 0 && !sessionFinalizingRef.current) {
      console.log("Tracking stopped, finalizing session:", currentSessionId);
      sessionFinalizingRef.current = true;
      finalizeSessionHandler();
    }
    
    // Clean up when tracking stops
    if (!isTracking && dataSaveIntervalRef.current) {
      console.log("Clearing data save interval");
      window.clearInterval(dataSaveIntervalRef.current);
      dataSaveIntervalRef.current = null;
    }
    
  }, [isTracking, userId, elapsedMs, currentSessionId, processSaveQueue, toast, finalizeSessionHandler]);
  
  // Store emotion data while tracking and add to save queue
  useEffect(() => {
    if (isTracking && audienceEmotionData && currentSessionId) {
      // Limit save frequency to avoid excessive database operations
      const now = Date.now();
      if (now - lastEmotionSaveRef.current < 500) { // Save at most every 500ms
        return;
      }
      
      lastEmotionSaveRef.current = now;
      
      // Convert the complex AudienceEmotionData to a simpler serializable format
      const simplifiedFaces = audienceEmotionData.faces.map(face => ({
        id: face.id,
        box: {
          x: face.box.x,
          y: face.box.y,
          width: face.box.width,
          height: face.box.height
        },
        lastSeen: face.lastSeen,
        emotions: face.emotions ? {
          scores: face.emotions.scores as Record<string, number>,
          dominantEmotion: face.emotions.dominantEmotion || null, // Ensure null instead of undefined
          lastProcessed: face.emotions.lastProcessed
        } : undefined
      }));
      
      const storedData: StoredEmotionData = {
        timestamp: now,
        faceCount: audienceEmotionData.faceCount,
        averageEmotions: audienceEmotionData.averageEmotions as Record<string, number>,
        dominantEmotion: audienceEmotionData.dominantEmotion || null, // Ensure null instead of undefined
        faces: simplifiedFaces
      };
      
      // Add to in-memory array for reference
      emotionDataRef.current.push(storedData);
      
      // Add to save queue
      dataSaveQueueRef.current.push(storedData);
      
      // Trigger queue processing if not already in progress
      if (!isProcessingSaveQueueRef.current) {
        processSaveQueue();
      }
    }
  }, [isTracking, audienceEmotionData, currentSessionId, processSaveQueue]);
  
  // Handle dialog close
  const handleDialogClose = () => {
    // Reset finalizing state to allow creating a new session
    sessionFinalizingRef.current = false;
    
    // If we're closing without saving, reset the current session
    setCurrentSessionId(null);
    emotionDataRef.current = [];
    dataSaveQueueRef.current = [];
  };
  
  return (
    <>
      {/* Auto-save status indicator - only shown during tracking */}
      <SaveStatusIndicator
        savingStatus={savingStatus}
        lastSavedTimestamp={lastSavedTimestamp}
        isVisible={isTracking && !!currentSessionId}
      />
      
      {/* Name Session Dialog - shown when tracking ends */}
      <SessionNameDialog
        isOpen={isNameSessionDialogOpen}
        sessionTitle={sessionTitle}
        error={error}
        isSaving={isSaving}
        maxFaceCount={maxFaceCount}
        onClose={handleDialogClose}
        onSave={handleSaveSessionName}
        onSkip={handleSkip}
        onTitleChange={setSessionTitle}
      />
    </>
  );
};

export default SessionManager;