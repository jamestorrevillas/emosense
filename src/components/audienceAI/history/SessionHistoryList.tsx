// src/components/audienceAI/history/SessionHistoryList.tsx
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, CalendarDays, Users } from "lucide-react";
import type { AudienceSession } from '@/types/audienceAI';
import SessionDetails from "./SessionDetails";

interface SessionHistoryListProps {
  isLoadingSessions: boolean;
  pastSessions: AudienceSession[];
  onCreateNewSession: () => void;
}

// SessionHistoryItem component
interface SessionHistoryItemProps {
  session: AudienceSession;
  onViewDetails: (sessionId: string) => void;
}

function SessionHistoryItem({ session, onViewDetails }: SessionHistoryItemProps) {
  // Improved format date function to handle invalid dates
  const formatDate = (dateValue: string | Date | { toDate: () => Date } | { seconds: number; nanoseconds?: number } | number | null | undefined) => {
    try {
      // Handle different date formats from Firestore
      if (!dateValue) return "No date available";
      
      let date;
      
      // If it's a Firestore Timestamp
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        date = dateValue.toDate();
      } 
      // If it's a timestamp object with seconds and nanoseconds
      else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        date = new Date(dateValue.seconds * 1000);
      }
      // If it's a string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // If it's already a Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // If it's a number (timestamp)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Otherwise use as is
      else {
        date = new Date(String(dateValue));
      }
      
      // Check if the date is valid
      if (!date || isNaN(date.getTime())) {
        return "No date available";
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "No date available";
    }
  };
  
  // Format duration for display
  const formatDuration = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(session.id)}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{session.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {formatDate(session.createdAt)}
              </div>
              <div>Duration: {formatDuration(session.duration)}</div>
              {session.maxFaceCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {session.maxFaceCount} {session.maxFaceCount === 1 ? 'person' : 'people'}
                </div>
              )}
            </div>
          </div>
          <Button 
            size="sm"
            className="bg-[#011BA1] hover:bg-[#00008B]"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
              onViewDetails(session.id);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SessionHistoryList({
  isLoadingSessions,
  pastSessions,
  onCreateNewSession
}: SessionHistoryListProps) {
  const [selectedSession, setSelectedSession] = useState<AudienceSession | null>(null);

  const handleViewDetails = (sessionId: string) => {
    const session = pastSessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
    }
  };

  const handleBackToList = () => {
    setSelectedSession(null);
  };

  // Show session details if a session is selected
  if (selectedSession) {
    return <SessionDetails session={selectedSession} onBack={handleBackToList} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Sessions</CardTitle>
        <CardDescription>
          View and review your past audience analysis sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSessions ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pastSessions.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              No past sessions found. Create your first analysis session in the Live Analysis tab.
            </p>
            <Button 
              onClick={onCreateNewSession}
              className="bg-[#011BA1] hover:bg-[#00008B]"
            >
              <Camera className="mr-2 h-4 w-4" />
              Create New Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pastSessions.map((session) => (
              <SessionHistoryItem 
                key={session.id} 
                session={session} 
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}