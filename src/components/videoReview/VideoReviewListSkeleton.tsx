// src/components/videoReview/ProjectListSkeleton.tsx
import { Card } from "@/components/ui/card";

export function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="p-6">
          <div className="flex gap-4">
            {/* Thumbnail skeleton */}
            <div className="w-32 aspect-video bg-slate-200 rounded-lg animate-pulse" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  {/* Title */}
                  <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                  {/* Description */}
                  <div className="space-y-1">
                    <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
                {/* Actions skeleton */}
                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
              </div>

              {/* Stats skeleton */}
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                ))}
              </div>

              {/* Buttons skeleton */}
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}