// src/components/projects/ProjectCard.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@/types/project";
import { Calendar, Video, Star, Users } from "lucide-react";
import { ProjectActions } from './ProjectActions';
import { cn } from "@/lib/utils";
import { generateThumbnail } from "@/lib/cloudinary/upload";
import { useMemo } from "react";

interface ProjectCardProps {
  project: Project;
  metrics?: {
    responseCount: number;
    avgRating?: number;
  };
  variant?: 'default' | 'compact';
  onStatusChange?: () => void;
  onDeleted?: () => void;
}

export function ProjectCard({ 
  project, 
  metrics,
  variant = 'default',
  onStatusChange,
  onDeleted 
}: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Generate thumbnail URL if needed
  const thumbnailUrl = useMemo(() => {
    if (project.thumbnailUrl) {
      console.log('Using stored thumbnail:', project.thumbnailUrl);
      return project.thumbnailUrl;
    }
    if (project.videoUrl) {
      const thumbnail = generateThumbnail(project.videoUrl);
      console.log('Generated thumbnail from video:', {
        originalVideo: project.videoUrl,
        generatedThumbnail: thumbnail
      });
      return thumbnail;
    }
    return null;
  }, [project.thumbnailUrl, project.videoUrl]);

  return (
    <Card className={cn(
      "group hover:shadow-md transition-all duration-200",
      project.status === "archived" && "opacity-75"
    )}>
      <CardContent className={cn(
        "space-y-4",
        variant === 'default' ? "p-6" : "p-4"
      )}>
        <div className="flex items-start justify-between gap-4">
          {/* Thumbnail */}
          <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video w-32 flex-shrink-0">
            {thumbnailUrl ? (
              <>
                <img 
                  src={thumbnailUrl} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Thumbnail failed to load:', thumbnailUrl);
                    // If thumbnail fails to load, show video icon
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                  onLoad={() => console.log('Thumbnail loaded successfully:', thumbnailUrl)}
                />
                {/* Video icon shown on error */}
                <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-100">
                  <Video className="w-8 h-8 text-slate-400" />
                </div>
              </>
            ) : (
              // Default video icon when no thumbnail available
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-8 h-8 text-slate-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link 
                  to={`/app/projects/${project.id}`}
                  className="text-lg font-semibold hover:text-[#011BA1] truncate block"
                >
                  {project.title}
                </Link>
                <CardDescription className="line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
              </div>
              
              <ProjectActions 
                project={project}
                onStatusChange={onStatusChange}
                onDeleted={onDeleted}
              />
            </div>

            {/* Stats & Info */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                Created {formatDate(project.createdAt)}
              </div>

              {metrics && (
                <>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-slate-400" />
                    {metrics.responseCount} responses
                  </div>

                  {metrics.avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      {metrics.avgRating.toFixed(1)} avg rating
                    </div>
                  )}
                </>
              )}

              <Badge 
                variant={project.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {project.status}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <Button 
                asChild
                className="bg-[#011BA1] hover:bg-[#00008B]"
                size="sm"
              >
                <Link to={`/app/projects/${project.id}`}>
                  View Details
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="sm"
              >
                <Link to={`/app/projects/${project.id}/edit`}>
                  Edit Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}