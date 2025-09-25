import { ReactNode, useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import Navigation from "./navigation";
import Sidebar from "./sidebar";
import CreateWorkspaceModal from "@/components/modals/create-workspace-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Calendar, Trophy } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

function EmptyWorkspaceState() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Card className="text-center">
          <CardHeader className="pb-8">
            <div className="mx-auto w-20 h-20 mb-6 bg-muted rounded-full flex items-center justify-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome to Memlernado!</CardTitle>
            <CardDescription className="text-lg">
              Get started by creating your first workspace to organize your homeschool learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Family Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Create a collaborative space for your family or homeschool group to organize learning activities
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Sprint Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Organize learning into focused sprints with clear goals and timelines using SCRUM methodology
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor learner achievements and progress through visual Kanban boards and dashboards
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                size="lg" 
                onClick={() => setShowCreateModal(true)}
                data-testid="button-create-first-workspace"
                className="min-w-[200px]"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Create Your First Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                A workspace is like a family classroom where you can organize learning tasks, track progress, and collaborate
              </p>
            </div>
          </CardContent>
        </Card>

        <CreateWorkspaceModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { workspaces, isLoading } = useWorkspace();

  // Show loading state while fetching workspaces
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="mx-auto w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center animate-pulse">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground" data-testid="text-loading-workspaces">
              Loading your workspaces...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show onboarding if no workspaces exist
  if (workspaces.length === 0) {
    return <EmptyWorkspaceState />;
  }

  // Show normal app interface when workspaces exist
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
