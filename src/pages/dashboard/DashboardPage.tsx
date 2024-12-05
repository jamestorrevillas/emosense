// src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types/project";
import { TokenResponse } from "@/types/response";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";

interface DashboardData {
  totalProjects: number;
  totalResponses: number;
  activeProjects: number;
  recentActivity: {
    timestamp: Date;
    type: 'response' | 'project';
    projectId: string;
    projectTitle: string;
    description: string;
  }[];
  projectMetrics: {
    project: Project;
    responseCount: number;
    avgRating?: number;
    lastActivity?: Date;
  }[];
}

export const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch projects
        const projectsRef = collection(db, "projects");
        const projectsQuery = query(
          projectsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const projectsSnapshot = await getDocs(projectsQuery);
        const projects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        // Process project metrics and responses
        const projectMetrics = await Promise.all(projects.map(async (project) => {
          // Get responses for each project
          const responsesRef = collection(db, `projects/${project.id}/responses`);
          const responsesSnapshot = await getDocs(responsesRef);
          const responses = responsesSnapshot.docs.map(doc => doc.data()) as TokenResponse[];

          const responseCount = responses.length;
          
          // Calculate average rating if quick ratings exist
          const ratings = responses
            .filter(r => r.quickRating !== undefined)
            .map(r => r.quickRating as number);
          
          const avgRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : undefined;
          
          // Get last activity timestamp
          const lastActivity = responses.length > 0
            ? new Date(Math.max(...responses.map(r => 
                new Date(r.completedAt || r.startedAt).getTime()
              )))
            : undefined;

          return {
            project,
            responseCount,
            avgRating,
            lastActivity
          };
        }));

        // Calculate total responses
        const totalResponses = projectMetrics.reduce((sum, p) => sum + p.responseCount, 0);

        // Get recent activity
        const recentActivity = projectMetrics
          .flatMap(({ project, lastActivity }) => {
            const activities = [];
            
            // Add response activity if exists
            if (lastActivity) {
              activities.push({
                timestamp: lastActivity,
                type: 'response' as const,
                projectId: project.id,
                projectTitle: project.title,
                description: 'New response submitted'
              });
            }
            
            // Add project creation activity
            activities.push({
              timestamp: new Date(project.createdAt),
              type: 'project' as const,
              projectId: project.id,
              projectTitle: project.title,
              description: 'Project created'
            });
            
            return activities;
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5);

        // Set dashboard data
        setDashboardData({
          totalProjects: projects.length,
          totalResponses,
          activeProjects: projects.filter(p => p.status === 'active').length,
          recentActivity,
          projectMetrics: projectMetrics
            .sort((a, b) => (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0))
            .slice(0, 3)
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading || !dashboardData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Static Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-slate-600">Welcome back to your EmoSense dashboard</p>
      </div>

      {isLoading || !dashboardData ? (
        <div className="space-y-8">
          {/* Metrics Cards */}
          <div className="animate-pulse grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="animate-pulse grid gap-4 md:grid-cols-7">
            {/* Recent Projects */}
            <div className="col-span-4 space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-span-3 space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Metrics */}
          <DashboardMetrics 
            totalProjects={dashboardData.totalProjects}
            activeProjects={dashboardData.activeProjects}
            totalResponses={dashboardData.totalResponses}
          />

          {/* Projects and Activity */}
          <div className="grid gap-4 md:grid-cols-7">
            <RecentProjects 
              projects={dashboardData.projectMetrics}
              activeProjectCount={dashboardData.activeProjects}
            />
            <RecentActivity 
              activities={dashboardData.recentActivity}
            />
          </div>
        </>
      )}
    </div>
  );
};