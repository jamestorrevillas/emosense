// src/components/dashboard/RecentProjects.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Project } from "@/types/videoReview";

interface ProjectMetric {
  project: Project;
  responseCount: number;
  avgRating?: number;
  lastActivity?: Date;
}

interface RecentProjectsProps {
  projects: ProjectMetric[];
  activeProjectCount: number;
}

export function RecentProjects({ projects, activeProjectCount }: RecentProjectsProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              You have {activeProjectCount} active projects
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/projects">
              View All
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map(({ project, responseCount, avgRating }) => (
            <div key={project.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <Link 
                  to={`/app/projects/${project.id}`}
                  className="font-medium hover:text-[#011BA1] truncate block"
                >
                  {project.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{responseCount} responses</span>
                  {avgRating && (
                    <span>{avgRating.toFixed(1)} avg rating</span>
                  )}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/app/projects/${project.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}