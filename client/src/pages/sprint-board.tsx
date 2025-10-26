import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Sprint, TaskWithRelations } from "@shared/schema";
import { useLocation } from "wouter";
import { useWorkspace } from "@/hooks/use-workspace";
import MainLayout from "@/components/layout/main-layout";
import KanbanBoard from "@/components/kanban-board";
import TaskModal from "@/components/modals/task-modal";
import ProgressModal from "@/components/modals/progress-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  BarChart3,
  Calendar,
  PlusCircle,
  CheckCircle,
} from "lucide-react";

function EmptySprintState() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleCreateSprint = () => {
    setLocation("/sprint-planning");
  };

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{t("sprintBoard.emptyState.title")}</CardTitle>
          <CardDescription>
            {t("sprintBoard.emptyState.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button
            className="w-full"
            onClick={handleCreateSprint}
            data-testid="button-create-sprint"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("sprintBoard.emptyState.createButton")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("sprintBoard.emptyState.scrumInfo")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SprintBoard() {
  const { t } = useTranslation();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { selectedWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();

  // Fetch active sprint for this workspace - only if workspace is selected
  const { data: activeSprint, isLoading: isSprintLoading } = useQuery<Sprint>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"],
    enabled: !!selectedWorkspaceId,
  });

  // Only fetch tasks if we have an active sprint
  const { data: tasks = [] } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/sprints", activeSprint?.id, "tasks"],
    enabled: !!activeSprint?.id,
  });

  // If no workspace selected or loading, show loading state
  if (!selectedWorkspaceId || isSprintLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">{t("sprintBoard.loading")}</p>
        </div>
      </MainLayout>
    );
  }

  // If no active sprint, show empty state
  if (!activeSprint) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="bg-card border-b border-border px-6 py-4 -mx-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("sprintBoard.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("sprintBoard.subtitle")}
            </p>
          </div>
          <EmptySprintState />
        </div>
      </MainLayout>
    );
  }

  // Check if sprint is completed (shouldn't happen but handle gracefully)
  if (activeSprint.status === "completed") {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="bg-card border-b border-border px-6 py-4 -mx-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("sprintBoard.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("sprintBoard.completedState.description")}
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>{t("sprintBoard.completedState.title")}</CardTitle>
                <CardDescription>
                  {t("sprintBoard.completedState.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => setLocation("/sprint-planning")}>
                  {t("sprintBoard.completedState.goToPlanning")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate real counts from task data
  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const startDate =
    (activeSprint.startDate &&
      new Date(activeSprint.startDate).toISOString().split("T")[0]) ||
    "Start Date";
  const endDate =
    (activeSprint.endDate &&
      new Date(activeSprint.endDate).toISOString().split("T")[0]) ||
    "End Date";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 -mx-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("sprintBoard.title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeSprint.name} • {startDate} - {endDate}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <Button
                variant="secondary"
                size="default"
                className="h-11 sm:h-10"
                onClick={() => setShowTaskModal(true)}
                data-testid="button-add-task"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("sprintBoard.addTask")}
              </Button>
              <Button
                size="default"
                className="h-11 sm:h-10"
                onClick={() => setShowProgressModal(true)}
                data-testid="button-view-progress"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("sprintBoard.viewProgress")}
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mt-4 hidden sm:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-muted rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {t("sprintBoard.columns.todo")}: {todoCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {t("sprintBoard.columns.inProgress")}: {inProgressCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {t("sprintBoard.columns.done")}: {doneCount}
              </span>
            </div>
            <div className="ml-auto">
              <Badge variant="secondary">
                {t("sprintBoard.progress.sprintProgress", {
                  rate: completionRate,
                })}
              </Badge>
            </div>
          </div>

          {/* Mobile Progress Summary */}
          <div className="mt-4 sm:hidden">
            <Badge variant="secondary" className="text-sm">
              {t("sprintBoard.progress.sprintProgress", {
                rate: completionRate,
              })}
            </Badge>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <KanbanBoard
            workspaceId={selectedWorkspaceId}
            sprintId={activeSprint.id}
            tasks={tasks}
          />
        </div>

        {/* Modals */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          workspaceId={selectedWorkspaceId}
          sprintId={activeSprint.id}
        />

        <ProgressModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          sprintId={activeSprint.id}
        />
      </div>
    </MainLayout>
  );
}
