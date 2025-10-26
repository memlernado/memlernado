import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceMemberWithUser, Subject } from "@shared/schema";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  sprintId: string | null;
}

export default function TaskModal({ isOpen, onClose, workspaceId, sprintId }: TaskModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    estimatedTime: "",
    assignedTo: "",
  });

  const { data: workspaceMembers = [] } = useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ["/api/workspaces", workspaceId, "members"],
    enabled: !!workspaceId, // Enable now that endpoint exists
  });

  // Fetch workspace subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/workspaces", workspaceId, "subjects"],
    enabled: !!workspaceId,
  });

  // Extract learners from workspace members (filter out facilitators)
  const availableLearners = workspaceMembers
    .filter((member: any) => member.user.role === 'learner')
    .map((member: any) => ({
      id: member.user.id,
      name: `${member.user.firstName} ${member.user.lastName}`,
    }));

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return await res.json();
    },
    onSuccess: () => {
      sprintId && queryClient.invalidateQueries({ queryKey: ["/api/sprints", sprintId, "tasks"] });
      toast({
        title: t('messages.success.taskCreated'),
        description: t('messages.success.taskCreatedDescription'),
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.error.taskCreateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: t('messages.error.validationError'),
        description: t('modals.task.validation.titleRequired'),
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.subject) {
      toast({
        title: t('messages.error.validationError'), 
        description: t('modals.task.validation.subjectRequired'),
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.assignedTo) {
      toast({
        title: t('messages.error.validationError'),
        description: t('modals.task.validation.assigneeRequired'),
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate({
      ...formData,
      workspaceId,
      sprintId,
      status: "todo",
    });
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      estimatedTime: "",
      assignedTo: "",
    });
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('modals.task.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('modals.task.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title">{t('modals.task.taskTitle')}</Label>
            <Input
              id="task-title"
              data-testid="input-task-title"
              placeholder={t('modals.task.taskTitlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="task-description">{t('modals.task.taskDescription')}</Label>
            <Textarea
              id="task-description"
              data-testid="textarea-task-description"
              placeholder={t('modals.task.taskDescriptionPlaceholder')}
              className="h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-subject">{t('modals.task.subject')}</Label>
              {subjects.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('modals.task.noSubjects.title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('modals.task.noSubjects.description')}
                  </p>
                </div>
              ) : (
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger data-testid="select-task-subject">
                    <SelectValue placeholder={t('modals.task.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="task-estimated-time">{t('modals.task.estimatedTime')}</Label>
              <Input
                id="task-estimated-time"
                data-testid="input-task-estimated-time"
                placeholder={t('modals.task.estimatedTimePlaceholder')}
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="task-assignee">{t('modals.task.assignToLearner')}</Label>
            <Select 
              value={formData.assignedTo} 
              onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
            >
              <SelectTrigger data-testid="select-task-assignee">
                <SelectValue placeholder={t('modals.task.selectLearner')} />
              </SelectTrigger>
              <SelectContent>
                {availableLearners.map((learner) => (
                  <SelectItem key={learner.id} value={learner.id}>
                    {learner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-task"
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? t('modals.task.creating') : t('modals.task.createTask')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
