import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceMemberWithUser } from "@shared/schema";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  sprintId: string | null;
}

export default function TaskModal({ isOpen, onClose, workspaceId, sprintId }: TaskModalProps) {
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
        title: "Task created",
        description: "New task has been created successfully.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
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
        title: "Validation Error",
        description: "Task title is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.subject) {
      toast({
        title: "Validation Error", 
        description: "Please select a subject.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.assignedTo) {
      toast({
        title: "Validation Error",
        description: "Please assign the task to a learner.",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new learning task to the current sprint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              data-testid="input-task-title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              data-testid="textarea-task-description"
              placeholder="Describe what the learner needs to do..."
              className="h-24 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-subject">Subject</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger data-testid="select-task-subject">
                  <SelectValue placeholder="Select subject" />
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
              <Label htmlFor="task-estimated-time">Estimated Time</Label>
              <Input
                id="task-estimated-time"
                data-testid="input-task-estimated-time"
                placeholder="e.g., 30min, 1h"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="task-assignee">Assign to Learner</Label>
            <Select 
              value={formData.assignedTo} 
              onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
            >
              <SelectTrigger data-testid="select-task-assignee">
                <SelectValue placeholder="Select learner" />
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
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
