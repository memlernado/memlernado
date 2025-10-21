import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import SprintBoard from "@/pages/sprint-board";
import Dashboard from "@/pages/dashboard";
import SprintPlanning from "@/pages/sprint-planning";
import Learners from "@/pages/learners";
import WorkspaceSettings from "@/pages/workspace-settings";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/sprint-board" component={SprintBoard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/sprint-planning" component={SprintPlanning} allowedRoles={["facilitator"]} />
      <ProtectedRoute path="/learners" component={Learners} allowedRoles={["facilitator"]} />
      <ProtectedRoute path="/settings" component={WorkspaceSettings} allowedRoles={["facilitator"]} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
