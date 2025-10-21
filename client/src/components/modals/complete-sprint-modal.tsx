import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLocation } from "wouter";
import type { Sprint, TaskWithRelations } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompleteSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint;
}

export default function CompleteSprintModal({ isOpen, onClose, sprint }: CompleteSprintModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();
  
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch sprint tasks to show completion stats
  const { data: tasks = [] } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/sprints", sprint.id, "tasks"],
    enabled: isOpen && !!sprint.id,
  });

  const completeSprintMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sprints/${sprint.id}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "backlog"] });
      toast({
        title: t('messages.success.sprintCompleted'),
        description: t('messages.success.sprintCompletedDescription'),
      });
      onClose();
      // Redirect to sprint planning to see the completed sprint
      setLocation("/sprint-planning");
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error.sprintCompleteFailed'),
        description: error.message,
        variant: "destructive",
      });
      setIsCompleting(false);
    },
  });

  const handleComplete = () => {
    setIsCompleting(true);
    completeSprintMutation.mutate();
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const incompleteTasks = tasks.filter(task => task.status !== 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const startDate = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'N/A';
  const endDate = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            {t('modals.completeSprint.title')}
          </DialogTitle>
          <DialogDescription>
            {t('modals.completeSprint.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sprint Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{sprint.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{sprint.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{startDate} - {endDate}</span>
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">{t('modals.completeSprint.sprintSummary')}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-accent/10 rounded-lg">
                <div className="text-2xl font-bold text-accent">{completedTasks}</div>
                <div className="text-sm text-muted-foreground">{t('modals.completeSprint.completed')}</div>
              </div>
              <div className="text-center p-3 bg-chart-4/10 rounded-lg">
                <div className="text-2xl font-bold text-chart-4">{incompleteTasks}</div>
                <div className="text-sm text-muted-foreground">{t('modals.completeSprint.incomplete')}</div>
              </div>
            </div>

            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-semibold text-foreground">{t('modals.completeSprint.completionRate', { rate: completionRate })}</div>
              <div className="text-sm text-muted-foreground">{t('modals.completeSprint.overallProgress')}</div>
            </div>
          </div>

          {/* Warning for incomplete tasks */}
          {incompleteTasks > 0 && (
            <div className="flex items-start gap-2 p-3 bg-chart-4/10 border border-chart-4/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-chart-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-chart-4">{t('modals.completeSprint.incompleteTasks')}</p>
                <p className="text-muted-foreground">
                  {t('modals.completeSprint.incompleteTasksDescription', { count: incompleteTasks })}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCompleting}
          >
            {t('modals.completeSprint.cancel')}
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-accent hover:bg-accent/90"
          >
            {isCompleting ? t('modals.completeSprint.completing') : t('modals.completeSprint.completeSprint')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
