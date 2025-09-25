import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLocation } from "wouter";
import type { Sprint } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Users, Edit2, Play, Pause, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SprintPlanning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedWorkspaceId, selectedWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const { data: sprints = [] } = useQuery<Sprint[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"],
    enabled: !!selectedWorkspaceId,
  });

  const createSprintMutation = useMutation({
    mutationFn: async (sprintData: any) => {
      const res = await apiRequest("POST", "/api/sprints", {
        ...sprintData,
        workspaceId: selectedWorkspaceId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"] });
      toast({
        title: "Sprint created",
        description: "Your new sprint has been created successfully.",
      });
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({ sprintId, updates }: { sprintId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/sprints/${sprintId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"] });
      toast({
        title: "Sprint updated",
        description: "Sprint has been updated successfully.",
      });
      setEditingSprintId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activateSprintMutation = useMutation({
    mutationFn: async (sprintId: string) => {
      // First deactivate all other sprints in this workspace
      const deactivatePromises = sprints
        .filter(s => s.isActive && s.id !== sprintId)
        .map(s => apiRequest("PATCH", `/api/sprints/${s.id}`, { isActive: false }));
      
      await Promise.all(deactivatePromises);
      
      // Then activate the selected sprint
      const res = await apiRequest("PATCH", `/api/sprints/${sprintId}`, { isActive: true });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"] });
      toast({
        title: "Sprint activated",
        description: "Sprint is now active and ready for use.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to activate sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) {
      toast({
        title: "No workspace selected",
        description: "Please select a workspace to create a sprint.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingSprintId) {
      // Update existing sprint
      updateSprintMutation.mutate({
        sprintId: editingSprintId,
        updates: formData
      });
    } else {
      // Create new sprint
      createSprintMutation.mutate(formData);
    }
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprintId(sprint.id);
    setFormData({
      name: sprint.name,
      description: sprint.description || "",
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : "",
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : "",
    });
    setShowCreateForm(true);
  };

  const handleActivateSprint = (sprintId: string) => {
    activateSprintMutation.mutate(sprintId);
  };

  const handleViewBoard = () => {
    setLocation("/sprint-board");
  };

  const handleCancelEdit = () => {
    setEditingSprintId(null);
    setShowCreateForm(false);
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    });
  };

  // Calculate task counts and completion rates for each sprint
  const sprintsWithStats = sprints.map((sprint: Sprint) => ({
    ...sprint,
    taskCount: 0, // TODO: This will be populated when we have task data
    completionRate: 0, // TODO: Calculate based on tasks
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sprint Planning</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage learning sprints for your workspace
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            data-testid="button-create-sprint"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sprint
          </Button>
        </div>

        {/* Create/Edit Sprint Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingSprintId ? "Edit Sprint" : "Create New Sprint"}</CardTitle>
              <CardDescription>
                Plan a focused learning period with specific goals and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sprint-name">Sprint Name</Label>
                    <Input
                      id="sprint-name"
                      data-testid="input-sprint-name"
                      placeholder="e.g., Week 4: History & Geography"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sprint-workspace">Workspace</Label>
                    <Input
                      id="sprint-workspace"
                      value={selectedWorkspace?.name || "No workspace selected"}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sprint-description">Description</Label>
                  <Textarea
                    id="sprint-description"
                    data-testid="textarea-sprint-description"
                    placeholder="Describe the focus and goals for this sprint..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sprint-start-date">Start Date</Label>
                    <Input
                      id="sprint-start-date"
                      data-testid="input-sprint-start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sprint-end-date">End Date</Label>
                    <Input
                      id="sprint-end-date"
                      data-testid="input-sprint-end-date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-sprint"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSprintMutation.isPending || updateSprintMutation.isPending}
                    data-testid="button-save-sprint"
                  >
                    {editingSprintId 
                      ? (updateSprintMutation.isPending ? "Updating..." : "Update Sprint")
                      : (createSprintMutation.isPending ? "Creating..." : "Create Sprint")
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sprints List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">All Sprints</h2>
          
          {sprintsWithStats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No sprints yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first sprint to start organizing learning activities
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  data-testid="button-create-first-sprint"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sprint
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sprintsWithStats.map((sprint) => (
                <Card key={sprint.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">{sprint.name}</CardTitle>
                        {sprint.isActive && (
                          <Badge variant="default" className="bg-accent text-accent-foreground">
                            Active
                          </Badge>
                        )}
                        {!sprint.isActive && sprint.completionRate === 100 && (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-accent">{sprint.completionRate}%</div>
                        <p className="text-sm text-muted-foreground">completion</p>
                      </div>
                    </div>
                    <CardDescription>{sprint.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'N/A'} - {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{sprint.taskCount} tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {sprint.isActive ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleViewBoard}
                            data-testid={`button-view-sprint-${sprint.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Board
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleActivateSprint(sprint.id)}
                            disabled={activateSprintMutation.isPending}
                            data-testid={`button-activate-sprint-${sprint.id}`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {activateSprintMutation.isPending ? "Activating..." : "Activate"}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditSprint(sprint)}
                          data-testid={`button-edit-sprint-${sprint.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
