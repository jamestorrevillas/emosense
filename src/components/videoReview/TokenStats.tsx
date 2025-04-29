// src/components/videoReview/TokenStats.tsx
import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ResponseStats, TokenResponse } from "@/types/response";
import { ReviewToken } from "@/types/token";
import { Star, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Project, QuickRatingType } from "@/types/videoReview";

interface TokenStatsProps {
  token: ReviewToken;
}

export function TokenStats({ token }: TokenStatsProps) {
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingType, setRatingType] = useState<QuickRatingType>('stars');

  useEffect(() => {
    fetchStats();
    fetchProjectDetails();
  }, [token.id]);

  const fetchProjectDetails = async () => {
    try {
      const projectRef = doc(db, "projects", token.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data() as Project;
        setRatingType(projectData.quickRating?.type || 'stars');
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      const responsesRef = collection(
        doc(db, "projects", token.projectId), 
        "responses"
      );
      const q = query(
        responsesRef,
        where("tokenId", "==", token.id)
      );

      const snapshot = await getDocs(q);
      const responses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TokenResponse[];

      const stats: ResponseStats = {
        linkId: token.id,
        totalResponses: responses.length,
        completed: responses.filter(r => r.status === 'completed').length,
        abandoned: responses.filter(r => r.status === 'abandoned').length,
      };

      const ratings = responses
        .filter(r => r.quickRating !== undefined)
        .map(r => r.quickRating as number);
      
      if (ratings.length > 0) {
        stats.quickRatingAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }

      const lastResponse = responses
        .map(r => new Date(r.startedAt))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      
      if (lastResponse) {
        stats.lastResponse = lastResponse.toISOString();
      }

      setStats(stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = () => {
    if (!stats?.quickRatingAvg) return null;

    const getThumbsUpPercentage = (rating: number) => {
      return Math.round(rating * 100).toString();
    };

    switch (ratingType) {
      case 'stars':
        return (
          <div className="text-xl font-bold flex items-center gap-1">
            {stats.quickRatingAvg.toFixed(1)}
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
        );

      case 'numeric':
        return (
          <div className="text-xl font-bold">
            {stats.quickRatingAvg.toFixed(1)}/10
          </div>
        );

      case 'thumbs':
        return (
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold">
              {getThumbsUpPercentage(stats.quickRatingAvg)}%
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4 text-primary fill-primary" />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-xl font-bold">
            {stats.quickRatingAvg.toFixed(1)}
          </div>
        );
    }
  };

  if (loading || !stats) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {stats.quickRatingAvg !== undefined && (
        <div className="bg-muted rounded-lg p-3 flex-1">
          <div className="text-sm font-medium">Avg. Rating</div>
          {renderRating()}
        </div>
      )}

      {stats.lastResponse && (
        <div className="bg-muted rounded-lg p-3 flex-1">
          <div className="text-sm font-medium">Last Response</div>
          <div className="text-sm font-medium mt-1">
            {formatDistanceToNow(new Date(stats.lastResponse))} ago
          </div>
        </div>
      )}
    </div>
  );
}