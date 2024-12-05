// src/components/dashboard/RecentActivity.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

interface ActivityItem {
  timestamp: Date;
  type: 'response' | 'project';
  projectId: string;
  projectTitle: string;
  description: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest project updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div key={index} className="flex gap-4">
              <div className="mt-1">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <Link 
                  to={`/app/projects/${activity.projectId}`}
                  className="font-medium hover:text-[#011BA1] block"
                >
                  {activity.description}
                </Link>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">
                    {activity.projectTitle}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}