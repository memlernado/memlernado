import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { WorkspaceMemberWithUser } from "@shared/schema";
import { useWorkspace } from "@/hooks/use-workspace";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Mail } from "lucide-react";


export default function Learners() {
  const { selectedWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();

  const { data: members = [], isLoading } = useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "members"],
    enabled: !!selectedWorkspaceId,
  });

  // Filter for learners only
  const learners = members.filter(member => member.user.role === 'learner');
  const facilitators = members.filter(member => member.user.role === 'facilitator');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Learners</h1>
              <p className="text-muted-foreground mt-1">
                Loading workspace members...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-2xl font-bold text-foreground">Learners</h1>
            <p className="text-muted-foreground mt-1">
              Manage workspace members and invite new learners
            </p>
          </div>
          <Button 
            data-testid="button-invite-learner"
            onClick={() => setLocation('/settings')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Learner
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{learners.length}</div>
              <p className="text-sm text-muted-foreground">Active in workspace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facilitators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{facilitators.length}</div>
              <p className="text-sm text-muted-foreground">Managing workspace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{members.length}</div>
              <p className="text-sm text-muted-foreground">In workspace</p>
            </CardContent>
          </Card>
        </div>

        {/* Learners Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Learners</h2>
          
          {learners.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No learners yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Invite learners to start tracking their progress and assigning tasks
                </p>
                <Button 
                  data-testid="button-invite-first-learner"
                  onClick={() => setLocation('/settings')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Your First Learner
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learners.map((member, index) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`card-learner-${member.userId}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`${index % 2 === 0 ? "bg-secondary" : "bg-chart-4"} text-white`}>
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{member.user.firstName} {member.user.lastName}</CardTitle>
                        <CardDescription>{member.user.email}</CardDescription>
                      </div>
                      <Badge variant="secondary">Learner</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="text-foreground">
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-progress-${member.userId}`}>
                          View Progress
                        </Button>
                        <Button size="sm" variant="ghost" data-testid={`button-manage-${member.userId}`}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Facilitators Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Facilitators</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilitators.map((member, index) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`card-facilitator-${member.userId}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.user.firstName} {member.user.lastName}</CardTitle>
                      <CardDescription>{member.user.email}</CardDescription>
                    </div>
                    <Badge variant="default">Facilitator</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-foreground">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}