import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TaskWithRelations } from "@shared/schema";
import { useWorkspace } from "@/hooks/use-workspace";
import MainLayout from "@/components/layout/main-layout";
import KanbanBoard from "@/components/kanban-board";
import TaskModal from "@/components/modals/task-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Archive, Users, Clock } from "lucide-react";

function EmptyBacklogState() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Empty Backlog</CardTitle>
          <CardDescription>
            No tasks in the backlog yet. Create tasks here to plan future work.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-xs text-muted-foreground">
            The backlog is where you organize tasks before assigning them to sprints. 
            Tasks here can be refined, prioritized, and moved to active sprints during sprint planning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Backlog() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { selectedWorkspaceId } = useWorkspace();

  // Fetch backlog tasks (tasks with sprintId = null)
  const { data: tasks = [], isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "backlog"],
    enabled: !!selectedWorkspaceId,
  });

  // If no workspace selected or loading, show loading state
  if (!selectedWorkspaceId || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  // Calculate task statistics
  const todoCount = tasks.filter(task => task.status === 'todo').length;
  const inProgressCount = tasks.filter(task => task.status === 'in_progress').length;
  const doneCount = tasks.filter(task => task.status === 'done').length;
  const totalTasks = tasks.length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 -mx-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Product Backlog</h1>
                <p className="text-muted-foreground mt-1">
                  Organize and prioritize tasks for future sprints
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={() => setShowTaskModal(true)}
                  data-testid="button-add-backlog-task"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>

          {/* Progress Overview */}
          {totalTasks > 0 && (
            <div className="mt-4 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">To Do: {todoCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                <span className="text-sm text-muted-foreground">In Progress: {inProgressCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="text-sm text-muted-foreground">Done: {doneCount}</span>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  {totalTasks} total tasks
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Backlog Info Card */}
        {totalTasks === 0 ? (
          <EmptyBacklogState />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Backlog Tasks
              </CardTitle>
              <CardDescription>
                These tasks are not yet assigned to any sprint. Use the Sprint Planning page to move tasks from the backlog to active sprints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Tasks can be assigned to learners</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimate time and set priorities</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Move to sprints during planning</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board */}
        {totalTasks > 0 && (
          <div className="flex-1 overflow-x-auto">
            <KanbanBoard 
              workspaceId={selectedWorkspaceId}
              sprintId={null} // No sprint ID for backlog tasks
              tasks={tasks}
            />
          </div>
        )}

        {/* Task Modal */}
        <TaskModal 
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          workspaceId={selectedWorkspaceId}
          sprintId={null} // Create tasks directly in backlog
        />
      </div>
    </MainLayout>
  );
}
