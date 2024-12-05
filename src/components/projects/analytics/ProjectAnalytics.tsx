// src/components/projects/analytics/ProjectAnalytics.tsx
import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Project } from "@/types/project";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Star, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmotionAnalytics } from "./EmotionAnalytics";
import { SurveyAnalytics } from "./SurveyAnalytics";

interface ProjectAnalyticsProps {
  project: Project;
}

interface AnalyticsMetrics {
  totalResponses: number;
  avgRating: number;
  lastResponseAt: string | null;
}

export function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalResponses: 0,
    avgRating: 0,
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
            avgRating: 0,
            lastResponseAt: null
          });
          setLoading(false);
          return;
        }

        // Calculate total responses
        const totalResponses = responses.length;

        // Calculate average rating
        const ratingsSum = responses.reduce((sum, doc) => {
          const rating = doc.data().data?.quickRating;
          return rating ? sum + rating : sum;
        }, 0);
        const avgRating = ratingsSum / totalResponses;

        // Get last response timestamp
        const timestamps = responses
          .map(doc => new Date(doc.data().completedAt).getTime());
        const lastResponseAt = new Date(Math.max(...timestamps)).toISOString();

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
  }, [project.id]);

  const getThumbsPercentage = (rating: number) => Math.round(rating * 100);

  const renderRating = (avgRating: number) => {
    switch (project.quickRating.type) {
      case 'stars':
        return (
          <div className="text-center space-y-2">
            <Star className="h-6 w-6 mx-auto text-yellow-500 fill-yellow-500" />
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Average Stars</p>
          </div>
        );

      case 'numeric':
        return (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}/10</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        );

      case 'thumbs':
        return (
          <div className="text-center space-y-2">
            <ThumbsUp className="h-6 w-6 mx-auto text-primary fill-primary" />
            <div className="text-2xl font-bold">{getThumbsPercentage(avgRating)}%</div>
            <p className="text-sm text-muted-foreground">Thumbs Up</p>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">{metrics.totalResponses}</div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {renderRating(metrics.avgRating)}
          </CardContent>
        </Card>

        {metrics.lastResponseAt && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  {formatDistanceToNow(new Date(metrics.lastResponseAt), { addSuffix: true })}
                </div>
                <p className="text-sm text-muted-foreground">Last Response</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <EmotionAnalytics projectId={project.id} />

      <Separator />

      <SurveyAnalytics projectId={project.id} survey={project.survey} />
    </div>
  );
}