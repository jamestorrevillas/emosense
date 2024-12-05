// src/components/dashboard/DashboardMetrics.tsx
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Video, 
  Plus,
  ArrowUpRight,
} from "lucide-react";

interface DashboardMetricsProps {
  totalProjects: number;
  activeProjects: number;
  totalResponses: number;
}

export function DashboardMetrics({
  totalProjects,
  activeProjects,
  totalResponses,
}: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 bg-[#011BA1]/10 rounded-full">
              <Video className="h-6 w-6 text-[#011BA1]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-sm text-slate-600">Total Projects</p>
            </div>
            <div className="text-xs text-slate-500">
              {activeProjects} active
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-sm text-slate-600">Total Responses</p>
            </div>
            <div className="text-xs flex items-center gap-1 text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              Last 30 days
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#011BA1] text-white">
  <CardContent className="pt-6">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="font-medium">Create New Project</div>
      <Button 
        asChild 
        variant="outline" 
        className="bg-white text-[#011BA1] hover:bg-white/80 hover:text-[#011BA1] w-full"
      >
        <Link to="/app/projects/new">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </Button>
    </div>
  </CardContent>
</Card>
    </div>
  );
}