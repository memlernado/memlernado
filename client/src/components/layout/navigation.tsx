import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CreateWorkspaceModal from "@/components/modals/create-workspace-modal";
import LanguageSelector from "@/components/language-selector";
import { GraduationCap, LogOut, Plus, Menu, BarChart3, LayoutGrid, Calendar, Users, Settings, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navigation() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { selectedWorkspaceId, workspaces, setSelectedWorkspaceId } = useWorkspace();
  const [, setLocation] = useLocation();
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  
  // Use real workspaces data or show placeholder
  const currentWorkspaces = workspaces.length > 0 ? workspaces : [
    { id: "no-workspace", name: "No workspaces available" }
  ];
  
  const displayWorkspaceId = selectedWorkspaceId || "no-workspace";

  // Navigation items for mobile menu
  const allNavigationItems = [
    {
      name: t('navigation.dashboard'), 
      href: "/dashboard",
      icon: BarChart3,
      roles: ["facilitator", "learner"],
    },
    {
      name: t('navigation.backlog'),
      href: "/backlog",
      icon: Archive,
      roles: ["facilitator"],
    },
    {
      name: t('navigation.sprintBoard'),
      href: "/sprint-board",
      icon: LayoutGrid,
      roles: ["facilitator", "learner"],
    },
    {
      name: t('navigation.sprintPlanning'),
      href: "/sprint-planning", 
      icon: Calendar,
      roles: ["facilitator"],
    },
    {
      name: t('navigation.learners'),
      href: "/learners",
      icon: Users,
      roles: ["facilitator"],
    },
    {
      name: t('navigation.settings'),
      href: "/settings",
      icon: Settings,
      roles: ["facilitator"],
    },
  ];

  // Filter navigation items based on user role
  const navigation = allNavigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

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
      <div className="mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap sm:flex-nowrap">
          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-primary">{t('navigation.brand')}</h1>
                      <p className="text-xs text-muted-foreground">{t('navigation.tagline')}</p>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Workspace Selector for Mobile */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {t('navigation.currentWorkspace')}
                    </label>
                    <Select value={displayWorkspaceId} onValueChange={setSelectedWorkspaceId} className="mt-2">
                      <SelectTrigger data-testid="select-workspace-mobile">
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
                        data-testid="button-create-workspace-mobile"
                        className="w-full mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('navigation.createWorkspace')}
                      </Button>
                    )}
                  </div>

                  {/* Navigation Menu */}
                  <nav className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setLocation(item.href)}
                          data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Button>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="bg-primary text-primary-foreground p-1 sm:p-2 rounded-lg">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-primary">{t('navigation.brand')}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{t('navigation.tagline')}</p>
            </div>
          </div>

          {/* Workspace Selector - Desktop Only */}
          <div className="hidden lg:flex items-center space-x-3">
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
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8 sm:h-8 sm:w-8">
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
                  {t('navigation.profileSettings')}
                </DropdownMenuItem>
                {user?.role === 'facilitator' && (
                  <DropdownMenuItem onClick={handleWorkspaceSettings} data-testid="menu-workspace-settings">
                    {t('navigation.workspaceSettings')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive"
                  data-testid="menu-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('common.buttons.signOut')}
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
