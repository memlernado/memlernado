import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type {  WorkspaceMemberWithUser, WorkspaceWithStats, Subject, WorkspaceInvitationWithRelations } from "@shared/schema";
import { useWorkspace } from "@/hooks/use-workspace";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getNextAvailableColor, SUBJECT_COLORS } from "@shared/colors";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, Trash2, UserMinus, UserPlus, Plus, Edit2, Check, X } from "lucide-react";


export default function WorkspaceSettings() {
  const { t } = useTranslation();
  const { selectedWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingSubjectColor, setEditingSubjectColor] = useState("");

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

  // Fetch workspace subjects
  const { data: subjects = [], isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "subjects"],
    enabled: !!selectedWorkspaceId,
  });

  // Fetch workspace invitations
  const { data: invitations = [], isLoading: isInvitationsLoading } = useQuery<WorkspaceInvitationWithRelations[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "invitations"],
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
        title: t('common.buttons.save'),
        description: t('settings.success.workspaceUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.buttons.error'),
        description: t('settings.errors.workspaceUpdateFailed'),
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
        title: t('common.buttons.save'),
        description: t('settings.success.memberAdded'),
      });
    },
    onError: (error: Error) => {
      console.error("Error adding member:", error);
      toast({
        title: t('common.buttons.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add subject mutation
  const addSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const usedColors = subjects.map(s => s.color);
      const color = getNextAvailableColor(usedColors);
      
      const response = await apiRequest("POST", `/api/workspaces/${selectedWorkspaceId}/subjects`, {
        name,
        color,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "subjects"] });
      setNewSubjectName("");
      toast({
        title: t('common.buttons.save'),
        description: t('settings.success.subjectAdded'),
      });
    },
    onError: (error: Error) => {
      console.error("Error adding subject:", error);
      toast({
        title: t('common.buttons.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const response = await apiRequest("DELETE", `/api/subjects/${subjectId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "subjects"] });
      toast({
        title: t('common.buttons.save'),
        description: t('settings.success.subjectDeleted'),
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting subject:", error);
      toast({
        title: t('common.buttons.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ subjectId, name, color }: { subjectId: string; name: string; color: string }) => {
      const response = await apiRequest("PATCH", `/api/subjects/${subjectId}`, {
        name,
        color,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "subjects"] });
      setEditingSubjectId(null);
      setEditingSubjectName("");
      setEditingSubjectColor("");
      toast({
        title: t('common.buttons.save'),
        description: t('settings.success.subjectUpdated'),
      });
    },
    onError: (error: Error) => {
      console.error("Error updating subject:", error);
      toast({
        title: t('common.buttons.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/workspaces/${selectedWorkspaceId}/invitations`, {
        email,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "invitations"] });
      setInviteEmail("");
      toast({
        title: t('common.buttons.save'),
        description: "Invitation sent successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Error sending invitation:", error);
      toast({
        title: t('common.buttons.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest("DELETE", `/api/invitations/${invitationId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", selectedWorkspaceId, "invitations"] });
      toast({
        title: t('common.buttons.save'),
        description: "Invitation cancelled",
      });
    },
    onError: (error: Error) => {
      console.error("Error cancelling invitation:", error);
      toast({
        title: t('common.buttons.error'),
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

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    sendInvitationMutation.mutate(inviteEmail.trim());
  };

  const handleCancelInvitation = (invitationId: string) => {
    cancelInvitationMutation.mutate(invitationId);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    addSubjectMutation.mutate(newSubjectName.trim());
  };

  const handleDeleteSubject = (subjectId: string) => {
    deleteSubjectMutation.mutate(subjectId);
  };

  const handleStartEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditingSubjectName(subject.name);
    setEditingSubjectColor(subject.color);
  };

  const handleCancelEditSubject = () => {
    setEditingSubjectId(null);
    setEditingSubjectName("");
    setEditingSubjectColor("");
  };

  const handleSaveEditSubject = () => {
    if (!editingSubjectName.trim()) return;
    updateSubjectMutation.mutate({
      subjectId: editingSubjectId!,
      name: editingSubjectName.trim(),
      color: editingSubjectColor,
    });
  };

  if (isWorkspaceLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.loading')}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('settings.subtitle')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('navigation.settings')}</span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Workspace Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.workspaceDetails.title')}</CardTitle>
              <CardDescription>
                {t('settings.workspaceDetails.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">{t('settings.workspaceDetails.name')}</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={t('settings.workspaceDetails.namePlaceholder')}
                    data-testid="input-workspace-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-description">{t('settings.workspaceDetails.description')}</Label>
                  <Textarea
                    id="workspace-description"
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    placeholder={t('settings.workspaceDetails.descriptionPlaceholder')}
                    rows={3}
                    data-testid="input-workspace-description"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={updateWorkspaceMutation.isPending}
                  data-testid="button-save-workspace"
                >
                  {updateWorkspaceMutation.isPending ? t('settings.workspaceDetails.saving') : t('settings.workspaceDetails.saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Members Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{t('settings.members.title')}</span>
              </CardTitle>
              <CardDescription>
                {t('settings.members.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Member Form */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>{t('settings.members.addMember.title')}</span>
                </h4>
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder={t('settings.members.addMember.placeholder')}
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      data-testid="input-member-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                    data-testid="button-add-member"
                    className="w-full sm:w-auto"
                  >
                    {addMemberMutation.isPending ? t('settings.members.addMember.adding') : t('settings.members.addMember.button')}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.members.addMember.note')}
                </p>
              </div>

              {/* Send Invitation Form */}
              <div className="mb-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Invite Learner</span>
                </h4>
                <form onSubmit={handleSendInvitation} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address to invite"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-invite-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={sendInvitationMutation.isPending || !inviteEmail.trim()}
                    data-testid="button-send-invitation"
                    className="w-full sm:w-auto"
                  >
                    {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  An invitation email will be sent to the learner. They can join even if they don't have an account yet.
                </p>
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Pending Invitations</span>
                  </h4>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={cancelInvitationMutation.isPending}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-cancel-invitation-${invitation.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('settings.members.noMembers.title')}</h3>
                  <p className="text-muted-foreground">{t('settings.members.noMembers.description')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={member.user.role === 'facilitator' ? 'default' : 'secondary'}>
                          {t(`common.roles.${member.user.role}`)}
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

          {/* Subjects Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{t('settings.subjects.title')}</span>
              </CardTitle>
              <CardDescription>
                {t('settings.subjects.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Subject Form */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>{t('settings.subjects.addSubject.title')}</span>
                </h4>
                <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={t('settings.subjects.addSubject.placeholder')}
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      data-testid="input-subject-name"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={addSubjectMutation.isPending || !newSubjectName.trim()}
                    data-testid="button-add-subject"
                    className="w-full sm:w-auto"
                  >
                    {addSubjectMutation.isPending ? t('settings.subjects.addSubject.adding') : t('settings.subjects.addSubject.button')}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.subjects.addSubject.note')}
                </p>
              </div>

              {/* Subjects List */}
              {isSubjectsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('settings.subjects.noSubjects.title')}</h3>
                  <p className="text-muted-foreground">{t('settings.subjects.noSubjects.description')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                      {editingSubjectId === subject.id ? (
                        // Edit mode
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-1">
                          <Input
                            value={editingSubjectName}
                            onChange={(e) => setEditingSubjectName(e.target.value)}
                            className="flex-1 w-full sm:w-auto"
                            placeholder={t('settings.subjects.editSubject.namePlaceholder')}
                            data-testid={`input-edit-subject-name-${subject.id}`}
                          />
                          <Select
                            value={editingSubjectColor}
                            onValueChange={setEditingSubjectColor}
                          >
                            <SelectTrigger className="w-full sm:w-min">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECT_COLORS.map((color) => (
                                <SelectItem key={color} value={color}>
                                  <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded ${color.split(' ')[0]}`} />
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center space-x-3">
                          <Badge className={subject.color}>
                            {subject.name}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        {editingSubjectId === subject.id ? (
                          // Edit buttons
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEditSubject}
                              disabled={updateSubjectMutation.isPending || !editingSubjectName.trim()}
                              data-testid={`button-save-subject-${subject.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEditSubject}
                              disabled={updateSubjectMutation.isPending}
                              data-testid={`button-cancel-subject-${subject.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          // View buttons
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEditSubject(subject)}
                              data-testid={`button-edit-subject-${subject.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSubject(subject.id)}
                              disabled={deleteSubjectMutation.isPending}
                              data-testid={`button-delete-subject-${subject.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                <span>{t('settings.dangerZone.title')}</span>
              </CardTitle>
              <CardDescription>
                {t('settings.dangerZone.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">{t('settings.dangerZone.deleteWorkspace.title')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.dangerZone.deleteWorkspace.description')}
                  </p>
                  <Button 
                    variant="destructive" 
                    disabled
                    data-testid="button-delete-workspace"
                  >
                    {t('settings.dangerZone.deleteWorkspace.button')}
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