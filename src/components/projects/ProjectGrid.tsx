// src/components/projects/ProjectGrid.tsx
import { Project } from "@/types/project";
import { ProjectCard } from "./ProjectCard";

interface ProjectMetrics {
  [projectId: string]: {
    responseCount: number;
    avgRating?: number;
  };
}

interface ProjectGridProps {
  projects: Project[];
  metrics?: ProjectMetrics;
  variant?: 'default' | 'compact';
  onStatusChange?: () => void;
  onProjectDeleted?: () => void;
}

export function ProjectGrid({
  projects,
  metrics,
  variant = 'default',
  onStatusChange,
  onProjectDeleted
}: ProjectGridProps) {
  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          metrics={metrics?.[project.id]}
          variant={variant}
          onStatusChange={onStatusChange}
          onDeleted={onProjectDeleted}
        />
      ))}

      {projects.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No projects found in this category
        </div>
      )}
    </div>
  );
}