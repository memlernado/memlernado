import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Calendar, Users, BarChart3, BookOpen } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import CreateWorkspaceModal from "@/components/modals/create-workspace-modal";
import type { Workspace } from "@shared/schema";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalSprints: number;
  activeSprints: number;
  totalLearners: number;
  weeklyHours: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  // Fetch global dashboard statistics
  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  // Use default stats if data is not yet available
  const stats: DashboardStats = dashboardStats || {
    totalTasks: 0,
    completedTasks: 0,
    totalSprints: 0,
    activeSprints: 0,
    totalLearners: 0,
    weeklyHours: 0,
  };

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your homeschool journey
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/sprint-planning">
              <Button data-testid="button-new-sprint">
                <Plus className="h-4 w-4 mr-2" />
                New Sprint
              </Button>
            </Link>
            <Link href="/sprint-board">
              <Button variant="outline" data-testid="button-view-board">
                <BookOpen className="h-4 w-4 mr-2" />
                View Board
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} tasks done
              </p>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeSprints}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSprints} total sprints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalLearners}</div>
              <p className="text-xs text-muted-foreground">
                Active in current sprints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{stats.weeklyHours}h</div>
              <p className="text-xs text-muted-foreground">
                Learning time logged
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workspaces Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Workspaces</h2>
            <Button 
              variant="outline" 
              size="sm" 
              data-testid="button-create-workspace"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>

          {workspaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No workspaces yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first workspace to start organizing your homeschool journey
                </p>
                <Button 
                  data-testid="button-create-first-workspace"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workspace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((workspace: any) => (
                <Card key={workspace.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription>{workspace.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{workspace.learnerCount || 0} learner{workspace.learnerCount !== 1 ? 's' : ''}</span>
                      <span>{workspace.activeSprintCount || 0} active sprint{workspace.activeSprintCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-3">
                      <Link href="/sprint-board">
                        <Button size="sm" className="w-full" data-testid={`button-enter-workspace-${workspace.id}`}>
                          Enter Workspace
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
                <p className="text-muted-foreground">
                  Start working on tasks to see recent activity here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </MainLayout>
  );
}
