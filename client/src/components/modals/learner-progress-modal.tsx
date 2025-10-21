import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Clock, X, Loader2, Calendar, BookOpen, Award, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import type { TaskWithRelations } from "@shared/schema";

interface LearnerProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function LearnerProgressModal({ isOpen, onClose, userId, userName }: LearnerProgressModalProps) {
  const { selectedWorkspaceId } = useWorkspace();

  // Fetch all tasks for this specific user
  const { data: userTasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "tasks"],
    enabled: !!selectedWorkspaceId && isOpen,
    select: (data) => data.filter(task => task.assignedTo === userId),
  });

  const isLoading = tasksLoading;

  // Calculate user-specific statistics
  const todoTasks = userTasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = userTasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = userTasks.filter(task => task.status === 'done').length;
  const totalTasks = userTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total time spent from tasks
  const totalTimeSpent = userTasks.reduce((total, task) => {
    if (task.timeSpent) {
      // Parse time strings like "30min", "1h", "1.5h"
      const timeStr = task.timeSpent.toLowerCase();
      if (timeStr.includes('h')) {
        const hours = parseFloat(timeStr.replace('h', ''));
        return total + (hours * 60); // Convert to minutes
      } else if (timeStr.includes('min')) {
        const minutes = parseFloat(timeStr.replace('min', ''));
        return total + minutes;
      }
    }
    return total;
  }, 0);

  const timeSpentHours = Math.round((totalTimeSpent / 60) * 10) / 10; // Round to 1 decimal
  const timeSpentDisplay = timeSpentHours > 0 ? `${timeSpentHours}h` : "0h";

  // Get unique sprints count for this user
  const uniqueSprints = new Set(userTasks.map(task => task.sprintId)).size;

  // Group tasks by subject
  const subjects: Record<string, { completed: number; total: number; rate: number; color: string }> = {};
  const subjectColors = {
    Math: "bg-chart-2",
    Science: "bg-accent",
    English: "bg-destructive",
    Spanish: "bg-chart-1",
    History: "bg-chart-5",
    Art: "bg-chart-3",
    Music: "bg-chart-4",
    "Computer Science": "bg-chart-6",
    Geography: "bg-chart-7",
  };

  userTasks.forEach(task => {
    const subject = task.subject || 'Other';
    if (!subjects[subject]) {
      subjects[subject] = { completed: 0, total: 0, rate: 0, color: subjectColors[subject as keyof typeof subjectColors] || "bg-muted" };
    }
    subjects[subject].total++;
    if (task.status === 'done') {
      subjects[subject].completed++;
    }
  });

  // Calculate rates for each subject
  Object.values(subjects).forEach(subject => {
    subject.rate = subject.total > 0 ? Math.round((subject.completed / subject.total) * 100) : 0;
  });

  // Get user initials
  const nameParts = userName.split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : userName.substring(0, 2).toUpperCase();

  const userStats = {
    totalTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    completionRate,
    timeSpent: timeSpentDisplay,
    totalSprints: uniqueSprints,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-secondary text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {userName}'s Progress
              </DialogTitle>
              <p className="text-sm text-muted-foreground">Individual learning progress</p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading progress data...</span>
            </div>
          </div>
        ) : (

          <div className="space-y-6 pt-6">
            {/* User Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Total Tasks</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{userStats.totalTasks}</div>
                  <p className="text-sm text-muted-foreground">
                    {userStats.todoTasks} To Do, {userStats.inProgressTasks} In Progress, {userStats.completedTasks} Done
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-accent/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{userStats.completionRate}%</div>
                  <p className="text-sm text-muted-foreground">Overall progress</p>
                  <Progress value={userStats.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-chart-4/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Time Spent</CardTitle>
                    <Clock className="h-4 w-4 text-chart-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-4">{userStats.timeSpent}</div>
                  <p className="text-sm text-muted-foreground">
                    Total learning time
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-chart-1/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Sprints</CardTitle>
                    <Calendar className="h-4 w-4 text-chart-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-1">{userStats.totalSprints}</div>
                  <p className="text-sm text-muted-foreground">
                    Participated in
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subject Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Subject Progress</h3>

              {Object.keys(subjects).length === 0 ? (
                <Card className="border border-border">
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tasks assigned yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subjects).map(([subject, stats]) => (
                    <Card key={subject} className="border border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium text-foreground">
                            {subject}
                          </CardTitle>
                          <Badge variant="secondary">{stats.rate}%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`${stats.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${stats.rate}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="text-foreground font-medium">
                              {stats.completed}/{stats.total} tasks
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Learning Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary">{userStats.completedTasks}</div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-chart-4">{userStats.inProgressTasks}</div>
                    <p className="text-sm text-muted-foreground">Currently Working On</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-muted-foreground">{userStats.todoTasks}</div>
                    <p className="text-sm text-muted-foreground">Upcoming Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
