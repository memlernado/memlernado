import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Workspace, WorkspaceContextType } from "@shared/schema";
import { useAuth } from "./use-auth";


const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user, // Only fetch workspaces when user is authenticated
  });

  // Reset selected workspace when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedWorkspaceId(null);
    }
  }, [user]);

  // Auto-select first workspace when workspaces load
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        selectedWorkspaceId,
        selectedWorkspace,
        workspaces,
        setSelectedWorkspaceId,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}