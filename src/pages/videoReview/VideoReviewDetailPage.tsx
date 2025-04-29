// src\pages\videoReview\ProjectDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/videoReview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickRating } from "@/components/videoReview/QuickRating";
import { Separator } from "@/components/ui/separator";
import { ProjectActions } from '@/components/videoReview/VideoReviewActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar,
  Loader2, 
  Edit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/videoReview/ShareDialog";
import { TokenManagement } from "@/components/videoReview/TokenManagement";
import { ProjectAnalytics } from "@/components/videoReview/analytics/VideoReviewAnalytics"

export const VideoReviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProject = async () => {
    if (!id || !user) return;

    try {
      setIsLoading(true);
      setError("");

      const projectRef = doc(db, "projects", id);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        setError("Project not found");
        return;
      }

      const projectData = projectSnap.data() as Project;

      if (projectData.userId !== user.uid) {
        setError("You don't have permission to view this project");
        return;
      }

      setProject(projectData);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#011BA1]" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-xl">
              {error || "Project not found"}
            </div>
            <Button 
              asChild
              className="bg-[#011BA1] hover:bg-[#00008B]"
            >
              <Link to="/app/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6 mt-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/app/projects')}
            className="text-slate-600 hover:text-[#011BA1]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Badge 
            variant="outline" 
            className={`text-xs ${
              project.status === "active" 
                ? "bg-green-50 text-green-600 border-green-300" 
                : "bg-slate-50 text-slate-600 border-slate-300"
            }`}
          >
            {project.status.toUpperCase()}
          </Badge>

        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-slate-600 max-w-2xl">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(project.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareDialog project={project} />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/app/projects/${project.id}/edit`)}
              className="border-[#011BA1] text-[#011BA1] hover:bg-[#011BA1] hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <ProjectActions 
              project={project} 
              onStatusChange={fetchProject} 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="share">Share Links</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Video Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
              <CardDescription>
                Preview your video and test the rating system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-3xl mx-auto">
                <div className="overflow-hidden rounded-xl border bg-muted aspect-video">
                  <video
                    src={project.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    poster={project.thumbnailUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </CardContent>
          </Card>

          {project.quickRating?.enabled && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Rating</CardTitle>
                <CardDescription>
                  Rating that appears after the video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-xl mx-auto">
                  {project.quickRating && (
                    <QuickRating settings={project.quickRating} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Survey Questions</CardTitle>
              <CardDescription>
                Questions that will be asked after the video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!project.survey?.questions || project.survey.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No survey questions added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {project.survey.questions.map((question, index) => (
                    <Card key={question.id} className="border border-muted">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Question {index + 1}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs bg-[#011BA1] text-white">
                            {question.type.replace('_', ' ')}
                          </Badge>
                          {question.required && (
                            <Badge className="text-xs text-black bg-transparent border-none">Required</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium">{question.text || "Untitled Question"}</h3>
                          </div>

                          {/* Question-specific content */}
                          {question.type === "multiple_choice" && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <div className="h-4 w-4 rounded-full border" />
                                  <span>{option}</span>
                                </div>
                              ))}
                              {question.options.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">
                                  No options added
                                </p>
                              )}
                            </div>
                          )}

                          {question.type === "rating_scale" && (
                            <div className="flex justify-between items-center p-4 bg-muted rounded-md">
                              <div className="text-sm text-muted-foreground">
                                {question.minLabel || question.minValue}
                              </div>
                              <div className="flex gap-2">
                                {Array.from(
                                  { length: (question.maxValue - question.minValue) / (question.step || 1) + 1 },
                                  (_, i) => question.minValue + i * (question.step || 1)
                                ).map((value) => (
                                  <div
                                    key={value}
                                    className="w-8 h-8 rounded-full border flex items-center justify-center text-sm"
                                  >
                                    {value}
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {question.maxLabel || question.maxValue}
                              </div>
                            </div>
                          )}

                          {question.type === "checkbox" && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <div className="h-4 w-4 rounded border" />
                                  <span>{option}</span>
                                </div>
                              ))}
                              {question.options.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">
                                  No options added
                                </p>
                              )}
                            </div>
                          )}

                          {question.type === "yes_no" && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border" />
                                <span>Yes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full border" />
                                <span>No</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ProjectAnalytics project={project} />
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          <TokenManagement projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};