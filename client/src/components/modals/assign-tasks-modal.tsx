import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import type { Sprint, TaskWithRelations } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Users, Archive, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssignTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint;
}

export default function AssignTasksModal({ isOpen, onClose, sprint }: AssignTasksModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedWorkspaceId } = useWorkspace();
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Fetch backlog tasks
  const { data: backlogTasks = [] } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "backlog"],
    enabled: isOpen && !!selectedWorkspaceId,
  });

  const assignTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      // Update each task to assign it to the sprint
      const updatePromises = taskIds.map(taskId => 
        apiRequest("PATCH", `/api/tasks/${taskId}`, { sprintId: sprint.id })
      );
      
      await Promise.all(updatePromises);
      return taskIds;
    },
    onSuccess: (assignedTaskIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "backlog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"] });
      toast({
        title: t('messages.success.tasksAssigned', { count: assignedTaskIds.length, sprintName: sprint.name }),
        description: t('messages.success.tasksAssigned', { count: assignedTaskIds.length, sprintName: sprint.name }),
      });
      setSelectedTaskIds([]);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error.taskAssignFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === backlogTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(backlogTasks.map(task => task.id));
    }
  };

  const handleAssign = () => {
    if (selectedTaskIds.length === 0) {
      toast({
        title: t('messages.error.noTasksSelected'),
        description: t('messages.error.noTasksSelectedDescription'),
        variant: "destructive",
      });
      return;
    }
    assignTasksMutation.mutate(selectedTaskIds);
  };

  const handleClose = () => {
    setSelectedTaskIds([]);
    onClose();
  };

  // Group tasks by subject for better organization
  const tasksBySubject = backlogTasks.reduce((acc, task) => {
    const subject = task.subject || 'Uncategorized';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(task);
    return acc;
  }, {} as Record<string, TaskWithRelations[]>);

  const startDate = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'N/A';
  const endDate = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            {t('modals.assignTasks.title')}
          </DialogTitle>
          <DialogDescription>
            {t('modals.assignTasks.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sprint Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">{sprint.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{sprint.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{startDate} - {endDate}</span>
              </div>
              <Badge variant="secondary">{t('modals.assignTasks.draft')}</Badge>
            </div>
          </div>

          {/* Task Selection */}
          {backlogTasks.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('modals.assignTasks.noTasks.title')}</h3>
              <p className="text-muted-foreground">
                {t('modals.assignTasks.noTasks.description')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedTaskIds.length === backlogTasks.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    {t('modals.assignTasks.selectAll', { count: backlogTasks.length })}
                  </label>
                </div>
                <Badge variant="outline">
                  {t('modals.assignTasks.selected', { count: selectedTaskIds.length })}
                </Badge>
              </div>

              <Separator />

              {/* Tasks by Subject */}
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {Object.entries(tasksBySubject).map(([subject, tasks]) => (
                    <div key={subject}>
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        {subject}
                        <Badge variant="outline" className="text-xs">
                          {t('modals.assignTasks.taskCount', { count: tasks.length })}
                        </Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={task.id}
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <label htmlFor={task.id} className="text-sm font-medium text-foreground cursor-pointer">
                                {task.title}
                              </label>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{task.assignee?.firstName} {task.assignee?.lastName}</span>
                                  </div>
                                )}
                                {task.estimatedTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.estimatedTime}</span>
                                  </div>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={assignTasksMutation.isPending}
          >
            {t('modals.assignTasks.cancel')}
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={assignTasksMutation.isPending || selectedTaskIds.length === 0}
            className="bg-accent hover:bg-accent/90"
          >
            {assignTasksMutation.isPending ? t('modals.assignTasks.assigning') : t('modals.assignTasks.assignTasks', { count: selectedTaskIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
