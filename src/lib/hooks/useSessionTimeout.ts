// src/lib/hooks/useSessionTimeout.ts
import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

// Session timeout duration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Warning before timeout (5 minutes before)
const WARNING_TIMEOUT = 5 * 60 * 1000;

interface SessionTimeoutReturn {
  showWarning: boolean;
  timeLeft: number;
  handleLogout: () => Promise<void>;
  resetSession: () => void;
}

export function useSessionTimeout(): SessionTimeoutReturn {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_TIMEOUT);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetSession = useCallback(() => {
    window.localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
    setIsDialogOpen(false);
  }, []);

  const handleUserActivity = useCallback(() => {
    if (!isDialogOpen) {
      const lastActivity = parseInt(window.localStorage.getItem('lastActivity') || '0');
      const timeSinceActivity = Date.now() - lastActivity;

      if (timeSinceActivity < SESSION_TIMEOUT - WARNING_TIMEOUT) {
        window.localStorage.setItem('lastActivity', Date.now().toString());
      }
    }
  }, [isDialogOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.localStorage.removeItem('lastActivity');
      navigate('/auth/signin', { 
        state: { manualLogout: true } 
      });
      toast({
        title: "Success",
        description: "You have signed out successfully.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [logout, navigate, toast]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [handleUserActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      const lastActivity = parseInt(window.localStorage.getItem('lastActivity') || '0');
      const timeSinceActivity = Date.now() - lastActivity;

      if (timeSinceActivity >= SESSION_TIMEOUT) {
        handleLogout();
      } else if (timeSinceActivity >= SESSION_TIMEOUT - WARNING_TIMEOUT) {
        setShowWarning(true);
        setIsDialogOpen(true);
        setTimeLeft(SESSION_TIMEOUT - timeSinceActivity);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handleLogout]);

  return {
    showWarning,
    timeLeft,
    handleLogout,
    resetSession
  };
}