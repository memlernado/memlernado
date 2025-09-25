import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from "./task-card";
import TaskDetailsModal from "./modals/task-details-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface KanbanBoardProps {
  workspaceId: string;
  sprintId: string;
  tasks: Task[];
}

// Droppable column component
function DroppableColumn({ column, children }: { column: any; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });
  
  const style = {
    backgroundColor: isOver ? 'rgba(0, 0, 0, 0.1)' : undefined,
    transition: 'background-color 200ms ease',
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`w-80 ${column.color} rounded-xl p-4 kanban-column`}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard({ workspaceId, sprintId, tasks: propTasks }: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Task details modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );
  
  // Fetch sprint tasks from API
  const { data: sprintTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/sprints', sprintId, 'tasks'],
    enabled: !!sprintId,
  });

  // Use prop tasks if provided, otherwise use fetched sprint tasks
  const tasks: Task[] = propTasks.length > 0 ? propTasks : sprintTasks;

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sprints", sprintId, "tasks"] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const todoTasks = tasks.filter(task => task.status === "todo");
  const inProgressTasks = tasks.filter(task => task.status === "in_progress");
  const doneTasks = tasks.filter(task => task.status === "done");

  const handleTaskMove = (taskId: string, newStatus: Task["status"]) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    let newStatus: Task["status"];
    
    // Check if we dropped over a column or a task
    if (["todo", "in_progress", "done"].includes(over.id as string)) {
      // Dropped over a column
      newStatus = over.id as Task["status"];
    } else {
      // Dropped over a task - find which column the target task belongs to
      const targetTask = tasks.find(task => task.id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      } else {
        setActiveId(null);
        return;
      }
    }
    
    // Find the current task to check if status actually changed
    const currentTask = tasks.find(task => task.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      handleTaskMove(taskId, newStatus);
    }
    
    setActiveId(null);
  };

  // Find the active task for drag overlay
  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  // Task modal handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: todoTasks,
      color: "bg-muted/30",
      dotColor: "bg-muted",
      badgeColor: "bg-muted text-muted-foreground",
    },
    {
      id: "in_progress",
      title: "In Progress", 
      tasks: inProgressTasks,
      color: "bg-chart-4/10",
      dotColor: "bg-chart-4",
      badgeColor: "bg-chart-4 text-white",
    },
    {
      id: "done",
      title: "Done",
      tasks: doneTasks,
      color: "bg-accent/10",
      dotColor: "bg-accent",
      badgeColor: "bg-accent text-accent-foreground",
    },
  ];

  // Show loading state while fetching tasks
  if (tasksLoading && propTasks.length === 0) {
    return (
      <div className="flex space-x-6 min-w-max">
        {["To Do", "In Progress", "Done"].map((title) => (
          <div key={title} className="w-80 bg-muted/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-muted rounded-full" />
              <h3 className="font-semibold text-foreground">{title}</h3>
              <Badge className="bg-muted text-muted-foreground">0</Badge>
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-6 min-w-max">
        {columns.map((column) => (
          <DroppableColumn key={column.id} column={column}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${column.dotColor} rounded-full`} />
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <Badge className={column.badgeColor}>
                  {column.tasks.length}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" data-testid={`button-add-task-${column.id}`}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={handleTaskMove}
                    isLoading={updateTaskMutation.isPending}
                    isDragging={activeId === task.id}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </SortableContext>
          </DroppableColumn>
        ))}
      </div>
      
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            onMove={() => {}} // No-op for overlay
            isLoading={false}
            isDragging={true}
          />
        )}
      </DragOverlay>
      
      <TaskDetailsModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={selectedTask}
        workspaceId={workspaceId}
        sprintId={sprintId}
      />
    </DndContext>
  );
}
