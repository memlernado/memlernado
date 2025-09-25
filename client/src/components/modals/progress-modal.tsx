import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Clock, X } from "lucide-react";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
}

export default function ProgressModal({ isOpen, onClose, sprintId }: ProgressModalProps) {
  // Mock data for MVP demonstration - matches the design reference exactly
  const sprintStats = {
    totalTasks: 24,
    todoTasks: 8,
    inProgressTasks: 4,
    completedTasks: 12,
    completionRate: 67,
    timeSpent: "14.5h",
    weeklyTarget: "20h",
  };

  const learners = [
    {
      id: "1",
      name: "Emma Johnson",
      initials: "EM",
      grade: "5th Grade",
      completionRate: 75,
      tasksCompleted: 9,
      totalTasks: 12,
      avatarColor: "bg-secondary",
      subjects: {
        Math: { completed: 4, total: 5, rate: 80, color: "bg-chart-2" },
        Science: { completed: 3, total: 3, rate: 100, color: "bg-accent" },
        English: { completed: 2, total: 3, rate: 67, color: "bg-destructive" },
        Spanish: { completed: 1, total: 2, rate: 50, color: "bg-chart-1" },
      },
    },
    {
      id: "2", 
      name: "Liam Johnson",
      initials: "LJ",
      grade: "3rd Grade",
      completionRate: 60,
      tasksCompleted: 6,
      totalTasks: 10,
      avatarColor: "bg-chart-4",
      subjects: {
        Math: { completed: 2, total: 4, rate: 50, color: "bg-chart-2" },
        Science: { completed: 3, total: 4, rate: 75, color: "bg-accent" },
        English: { completed: 2, total: 2, rate: 100, color: "bg-destructive" },
        History: { completed: 0, total: 2, rate: 0, color: "bg-chart-5" },
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              Sprint Progress Dashboard
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              data-testid="button-close-progress-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          {/* Overall Sprint Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{sprintStats.totalTasks}</div>
                <p className="text-sm text-muted-foreground">
                  {sprintStats.todoTasks} To Do, {sprintStats.inProgressTasks} In Progress, {sprintStats.completedTasks} Done
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-accent/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{sprintStats.completionRate}%</div>
                <p className="text-sm text-muted-foreground">Above target (60%)</p>
                <Progress value={sprintStats.completionRate} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card className="bg-chart-4/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-4">{sprintStats.timeSpent}</div>
                <p className="text-sm text-muted-foreground">
                  Target: {sprintStats.weeklyTarget} this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Individual Learner Progress */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Individual Progress</h3>
            
            <div className="space-y-4">
              {learners.map((learner) => (
                <Card key={learner.id} className="border border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${learner.avatarColor} text-white font-medium`}>
                            {learner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-medium text-foreground">
                            {learner.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {learner.grade}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-accent">{learner.completionRate}%</div>
                        <p className="text-sm text-muted-foreground">
                          {learner.tasksCompleted}/{learner.totalTasks} tasks done
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(learner.subjects).map(([subject, stats]) => (
                        <div key={subject} className="text-center">
                          <div className="w-full bg-muted rounded-full h-2 mb-2">
                            <div 
                              className={`${stats.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${stats.rate}%` }}
                            />
                          </div>
                          <p className="text-sm font-medium text-foreground">{subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.completed}/{stats.total} tasks
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sprint Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Sprint Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{sprintStats.completedTasks}</div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-chart-4">{sprintStats.inProgressTasks}</div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-muted-foreground">{sprintStats.todoTasks}</div>
                  <p className="text-sm text-muted-foreground">Remaining Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
