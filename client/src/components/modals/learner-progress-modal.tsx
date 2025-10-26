import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Target, TrendingUp, Clock, Loader2, Calendar, BookOpen, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import type { TaskWithRelations, Subject } from "@shared/schema";

interface LearnerProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function LearnerProgressModal({ isOpen, onClose, userId, userName }: LearnerProgressModalProps) {
  const { t } = useTranslation();
  const { selectedWorkspaceId } = useWorkspace();

  // Fetch all tasks for this specific user
  const { data: userTasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "tasks"],
    enabled: !!selectedWorkspaceId && isOpen,
    select: (data) => data.filter(task => task.assignedTo === userId),
  });

  // Fetch workspace subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "subjects"],
    enabled: !!selectedWorkspaceId && isOpen,
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
  const subjectStats: Record<string, { completed: number; total: number; rate: number; color: string; name: string }> = {};

  userTasks.forEach(task => {
    if (task.subject) {
      const subject = subjects.find(s => s.id === task.subject);
      if (subject) {
        if (!subjectStats[subject.id]) {
          subjectStats[subject.id] = { 
            completed: 0, 
            total: 0, 
            rate: 0, 
            color: subject.color,
            name: subject.name
          };
        }
        subjectStats[subject.id].total++;
        if (task.status === 'done') {
          subjectStats[subject.id].completed++;
        }
      }
    }
  });

  // Calculate rates for each subject
  Object.values(subjectStats).forEach(subject => {
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
                {t('modals.learnerProgress.title', { name: userName })}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{t('modals.learnerProgress.subtitle')}</p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">{t('modals.learnerProgress.loading')}</span>
            </div>
          </div>
        ) : (

          <div className="space-y-6 pt-6">
            {/* User Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">{t('modals.learnerProgress.stats.totalTasks')}</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{userStats.totalTasks}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('common.phrases.taskStatusSummary', { 
                      todo: userStats.todoTasks, 
                      inProgress: userStats.inProgressTasks, 
                      done: userStats.completedTasks 
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-accent/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">{t('modals.learnerProgress.stats.completionRate')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{userStats.completionRate}%</div>
                  <p className="text-sm text-muted-foreground">{t('modals.learnerProgress.stats.overallProgress')}</p>
                  <Progress value={userStats.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-chart-4/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">{t('modals.learnerProgress.stats.timeSpent')}</CardTitle>
                    <Clock className="h-4 w-4 text-chart-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-4">{userStats.timeSpent}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('modals.learnerProgress.stats.totalLearningTime')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-chart-1/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">{t('modals.learnerProgress.stats.sprints')}</CardTitle>
                    <Calendar className="h-4 w-4 text-chart-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-1">{userStats.totalSprints}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('modals.learnerProgress.stats.participatedIn')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subject Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t('modals.learnerProgress.subjectProgress')}</h3>

              {Object.keys(subjects).length === 0 ? (
                <Card className="border border-border">
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('modals.learnerProgress.noTasks')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subjectStats).map(([subjectId, stats]) => (
                    <Card key={subjectId} className="border border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium text-foreground">
                            {stats.name}
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
                            <span className="text-muted-foreground">{t('common.labels.completion')}:</span>
                            <span className="text-foreground font-medium">
                              {t('common.phrases.taskCountFraction', { fraction: `${stats.completed}/${stats.total}` })}
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
                  {t('modals.learnerProgress.learningSummary.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary">{userStats.completedTasks}</div>
                    <p className="text-sm text-muted-foreground">{t('modals.learnerProgress.learningSummary.tasksCompleted')}</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-chart-4">{userStats.inProgressTasks}</div>
                    <p className="text-sm text-muted-foreground">{t('modals.learnerProgress.learningSummary.currentlyWorking')}</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-muted-foreground">{userStats.todoTasks}</div>
                    <p className="text-sm text-muted-foreground">{t('modals.learnerProgress.learningSummary.upcomingTasks')}</p>
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
