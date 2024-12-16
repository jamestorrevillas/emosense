// src/components/projects/analytics/ProjectAnalytics.tsx
import { useState, useEffect } from "react";
import { collection, doc, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Project } from "@/types/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Star, ThumbsUp, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmotionAnalytics } from "./EmotionAnalytics";
import { SurveyAnalytics } from "./SurveyAnalytics";

interface ProjectAnalyticsProps {
  project: Project;
}

interface AnalyticsMetrics {
  totalResponses: number;
  avgRating: number | null;
  lastResponseAt: string | null;
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalResponses: 0,
    avgRating: null,
    lastResponseAt: null,
  });

  useEffect(() => {
    // Fetch overview metrics from responses collection
    const responsesRef = collection(doc(db, "projects", project.id), "responses");
    const responsesQuery = query(responsesRef);
    
    const unsubscribe = onSnapshot(responsesQuery, (snapshot) => {
      try {
        // Get all completed responses
        const responses = snapshot.docs
          .filter(doc => doc.data().status === 'completed');
        
        if (responses.length === 0) {
          setMetrics({
            totalResponses: 0,
            avgRating: null,
            lastResponseAt: null
          });
          setLoading(false);
          return;
        }
  
        // Calculate total responses
        const totalResponses = responses.length;
  
        // Calculate average rating if applicable
        let avgRating = null;
        if (project.quickRating?.enabled) {
          // Only include responses that have valid quick ratings (not null, undefined, or 0)
          const ratings = responses
            .filter(doc => {
              const quickRating = doc.data().data?.quickRating;
              return quickRating !== undefined && 
                     quickRating !== null && 
                     quickRating !== 0;
            })
            .map(doc => doc.data().data.quickRating as number);
          
          if (ratings.length > 0) {
            avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          }
        }
  
        // Get last response timestamp
        const lastResponse = responses
          .map(doc => new Date(doc.data().completedAt || doc.data().startedAt))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        const lastResponseAt = lastResponse ? lastResponse.toISOString() : null;
  
        setMetrics({
          totalResponses,
          avgRating,
          lastResponseAt
        });
        setLoading(false);
      } catch (err) {
        console.error("Error processing responses:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    });
  
    return () => unsubscribe();
  }, [project.id, project.quickRating?.enabled]);

  const getThumbsPercentage = (rating: number) => Math.round(rating * 100);

  const renderRating = () => {
    if (!project.quickRating?.enabled) {
      return (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Quick rating not configured
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure quick rating in project settings to collect ratings
          </p>
        </div>
      );
    }

    if (metrics.avgRating === null) {
      return (
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            No ratings collected yet
          </div>
          <p className="text-xs text-muted-foreground">
            Waiting for viewer responses
          </p>
        </div>
      );
    }

    switch (project.quickRating.type) {
      case 'stars':
        return (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl font-bold">
                {metrics.avgRating.toFixed(1)}
              </div>
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">Average Stars</p>
          </div>
        );

      case 'numeric':
        return (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}/10</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        );

      case 'thumbs':
        return (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl font-bold">
                {getThumbsPercentage(metrics.avgRating)}%
              </div>
              <ThumbsUp className="h-6 w-6 text-primary fill-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Thumbs Up</p>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Responses */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">{metrics.totalResponses}</div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Rating */}
        <Card>
          <CardContent className="pt-6">
            {renderRating()}
          </CardContent>
        </Card>

        {/* Last Response */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              {metrics.lastResponseAt ? (
                <>
                  <div className="text-2xl font-bold">
                    {formatDistanceToNow(new Date(metrics.lastResponseAt), { addSuffix: true })}
                  </div>
                  <p className="text-sm text-muted-foreground">Last Response</p>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    No responses yet
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share your project to start collecting responses
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EmotionAnalytics projectId={project.id} />

      <Separator />

      {/* Survey Results */}
      {project.survey?.questions?.length ? (
        <SurveyAnalytics projectId={project.id} survey={project.survey} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Survey Results</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Analysis of survey responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground space-y-2">
              <p>No survey questions configured</p>
              <p className="text-sm">
                Add survey questions in project settings to collect detailed feedback
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}