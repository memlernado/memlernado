import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Workspace, WorkspaceMemberWithUser, WorkspaceWithStats } from "@shared/schema";
import { useWorkspace } from "@/hooks/use-workspace";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Users, Trash2, UserMinus, UserPlus } from "lucide-react";


export default function WorkspaceSettings() {
  const { selectedWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Fetch workspace details
  const { data: workspaces, isLoading: isWorkspaceLoading } = useQuery<WorkspaceWithStats[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!selectedWorkspaceId,
  });

  // Update state when workspace data changes
  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId);
      if (workspace) {
        setWorkspaceName(workspace.name);
        setWorkspaceDescription(workspace.description || "");
      }
    }
  }, [workspaces, selectedWorkspaceId]);

  // Fetch workspace members
  const { data: members = [], isLoading: isMembersLoading } = useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "members"],
    enabled: !!selectedWorkspaceId,
  });

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch(`/api/workspaces/${selectedWorkspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: "Success",
        description: "Workspace updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      });
    },
  });

  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceMutation.mutate({
      name: workspaceName,
      description: workspaceDescription,
    });
  };

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/workspaces/${selectedWorkspaceId}/members`, {
        email,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setNewMemberEmail("");
      toast({
        title: "Success",
        description: "Student added to workspace successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    addMemberMutation.mutate(newMemberEmail.trim());
  };

  if (isWorkspaceLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workspace Settings</h1>
              <p className="text-muted-foreground mt-1">Loading workspace settings...</p>
            </div>
          </div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32 bg-muted/30 rounded" />
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
            <h1 className="text-2xl font-bold text-foreground">Workspace Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your workspace configuration and members
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Settings</span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Workspace Details */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>
                Update your workspace name and description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                    data-testid="input-workspace-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-description">Description</Label>
                  <Textarea
                    id="workspace-description"
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    placeholder="Enter workspace description"
                    rows={3}
                    data-testid="input-workspace-description"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={updateWorkspaceMutation.isPending}
                  data-testid="button-save-workspace"
                >
                  {updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Members Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Workspace Members</span>
              </CardTitle>
              <CardDescription>
                Manage who has access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Member Form */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Student by Email</span>
                </h4>
                <form onSubmit={handleAddMember} className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter student's email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      data-testid="input-member-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                    data-testid="button-add-member"
                  >
                    {addMemberMutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  The student must already have an account in the system
                </p>
              </div>

              {/* Members List */}
              {isMembersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No members yet</h3>
                  <p className="text-muted-foreground">Add students to collaborate on this workspace</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={member.user.role === 'facilitator' ? 'default' : 'secondary'}>
                          {member.user.role}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-member-${member.userId}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center space-x-2">
                <Trash2 className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Delete Workspace</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete a workspace, there is no going back. This will permanently delete 
                    the workspace and all its data including tasks, sprints, and member associations.
                  </p>
                  <Button 
                    variant="destructive" 
                    disabled
                    data-testid="button-delete-workspace"
                  >
                    Delete Workspace (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}