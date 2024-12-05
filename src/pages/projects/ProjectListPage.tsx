// src/pages/projects/ProjectListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectTabList } from "@/components/projects/ProjectTabList";
import { ProjectListSkeleton } from "@/components/projects/ProjectListSkeleton";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectMetrics {
  [projectId: string]: {
    responseCount: number;
    avgRating?: number;
  };
}

export const ProjectListPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError("");

      const projectsRef = collection(db, "projects");
      const projectsQuery = query(
        projectsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(projectsQuery);
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Fetch metrics for each project
      const metricsData: ProjectMetrics = {};
      
      await Promise.all(projectsData.map(async (project) => {
        const responsesRef = collection(db, `projects/${project.id}/responses`);
        const responsesSnapshot = await getDocs(responsesRef);
        const responses = responsesSnapshot.docs.map(doc => doc.data());

        const responseCount = responses.length;
        
        const ratings = responses
          .filter(r => r.quickRating !== undefined)
          .map(r => r.quickRating as number);
        
        metricsData[project.id] = {
          responseCount,
          avgRating: ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : undefined
        };
      }));

      setProjects(projectsData);
      setMetrics(metricsData);
      setError("");
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to load projects"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleProjectDeleted = () => {
    fetchProjects();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Projects</h1>
            <p className="text-slate-600">
              Manage your video projects and view feedback
            </p>
          </div>
          <Button disabled className="bg-[#011BA1] hover:bg-[#00008B] text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
        
        <ProjectListSkeleton />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Projects</h1>
          <p className="text-slate-600">
            Manage your video projects and view feedback
          </p>
        </div>
        <Button 
          asChild 
          className="bg-[#011BA1] hover:bg-[#00008B] text-white"
        >
          <Link to="/app/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-slate-600 text-center">
              No projects yet. Create your first project to start collecting feedback.
            </p>
            <Button 
              asChild
              className="bg-[#011BA1] hover:bg-[#00008B] text-white"
            >
              <Link to="/app/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProjectTabList
          projects={projects}
          metrics={metrics}
          onStatusChange={fetchProjects}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
    </div>
  );
};