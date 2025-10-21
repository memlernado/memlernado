import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@shared/schema";
import { useWorkspace } from "@/hooks/use-workspace";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Clock, Target, TrendingUp, Calendar } from "lucide-react";


export default function Dashboard() {
  const { selectedWorkspaceId } = useWorkspace();
  
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "dashboard"],
    enabled: !!selectedWorkspaceId,
  });
  
  // Use real data or show loading/empty state
  const sprintStats = dashboardData?.sprintStats || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    activeSprint: null,
  };
  
  const learners = dashboardData?.learners || [];
  
  // Add avatar colors to learners
  const learnersWithColors = learners.map((learner, index) => ({
    ...learner,
    avatarColor: index % 2 === 0 ? "bg-secondary" : "bg-chart-4",
  }));
  
  const overallProgress = sprintStats.totalTasks > 0 
    ? Math.round((sprintStats.completedTasks / sprintStats.totalTasks) * 100) 
    : 0;
  
  // Calculate sprint days
  const getSprintDays = () => {
    if (!sprintStats.activeSprint) return { current: 0, total: 0, text: 'No active sprint' };
    
    const startDate = new Date(sprintStats.activeSprint.startDate);
    const endDate = new Date(sprintStats.activeSprint.endDate);
    const today = new Date();
    
    // Calculate total days in sprint
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate current day (1-based)
    const currentDay = Math.max(1, Math.min(totalDays, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1));
    
    return {
      current: currentDay,
      total: totalDays,
      text: `Day ${currentDay} of ${totalDays}`
    };
  };
  
  const sprintDays = getSprintDays();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Progress Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Loading progress data...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20 bg-muted/30 rounded" />
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progress Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track learning progress and sprint performance
            </p>
          </div>
        </div>

        {/* Overall Sprint Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sprintStats.totalTasks}</div>
              <p className="text-sm text-muted-foreground">
                {sprintStats.todoTasks} To Do, {sprintStats.inProgressTasks} In Progress, {sprintStats.completedTasks} Done
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{overallProgress}%</div>
              <p className="text-sm text-muted-foreground">
                {overallProgress >= 60 ? 'Above target (60%)' : 
                 overallProgress >= 40 ? 'On track (40%+)' : 
                 'Below target (40%)'}
              </p>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sprint Progress</CardTitle>
              <Calendar className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                {sprintStats.activeSprint ? `${sprintDays.current}/${sprintDays.total}` : '0/0'}
              </div>
              <p className="text-sm text-muted-foreground">
                {sprintStats.activeSprint ? sprintDays.text : 'No active sprint'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Individual Learner Progress */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Individual Progress</h2>
          
          <div className="space-y-4">
            {learnersWithColors.map((learner) => (
              <Card key={learner.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${learner.avatarColor} text-white`}>
                          {learner.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{learner.name}</CardTitle>
                        <CardDescription>
                          {learner.totalTasks > 0 ? `${learner.totalTasks} tasks assigned` : 'No tasks assigned'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent">{learner.completionRate}%</div>
                      <p className="text-sm text-muted-foreground">
                        {learner.tasksCompleted}/{learner.totalTasks} tasks done
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(learner.subjects).map(([subject, stats]) => (
                      <div key={subject} className="text-center">
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              subject === "Math" ? "bg-chart-2" :
                              subject === "Science" ? "bg-accent" :
                              subject === "English" ? "bg-destructive" :
                              subject === "Spanish" ? "bg-chart-1" :
                              "bg-chart-5"
                            }`}
                            style={{ width: `${stats.rate}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-foreground">{subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.completed}/{stats.total} tasks
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Achievements */}
        {learnersWithColors.some(learner => learner.completionRate > 0) && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Achievements</h2>
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">
                    Start completing tasks to see achievements and milestones here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
