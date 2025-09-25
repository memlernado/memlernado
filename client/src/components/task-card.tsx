import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: "todo" | "in_progress" | "done";
  estimatedTime?: string;
  timeSpent?: string;
  progress?: number;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, newStatus: Task["status"]) => void;
  isLoading?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
}

export default function TaskCard({ task, onMove, isLoading, isDragging = false, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  const getAvatarColor = (assigneeId: string) => {
    return assigneeId === "user-learner-1" ? "bg-secondary" : "bg-chart-4";
  };

  const getNextStatus = (currentStatus: Task["status"]): Task["status"] | null => {
    switch (currentStatus) {
      case "todo":
        return "in_progress";
      case "in_progress":
        return "done";
      case "done":
        return null;
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(task.status);
  const assigneeInitials = task.assignee 
    ? `${task.assignee.firstName[0]}${task.assignee.lastName[0]}`
    : "?";

  const avatarColor = task.assignee ? getAvatarColor(task.assignee.id) : "bg-muted";

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging and onClick is provided
    if (!sortableIsDragging && !isDragging && onClick) {
      onClick();
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={cn(
        "task-card bg-card border border-border rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing hover:cursor-pointer",
        task.status === "done" && "opacity-75",
        (isDragging || sortableIsDragging) && "opacity-50 transform scale-105",
        "hover:shadow-md transition-shadow"
      )}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-foreground pr-2 leading-tight">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Badge className={cn("text-xs", getSubjectColor(task.subject))}>
            {task.subject}
          </Badge>
          {task.status === "done" && (
            <Check className="h-4 w-4 text-accent" />
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Progress bar for in-progress tasks */}
      {task.status === "in_progress" && task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className={`${avatarColor} text-white text-xs`}>
                  {assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {task.assignee.firstName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {task.status === "done" 
                ? `Completed in ${task.estimatedTime || "Unknown"}`
                : task.timeSpent 
                  ? `${task.timeSpent}/${task.estimatedTime || "?"}`
                  : task.estimatedTime || "No estimate"
              }
            </span>
          </div>

          {/* Move task button */}
          {nextStatus && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onMove(task.id, nextStatus)}
              disabled={isLoading}
              data-testid={`button-move-task-${task.id}`}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
