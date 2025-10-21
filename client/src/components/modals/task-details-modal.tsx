import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TaskWithRelations } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Calendar } from "lucide-react";


interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskWithRelations | null;
  workspaceId: string;
  sprintId: string | null;
}

export default function TaskDetailsModal({ 
  isOpen, 
  onClose, 
  task, 
  workspaceId,
  sprintId 
}: TaskDetailsModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    subject: task?.subject || "",
    estimatedTime: task?.estimatedTime || "",
    assignedTo: task?.assignee?.id || "",
    progress: task?.progress || 0,
  });

  // Update form data when task changes
  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        subject: task.subject || "",
        estimatedTime: task.estimatedTime || "",
        assignedTo: task.assignee?.id || "",
        progress: task.progress || 0,
      });
    }
  }, [task]);

  const { data: workspaceMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/workspaces", workspaceId, "members"],
    enabled: !!workspaceId && isOpen,
  });

  // Extract learners from workspace members
  const availableLearners = workspaceMembers
    .filter((member: any) => member.user.role === 'learner')
    .map((member: any) => ({
      id: member.user.id,
      name: `${member.user.firstName} ${member.user.lastName}`,
    }));

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task?.id}`, taskData);
      return await res.json();
    },
    onSuccess: () => {
      sprintId && queryClient.invalidateQueries({ queryKey: ["/api/sprints", sprintId, "tasks"] });
      toast({
        title: t('messages.success.taskUpdated'),
        description: t('messages.success.taskUpdatedDescription'),
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error.taskUpdateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: t('messages.error.validationError'),
        description: t('modals.task.validation.titleRequired'),
        variant: "destructive",
      });
      return;
    }
    
    updateTaskMutation.mutate(formData);
  };

  const handleClose = () => {
    setIsEditing(false);
    // Reset form data to original task data
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        subject: task.subject || "",
        estimatedTime: task.estimatedTime || "",
        assignedTo: task.assignee?.id || "",
        progress: task.progress || 0,
      });
    }
    onClose();
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Math: "bg-chart-2 text-white",
      Science: "bg-accent text-accent-foreground",
      English: "bg-destructive text-destructive-foreground",
      Spanish: "bg-chart-1 text-white",
      History: "bg-chart-5 text-white",
      Art: "bg-secondary text-secondary-foreground",
    };
    return colors[subject] || "bg-muted text-muted-foreground";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-muted text-muted-foreground";
      case "in_progress":
        return "bg-chart-4 text-white";
      case "done":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return t('common.status.todo');
      case "in_progress":
        return t('common.status.inProgress');
      case "done":
        return t('common.status.done');
      default:
        return status;
    }
  };

  const subjects = [
    "Math",
    "Science", 
    "English",
    "History",
    "Spanish",
    "Art",
    "Music",
    "Physical Education",
  ];

  if (!task) return null;

  const assigneeInitials = task.assignee 
    ? `${task.assignee.firstName[0]}${task.assignee.lastName[0]}`
    : "?";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('modals.taskDetails.title')}</span>
            <div className="flex items-center space-x-2">
              <Badge className={getSubjectColor(task.subject || "")}>
                {task.subject || t('modals.taskDetails.noSubject')}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {task.title}
              </h2>
              <p className="text-muted-foreground">
                {task.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-xs">
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : t('modals.taskDetails.assignee')}
                  </span>
                </div>
              </div>

              {/* Estimated Time */}
              {task.estimatedTime && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{task.estimatedTime}</span>
                </div>
              )}
            </div>

            {/* Progress for in-progress tasks */}
            {task.status === "in_progress" && task.progress !== undefined && (
              <div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{t('modals.taskDetails.progress')}</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-3" />
              </div>
            )}

            {/* Time Spent */}
            {task.timeSpent && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('modals.taskDetails.timeSpent', { time: task.timeSpent })}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} data-testid="button-close-task-details">
                {t('modals.taskDetails.close')}
              </Button>
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-task">
                {t('modals.taskDetails.editTask')}
              </Button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="task-title">{t('modals.taskDetails.editTitle')}</Label>
              <Input
                id="task-title"
                data-testid="input-edit-task-title"
                placeholder={t('modals.task.taskTitlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="task-description">{t('modals.taskDetails.editDescription')}</Label>
              <Textarea
                id="task-description"
                data-testid="textarea-edit-task-description"
                placeholder={t('modals.task.taskDescriptionPlaceholder')}
                className="h-24 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-subject">{t('modals.taskDetails.editSubject')}</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger data-testid="select-edit-task-subject">
                    <SelectValue placeholder={t('modals.task.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="task-estimated-time">{t('modals.taskDetails.editEstimatedTime')}</Label>
                <Input
                  id="task-estimated-time"
                  data-testid="input-edit-task-estimated-time"
                  placeholder={t('modals.task.estimatedTimePlaceholder')}
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="task-assignee">{t('modals.taskDetails.editAssignee')}</Label>
              <Select 
                value={formData.assignedTo} 
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger data-testid="select-edit-task-assignee">
                  <SelectValue placeholder={t('modals.task.selectLearner')} />
                </SelectTrigger>
                <SelectContent>
                  {availableLearners.map((learner: any) => (
                    <SelectItem key={learner.id} value={learner.id}>
                      {learner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress slider for in-progress tasks */}
            {task.status === "in_progress" && (
              <div>
                <Label htmlFor="task-progress">{t('modals.taskDetails.editProgress', { progress: formData.progress })}</Label>
                <Input
                  id="task-progress"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  data-testid="range-edit-task-progress"
                  className="w-full"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditing(false)}
                data-testid="button-cancel-edit"
              >
                {t('modals.taskDetails.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={updateTaskMutation.isPending}
                data-testid="button-save-task"
              >
                {updateTaskMutation.isPending ? t('modals.taskDetails.saving') : t('modals.taskDetails.saveChanges')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}