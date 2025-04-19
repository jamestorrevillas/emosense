// src/pages/audienceAI/AudienceAIPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/lib/hooks/useToast";
import { useTrackingTime } from '@/lib/hooks/useTrackingTime';
import { Info } from 'lucide-react';
import type { AudienceSession } from '@/types/audienceAI';
import { TrackedFace, TrackerRefHandle } from '@/components/audienceAI/trackers/MultiPersonFaceTracker';
import { AudienceEmotionData } from '@/components/audienceAI/trackers/MultiPersonEmotionTracker';
import { AudienceResponseCard } from '@/components/audienceAI/liveAnalysis/AudienceResponseCard';
import { CameraSetupCard } from '@/components/audienceAI/liveAnalysis/CameraSetupCard';
import { PresenterViewCard } from '@/components/audienceAI/liveAnalysis/PresenterViewCard';
import SessionManager from '@/components/audienceAI/session/SessionManager';
import SessionHistoryList from '@/components/audienceAI/history/SessionHistoryList';

// Helper function to clean camera names
const cleanCameraName = (label: string): string => {
  // Remove anything in parentheses and trim
  return label.replace(/\s*\([^)]*\)/g, '').trim();
};

export function AudienceAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('live');
  const [pastSessions, setPastSessions] = useState<AudienceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [faceModelLoaded, setFaceModelLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [trackerResetKey, setTrackerResetKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [audienceEmotionData, setAudienceEmotionData] = useState<AudienceEmotionData | null>(null);
  const [emotionModelsLoaded, setEmotionModelsLoaded] = useState<{face: boolean, emotion: boolean}>({
    face: false,
    emotion: false
  });
  
  // Added state for tab content visibility
  const [liveContentVisible, setLiveContentVisible] = useState(true);
  const [historyContentVisible, setHistoryContentVisible] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previousDevicesRef = useRef<MediaDeviceInfo[]>([]);
  const trackerRef = useRef<TrackerRefHandle>(null);
  const cameraTimeoutRef = useRef<number | null>(null);
  const initializeOnceRef = useRef(false); 
  const isRefreshingDevicesRef = useRef(false);
  const updateDevicesListRef = useRef<(() => Promise<void>) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Time tracking
  const { 
    elapsedTime, 
    elapsedMs,
    startTimer, 
    stopTimer
  } = useTrackingTime();

  // Custom tab change handler to manage visibility without unmounting
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update visibility flags instead of relying on unmounting
    setLiveContentVisible(value === 'live');
    setHistoryContentVisible(value === 'history');
    
    // If switching back to live tab, ensure camera is working properly
    if (value === 'live' && cameraEnabled && (!stream || !stream.active)) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        resetCamera();
      }, 100);
    }
    
    // Load history data when switching to history tab
    if (value === 'history' && user) {
      loadPastSessions();
    }
  };
  
  // Load past sessions function
  const loadPastSessions = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSessions(true);
      const sessionsRef = collection(db, "audienceSessions");
      const sessionsQuery = query(
        sessionsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AudienceSession[];
      
      setPastSessions(sessions);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };
  
  // Reset camera helper function with better transition control
  const resetCamera = useCallback(() => {
    console.log('[resetCamera] Resetting camera...');
    
    // Clear any existing timeouts
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }
    
    // Set transitional state
    setIsTransitioning(true);
    setFaceCount(0);
    
    // Ensure stream is stopped and detached from video
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Reset the tracker by updating the key
    setTrackerResetKey(prevKey => prevKey + 1);
    
    // Wait before attempting to start the new camera
    cameraTimeoutRef.current = setTimeout(() => {
      // Ensure we're fully transitioned before updating
      if (trackerRef.current) {
        trackerRef.current.resetTracking();
      }
      
      // This will trigger the useEffect that manages the camera to start a new stream
      // with the currently selected device
      setCameraEnabled(false);
      
      // Allow a moment before re-enabling 
      cameraTimeoutRef.current = setTimeout(() => {
        setCameraEnabled(true);
        
        // Wait for camera to fully initialize before ending transition
        cameraTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 500); // Longer delay to ensure camera is fully ready
      }, 200);
    }, 300);
  }, [stream]);
  
  // Define updateDevicesList WITHOUT isRefreshingDevices in the dependency array
  // to avoid potential loops, and use a ref to check the current state instead
  const updateDevicesList = useCallback(async () => {
    // Use ref to check current state to avoid dependency loops
    if (isRefreshingDevicesRef.current) {
      console.log('[updateDevicesList] Already refreshing, skipping');
      return;
    }
    
    try {
      console.log('[updateDevicesList] Refreshing video devices');
      setIsRefreshingDevices(true);
      isRefreshingDevicesRef.current = true;
      
      // Get devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      
      console.log('[updateDevicesList] Current video devices:', videoInputs);
      
      // Check for device changes
      const previousDevicesJSON = JSON.stringify(previousDevicesRef.current.map(d => d.deviceId));
      const currentDevicesJSON = JSON.stringify(videoInputs.map(d => d.deviceId));
      
      if (previousDevicesJSON !== currentDevicesJSON) {
        console.log('[updateDevicesList] Device list changed, updating');
        
        // Check for new cameras
        const previousDeviceIds = new Set(previousDevicesRef.current.map(d => d.deviceId));
        const newDevices = videoInputs.filter(device => !previousDeviceIds.has(device.deviceId));
        
        // Show toast notifications for new cameras
        newDevices.forEach(device => {
          if (device.label) {
            const cleanName = cleanCameraName(device.label);
            toast({
              title: "New Camera Detected",
              description: `"${cleanName}" is now available`,
              variant: "info",
              duration: 5000,
            });
          }
        });
        
        // Store current list for future comparison
        previousDevicesRef.current = videoInputs;
        
        // Update state with new devices
        setVideoDevices(videoInputs);
        
        // Check if our currently selected device is still available
        const currentDeviceStillAvailable = videoInputs.some(device => device.deviceId === selectedDeviceId);
        
        // Select the first device if needed
        if (videoInputs.length > 0 && (!selectedDeviceId || !currentDeviceStillAvailable)) {
          console.log('[updateDevicesList] Selected device no longer available, switching to:', videoInputs[0].deviceId);
          
          // If camera is enabled and the device changed, we need to reset
          if (cameraEnabled && !currentDeviceStillAvailable) {
            // First update the selected device ID
            setSelectedDeviceId(videoInputs[0].deviceId);
            // Then reset the camera
            resetCamera();
          } else {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        }
        
        // If no devices are available but we were previously enabled, disable the camera
        if (videoInputs.length === 0 && cameraEnabled) {
          console.log('[updateDevicesList] No devices available, disabling camera');
          setCameraEnabled(false);
          setCameraError("No camera devices found. Please connect a camera and try again.");
        }
      } else {
        console.log('[updateDevicesList] No change in device list, skipping update');
      }
    } catch (err) {
      console.error('[updateDevicesList] Error refreshing devices:', err);
    } finally {
      setIsRefreshingDevices(false);
      isRefreshingDevicesRef.current = false;
    }
  }, [cameraEnabled, selectedDeviceId, resetCamera, toast]);
  
  // Keep isRefreshingDevicesRef in sync with state
  useEffect(() => {
    isRefreshingDevicesRef.current = isRefreshingDevices;
  }, [isRefreshingDevices]);

  // Keep updateDevicesList in sync with the latest callback
  useEffect(() => {
    updateDevicesListRef.current = updateDevicesList;
  }, [updateDevicesList]);
  
  // One-time initial device enumeration - empty dependency array with ref check
  // to guarantee it only runs once regardless of dependency changes
  useEffect(() => {
    // Only run once at component mount
    if (initializeOnceRef.current) return;
    initializeOnceRef.current = true;
    
    console.log('[Initial Setup] Starting initial camera setup');
    
    const initializeDevices = async () => {
      if (isRefreshingDevicesRef.current) return;
      
      try {
        setIsRefreshingDevices(true);
        isRefreshingDevicesRef.current = true;
        console.log('[Initial Setup] Enumerating video devices');
        
        // Get devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        let videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        // If we don't have labels, we need to request permission first
        if (videoInputs.length > 0 && !videoInputs[0].label) {
          try {
            console.log('[Initial Setup] Requesting camera permission to get device labels');
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());
            
            // Re-enumerate now that we have permission to see labels
            const devicesAfterPermission = await navigator.mediaDevices.enumerateDevices();
            videoInputs = devicesAfterPermission.filter(device => device.kind === 'videoinput');
          } catch {
            console.log('[Initial Setup] User denied camera permission or no camera available');
          }
        }
        
        console.log('[Initial Setup] Available video devices:', videoInputs);
        
        // Store current list
        previousDevicesRef.current = videoInputs;
        
        // Update state with new devices
        setVideoDevices(videoInputs);
        
        // Select the first device if available
        if (videoInputs.length > 0) {
          console.log('[Initial Setup] Setting initial device:', videoInputs[0].deviceId);
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
        
        // Setup device change listener with a closure that uses the ref
        const handleDeviceChange = () => {
          console.log('[Device Change] Media devices changed');
          // Use the ref to always get the latest version of the function
          updateDevicesListRef.current?.();
        };
        
        // Listen for device connection/disconnection events
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        
        // Return cleanup
        return () => {
          console.log('[Cleanup] Removing device change listener');
          navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
          if (cameraTimeoutRef.current) {
            clearTimeout(cameraTimeoutRef.current);
          }
        };
      } catch (err) {
        console.error('[Initial Setup] Error enumerating video devices:', err);
      } finally {
        setIsRefreshingDevices(false);
        isRefreshingDevicesRef.current = false;
      }
    };
    
    initializeDevices();
  }, []);

  // Keep streamRef in sync with the stream state
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);
  
  // Direct camera management
  useEffect(() => {
    let isMounted = true;
    
    // Start camera
    const startCamera = async () => {
      if (!cameraEnabled) return;
      
      console.log('[startCamera] Starting camera with device ID:', selectedDeviceId);
      
      // If we already have a stream, stop it first - use ref for current value
      if (streamRef.current) {
        console.log('[startCamera] Stopping existing stream');
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        if (isMounted) {
          setStream(null);
        }
      }
      
      if (isMounted) {
        setCameraLoading(true);
        setCameraError(null);
      }
      
      try {
        const constraints = {
          video: selectedDeviceId 
            ? { 
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 640 },
                height: { ideal: 480 }
              } 
            : { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }
        };
        
        console.log('[startCamera] Getting user media with constraints:', constraints);
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
          console.log("[startCamera] Component unmounted during camera init, cleaning up");
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log(`[startCamera] Camera initialized with ${mediaStream.getTracks().length} tracks`);
        
        // Attach to video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        setStream(mediaStream);
      } catch (err) {
        console.error("[startCamera] Camera initialization error:", err);
        if (isMounted) {
          setCameraError("Could not access camera. Please check permissions and try again.");
          setCameraEnabled(false);
        }
      } finally {
        if (isMounted) {
          setCameraLoading(false);
        }
      }
    };
    
    // Stop camera - use ref for current value
    const stopCamera = () => {
      if (streamRef.current) {
        console.log("[stopCamera] Stopping camera tracks");
        streamRef.current.getTracks().forEach(track => {
          console.log(`[stopCamera] Stopping track: ${track.kind} ${track.id}`);
          track.stop();
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        if (isMounted) {
          setStream(null);
          setFaceCount(0);
        }
      }
    };
    
    if (cameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup when the component is fully unmounted (not just tab switching)
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [cameraEnabled, selectedDeviceId]);
  
  // Handle faces detected with transitional state check - memoized to prevent rerenders
  const handleFacesDetected = useCallback((_faces: TrackedFace[], count: number) => {
    if (!isTransitioning) {
      setFaceCount(count);
    }
  }, [isTransitioning]);
  
  // Handle camera toggle with improved transitions
  const handleCameraToggle = (enabled: boolean) => {
    console.log(`[handleCameraToggle] Camera toggle requested: ${enabled}`);
    
    if (!enabled && isTracking) {
      handleStopTracking();
    }
    
    if (enabled && videoDevices.length === 0) {
      // If enabling camera but no devices available, refresh the list first
      updateDevicesList().then(() => {
        if (videoDevices.length > 0) {
          setCameraEnabled(true);
        } else {
          setCameraError("No camera devices found. Please connect a camera and try again.");
        }
      });
    } else {
      if (enabled) {
        // Reset face count when enabling camera
        setFaceCount(0);
      }
      setCameraEnabled(enabled);
    }
  };
  
  // Handle device selection with improved reset
  const handleDeviceChange = (deviceId: string) => {
    if (deviceId === selectedDeviceId) return;
    
    console.log(`[handleDeviceChange] Switching camera to device: ${deviceId}`);
    setSelectedDeviceId(deviceId);
    
    if (cameraEnabled) {
      // Use improved reset function instead of simple toggle
      resetCamera();
    }
  };
  
  // Handle face model loaded
  const handleFaceModelLoaded = (loaded: boolean) => {
    setFaceModelLoaded(loaded);
    if (!loaded) {
      setCameraError("Failed to load face detection models. Please refresh and try again.");
    }
  };
  
  // Handle start tracking
  const handleStartTracking = () => {
    if (!stream || !stream.active) {
      setCameraError('Camera stream not available. Please ensure camera is enabled.');
      return;
    }
    
    startTimer();
    setIsTracking(true);
  };
  
  // Handle stop tracking
  const handleStopTracking = () => {
    setIsTracking(false);
    stopTimer();
  };
  
  const handleSessionSaved = () => {
    // Refresh sessions list if on history tab
    if (activeTab === 'history') {
      loadPastSessions();
    }
  };

  const handleEmotionsDetected = (data: AudienceEmotionData) => {
    setAudienceEmotionData(data);
  };
  
  const handleModelsLoaded = (loaded: {face?: boolean, emotion?: boolean}) => {
    console.log('Models loaded status update:', loaded);
    setEmotionModelsLoaded(prevState => ({
      face: loaded.face !== undefined ? loaded.face : prevState.face,
      emotion: loaded.emotion !== undefined ? loaded.emotion : prevState.emotion
    }));
  };
  
  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">AudienceAI</h1>
        <p className="text-slate-600">
          Real-time audience feedback for advanced presentation analytics
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="live" className="flex items-center gap-2">
            Live Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            Session History
          </TabsTrigger>
        </TabsList>
        
        {/* Live Analysis Tab - Now using visibility instead of unmounting */}
        <div className={`${liveContentVisible ? 'block' : 'hidden'} space-y-6`}>
          {/* Info alert */}
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              Track and analyze audience reactions in real-time. AudienceAI provides detailed insights 
              into viewer engagement, attention levels, and emotional responses during your live presentations.
            </AlertDescription>
          </Alert>
          
          {/* Camera Setup Card */}
          <CameraSetupCard
            cameraEnabled={cameraEnabled}
            onCameraToggle={handleCameraToggle}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={handleDeviceChange}
            videoDevices={videoDevices}
            isRefreshingDevices={isRefreshingDevices}
            isTransitioning={isTransitioning}
            cameraError={cameraError}
          />
          
          {/* Main content grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Presenter View Card */}
            <PresenterViewCard
              cameraEnabled={cameraEnabled}
              stream={stream}
              isTracking={isTracking}
              isTransitioning={isTransitioning}
              cameraLoading={cameraLoading}
              faceCount={faceCount}
              elapsedTime={elapsedTime}
              faceModelLoaded={faceModelLoaded}
              onStartTracking={handleStartTracking}
              onStopTracking={handleStopTracking}
              onFacesDetected={handleFacesDetected}
              onFaceModelLoaded={handleFaceModelLoaded}
              onEmotionsDetected={handleEmotionsDetected}
              onModelsLoaded={handleModelsLoaded}
              trackerRef={trackerRef}
              resetKey={trackerResetKey}
            />
            
            {/* Audience Response Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Audience Response</CardTitle>
                <CardDescription>
                  Real-time analysis of audience emotions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faceCount > 0 || isTracking ? (
                  <AudienceResponseCard
                    emotionData={audienceEmotionData}
                    isTracking={isTracking}
                    elapsedTime={elapsedTime}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground">
                    {!cameraEnabled ? (
                      "Enable camera to start audience analysis"
                    ) : (cameraLoading || isTransitioning) ? (
                      "Initializing camera..."
                    ) : !stream || !stream.active ? (
                      "Waiting for camera stream..."
                    ) : !emotionModelsLoaded.face || !emotionModelsLoaded.emotion ? (
                      "Initializing emotion detection models..."
                    ) : (
                      "No audience members detected. Position camera to capture faces."
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Session Manager handles saving */}
          <SessionManager
            userId={user?.uid}
            isTracking={isTracking}
            elapsedMs={elapsedMs}
            audienceEmotionData={audienceEmotionData}
            faceCount={faceCount}
            onSessionSaved={handleSessionSaved}
          />
        </div>
        
        {/* History Tab */}
        <div className={`${historyContentVisible ? 'block' : 'hidden'} space-y-6`}>
          <SessionHistoryList
            isLoadingSessions={isLoadingSessions}
            pastSessions={pastSessions}
            onCreateNewSession={() => handleTabChange('live')}
          />
        </div>
      </Tabs>
    </div>
  );
}