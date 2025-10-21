import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CreateWorkspaceModal from "@/components/modals/create-workspace-modal";
import { GraduationCap, Bell, LogOut, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const { selectedWorkspaceId, selectedWorkspace, workspaces, setSelectedWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  
  // Use real workspaces data or show placeholder
  const currentWorkspaces = workspaces.length > 0 ? workspaces : [
    { id: "no-workspace", name: "No workspaces available" }
  ];
  
  const displayWorkspaceId = selectedWorkspaceId || "no-workspace";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleProfileSettings = () => {
    // TODO: Create profile settings page
    alert('Profile settings coming soon!');
  };

  const handleWorkspaceSettings = () => {
    setLocation('/settings');
  };

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Memlernado</h1>
              <p className="text-xs text-muted-foreground">Homeschool SCRUM</p>
            </div>
          </div>

          {/* Workspace Selector */}
          <div className="hidden md:flex items-center space-x-3">
            <Select value={displayWorkspaceId} onValueChange={setSelectedWorkspaceId}>
              <SelectTrigger className="w-[250px]" data-testid="select-workspace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentWorkspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user?.role === 'facilitator' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateWorkspaceModal(true)}
                data-testid="button-create-workspace-nav"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications feature - commented out until implemented */}
            {/* <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                3
              </Badge>
            </Button> */}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleProfileSettings} data-testid="menu-profile">
                  Profile Settings
                </DropdownMenuItem>
                {user?.role === 'facilitator' && (
                  <DropdownMenuItem onClick={handleWorkspaceSettings} data-testid="menu-workspace-settings">
                    Workspace Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive"
                  data-testid="menu-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {user?.role === 'facilitator' && (
        <CreateWorkspaceModal 
          isOpen={showCreateWorkspaceModal}
          onClose={() => setShowCreateWorkspaceModal(false)}
        />
      )}
    </nav>
  );
}
