import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Target, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import type { TaskWithRelations, WorkspaceMemberWithUser } from "@shared/schema";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
}



export default function ProgressModal({ isOpen, onClose, sprintId }: ProgressModalProps) {
  const { t } = useTranslation();
  const { selectedWorkspaceId } = useWorkspace();

  // Fetch sprint tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/sprints", sprintId, "tasks"],
    enabled: !!sprintId && isOpen,
  });

  // Fetch workspace members (learners)
  const { data: members = [], isLoading: membersLoading } = useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "members"],
    enabled: !!selectedWorkspaceId && isOpen,
  });

  const isLoading = tasksLoading || membersLoading;

  // Calculate sprint statistics from real data
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total time spent from tasks
  const totalTimeSpent = tasks.reduce((total, task) => {
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

  const sprintStats = {
    totalTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    completionRate,
    timeSpent: timeSpentDisplay,
    weeklyTarget: "20h", // This could be made configurable
  };

  // Filter learners from workspace members
  const learners = members
    .filter(member => member.user.role === 'learner')
    .map(member => {
      const userTasks = tasks.filter(task => task.assignedTo === member.user.id);
      const completedUserTasks = userTasks.filter(task => task.status === 'done');
      const userCompletionRate = userTasks.length > 0 ? Math.round((completedUserTasks.length / userTasks.length) * 100) : 0;

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

      const initials = `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase();
      const avatarColors = ["bg-secondary", "bg-chart-4", "bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-5"];
      const avatarColor = avatarColors[member.user.id.charCodeAt(0) % avatarColors.length];

      return {
        id: member.user.id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        initials,
        grade: "Student", // Could be made configurable
        completionRate: userCompletionRate,
        tasksCompleted: completedUserTasks.length,
        totalTasks: userTasks.length,
        avatarColor,
        subjects,
      };
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl font-bold text-foreground">
              {t('modals.progress.title')}
            </DialogTitle>           
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">{t('modals.progress.loading')}</span>
            </div>
          </div>
        ) : (
        
        <div className="space-y-6 pt-6">
          {/* Overall Sprint Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">{t('modals.progress.stats.totalTasks')}</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{sprintStats.totalTasks}</div>
                <p className="text-sm text-muted-foreground">
                  {sprintStats.todoTasks} {t('common.status.todo')}, {sprintStats.inProgressTasks} {t('common.status.inProgress')}, {sprintStats.completedTasks} {t('common.status.done')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-accent/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">{t('modals.progress.stats.completionRate')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{sprintStats.completionRate}%</div>
                <p className="text-sm text-muted-foreground">{t('modals.progress.stats.aboveTarget')}</p>
                <Progress value={sprintStats.completionRate} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card className="bg-chart-4/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">{t('modals.progress.stats.timeSpent')}</CardTitle>
                  <Clock className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-4">{sprintStats.timeSpent}</div>
                <p className="text-sm text-muted-foreground">
                  {t('modals.progress.stats.target', { target: sprintStats.weeklyTarget })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Individual Learner Progress */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('modals.progress.individualProgress')}</h3>
            
            {learners.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">{t('modals.progress.noLearners')}</p>
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
              {learners.map((learner) => (
                <Card key={learner.id} className="border border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${learner.avatarColor} text-white font-medium`}>
                            {learner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-medium text-foreground">
                            {learner.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {learner.grade}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-accent">{learner.completionRate}%</div>
                        <p className="text-sm text-muted-foreground">
                          {learner.tasksCompleted}/{learner.totalTasks} {t('common.labels.tasks')} {t('common.status.done')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(learner.subjects).map(([subject, stats]) => (
                        <div key={subject} className="text-center">
                          <div className="w-full bg-muted rounded-full h-2 mb-2">
                            <div 
                              className={`${stats.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${stats.rate}%` }}
                            />
                          </div>
                          <p className="text-sm font-medium text-foreground">{subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.completed}/{stats.total} {t('common.labels.tasks')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </div>

          {/* Sprint Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">{t('modals.progress.sprintSummary.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{sprintStats.completedTasks}</div>
                  <p className="text-sm text-muted-foreground">{t('modals.progress.sprintSummary.tasksCompleted')}</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-chart-4">{sprintStats.inProgressTasks}</div>
                  <p className="text-sm text-muted-foreground">{t('modals.progress.sprintSummary.inProgress')}</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-muted-foreground">{sprintStats.todoTasks}</div>
                  <p className="text-sm text-muted-foreground">{t('modals.progress.sprintSummary.remainingTasks')}</p>
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
