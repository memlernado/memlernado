import { useQuery } from "@tanstack/react-query";
import type { Sprint } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutGrid, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";


export default function Sidebar() {
  const [location] = useLocation();
  const { selectedWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  
  // Fetch active sprint
  const { data: activeSprint } = useQuery<Sprint>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "sprints", "active"],
    enabled: !!selectedWorkspaceId,
  });
  
  // Fetch dashboard data for learner progress
  const { data: dashboardData } = useQuery<any>({
    queryKey: ["/api/workspaces", selectedWorkspaceId, "dashboard"],
    enabled: !!selectedWorkspaceId,
  });
  
  const learners = dashboardData?.learners?.map((learner: any, index: number) => ({
    id: learner.id,
    name: learner.name,
    initials: learner.initials,
    progress: learner.completionRate,
    avatarColor: index % 2 === 0 ? "bg-secondary" : "bg-chart-4",
  })) || [];

  const allNavigationItems = [
    {
      name: "Dashboard", 
      href: "/dashboard",
      icon: BarChart3,
      current: location === "/dashboard",
      roles: ["facilitator", "learner"],
    },
    {
      name: "Backlog",
      href: "/backlog",
      icon: Archive,
      current: location === "/backlog",
      roles: ["facilitator"],
    },
    {
      name: "Sprint Board",
      href: "/sprint-board",
      icon: LayoutGrid,
      current: location === "/sprint-board",
      roles: ["facilitator", "learner"],
    },
    {
      name: "Sprint Planning",
      href: "/sprint-planning", 
      icon: Calendar,
      current: location === "/sprint-planning",
      roles: ["facilitator"],
    },
    {
      name: "Learners",
      href: "/learners",
      icon: Users,
      current: location === "/learners",
      roles: ["facilitator"],
    },
    {
      name: "Workspace Settings",
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
      roles: ["facilitator"],
    },
  ];

  // Filter navigation items based on user role
  const navigation = allNavigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-card border-r border-border hidden lg:block">
      <div className="p-6 space-y-6">
        {/* Sprint Selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Current Sprint
          </label>
          {activeSprint ? (
                <p className="text-sm text-foreground">{activeSprint.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No active sprint</p>
              )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    item.current && "bg-primary text-primary-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Learners Quick View - Only for facilitators */}
        {user?.role === 'facilitator' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Active Learners
            </label>
            <div className="mt-3 space-y-3">
              {learners.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No learners in workspace
                </div>
              ) : (
                learners.map((learner: any) => (
                  <div key={learner.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${learner.avatarColor} text-white`}>
                        {learner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {learner.name}
                      </p>
                      <Progress value={learner.progress} className="h-1.5 mt-1" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
