// src/components/audienceAI/SessionHistoryList.tsx
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, CalendarDays, Users } from "lucide-react";
import type { AudienceSession } from '@/types/audienceAI';

interface SessionHistoryListProps {
  isLoadingSessions: boolean;
  pastSessions: AudienceSession[];
  onCreateNewSession: () => void;
  onViewSessionDetails?: (sessionId: string) => void;
}

// SessionHistoryItem component
interface SessionHistoryItemProps {
  session: AudienceSession;
  onViewDetails?: (sessionId: string) => void;
}

function SessionHistoryItem({ session, onViewDetails }: SessionHistoryItemProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format duration for display
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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
            onClick={() => onViewDetails?.(session.id)}
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
  onCreateNewSession,
  onViewSessionDetails
}: SessionHistoryListProps) {
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
                onViewDetails={onViewSessionDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}