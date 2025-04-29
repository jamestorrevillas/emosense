// src/components/videoReview/ProjectTabList.tsx
import { Project } from "@/types/videoReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectGrid } from "./VideoReviewGrid";
import { Badge } from "@/components/ui/badge";

interface ProjectTabListProps {
  projects: Project[];
  metrics: {
    [projectId: string]: {
      responseCount: number;
      avgRating?: number;
    };
  };
  onStatusChange: () => void;
  onProjectDeleted: () => void;
}

export function ProjectTabList({ 
  projects, 
  metrics, 
  onStatusChange,
  onProjectDeleted
}: ProjectTabListProps) {
  const activeProjects = projects.filter(p => p.status === 'active');
  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList>
        <TabsTrigger value="active" className="relative">
          Active Projects
          {activeProjects.length > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-6 px-2"
            >
              {activeProjects.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="archived" className="relative">
          Archived
          {archivedProjects.length > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-6 px-2"
            >
              {archivedProjects.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <ProjectGrid
          projects={activeProjects}
          metrics={metrics}
          onStatusChange={onStatusChange}
          onProjectDeleted={onProjectDeleted}
        />
      </TabsContent>

      <TabsContent value="archived">
        <ProjectGrid
          projects={archivedProjects}
          metrics={metrics}
          onStatusChange={onStatusChange}
          onProjectDeleted={onProjectDeleted}
        />
      </TabsContent>
    </Tabs>
  );
}