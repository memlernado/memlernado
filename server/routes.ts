import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertWorkspaceSchema, insertSprintSchema, insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Workspace routes
  app.get("/api/workspaces", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const workspaces = await storage.getUserWorkspaces(req.user!.id);
      
      // Enrich workspaces with statistics
      const enrichedWorkspaces = await Promise.all(
        workspaces.map(async (workspace) => {
          const members = await storage.getWorkspaceMembers(workspace.id);
          const learners = members.filter(member => member.user.role === 'learner');
          const sprints = await storage.getWorkspaceSprints(workspace.id);
          const activeSprints = sprints.filter(sprint => sprint.isActive);
          
          return {
            ...workspace,
            learnerCount: learners.length,
            activeSprintCount: activeSprints.length,
          };
        })
      );
      
      res.json(enrichedWorkspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can create workspaces
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can create workspaces" });
    }

    try {
      const workspaceData = insertWorkspaceSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });

      const workspace = await storage.createWorkspace(workspaceData);
      
      // Add creator as facilitator
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: req.user!.id,
        role: "facilitator",
      });

      res.status(201).json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(400).json({ message: "Failed to create workspace" });
    }
  });

  app.patch("/api/workspaces/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can update workspaces
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can update workspaces" });
    }

    try {
      const workspace = await storage.updateWorkspace(req.params.id, req.body);
      res.json(workspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(400).json({ message: "Failed to update workspace" });
    }
  });

  app.get("/api/workspaces/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const members = await storage.getWorkspaceMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      res.status(500).json({ message: "Failed to fetch workspace members" });
    }
  });

  app.post("/api/workspaces/:id/members", async (req, res) => {
    console.log("Adding workspace member:", req.body);
    if (!req.isAuthenticated()) {
      console.log("Unauthorized");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can add members
    if (req.user!.role !== 'facilitator') {
      console.log("Not a facilitator");
      return res.status(403).json({ message: "Only facilitators can add members" });
    }

    try {
      console.log("Trying to add workspace member with email:", req.body.email);
      const { email } = req.body;
      
      if (!email) {
        console.log("Email is required");
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      console.log("Finding user by email:", email);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Check if user is already a member
      console.log("Checking if user is already a member of the workspace");
      const isAlreadyMember = await storage.isWorkspaceMember(req.params.id, user.id);
      if (isAlreadyMember) {
        console.log("User is already a member of the workspace");
        return res.status(409).json({ message: "User is already a member of this workspace" });
      }

      // Add user as a learner to the workspace
      const member = await storage.addWorkspaceMember({
        workspaceId: req.params.id,
        userId: user.id,
        role: "learner",
      });

      
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding workspace member:", error);
      res.status(500).json({ message: "Failed to add workspace member" });
    }
  });

  // Sprint routes
  app.get("/api/workspaces/:workspaceId/sprints", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const sprints = await storage.getWorkspaceSprints(req.params.workspaceId);
      res.json(sprints);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      res.status(500).json({ message: "Failed to fetch sprints" });
    }
  });

  app.get("/api/workspaces/:workspaceId/sprints/active", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const sprint = await storage.getActiveSprint(req.params.workspaceId);
      res.json(sprint);
    } catch (error) {
      console.error("Error fetching active sprint:", error);
      res.status(500).json({ message: "Failed to fetch active sprint" });
    }
  });

  app.post("/api/sprints", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can create sprints
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can create sprints" });
    }

    try {
      const parsed = insertSprintSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });

      // Convert string dates to Date objects for database storage
      const sprintData = {
        ...parsed,
        startDate: typeof parsed.startDate === 'string' ? new Date(parsed.startDate) : parsed.startDate,
        endDate: typeof parsed.endDate === 'string' ? new Date(parsed.endDate) : parsed.endDate,
      };

      const sprint = await storage.createSprint(sprintData);
      res.status(201).json(sprint);
    } catch (error) {
      console.error("Error creating sprint:", error);
      res.status(400).json({ message: "Failed to create sprint", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/sprints/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can update sprints
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can update sprints" });
    }

    try {
      const sprint = await storage.updateSprint(req.params.id, req.body);
      res.json(sprint);
    } catch (error) {
      console.error("Error updating sprint:", error);
      res.status(400).json({ message: "Failed to update sprint" });
    }
  });

  // Task routes
  app.get("/api/sprints/:sprintId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const tasks = await storage.getSprintTasks(req.params.sprintId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching sprint tasks:", error);
      res.status(500).json({ message: "Failed to fetch sprint tasks" });
    }
  });

  app.get("/api/workspaces/:workspaceId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const tasks = await storage.getWorkspaceTasks(req.params.workspaceId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching workspace tasks:", error);
      res.status(500).json({ message: "Failed to fetch workspace tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can create tasks
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can create tasks" });
    }

    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error?.message || String(error));
      res.status(400).json({ message: "Failed to create task", error: error?.message || String(error) });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Failed to update task", error: error?.message || String(error) });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only facilitators can delete tasks
    if (req.user!.role !== 'facilitator') {
      return res.status(403).json({ message: "Only facilitators can delete tasks" });
    }

    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(400).json({ message: "Failed to delete task" });
    }
  });

  // Global dashboard analytics route
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user!.id;
      
      // Get all user workspaces
      const userWorkspaces = await storage.getUserWorkspaces(userId);
      
      let totalTasks = 0;
      let completedTasks = 0;
      let totalSprints = 0;
      let activeSprints = 0;
      const uniqueLearnerIds = new Set<string>();
      
      // Aggregate statistics across all workspaces
      for (const workspace of userWorkspaces) {
        // Get workspace tasks
        const workspaceTasks = await storage.getWorkspaceTasks(workspace.id);
        totalTasks += workspaceTasks.length;
        completedTasks += workspaceTasks.filter(task => task.status === 'done').length;
        
        // Get workspace sprints
        const workspaceSprints = await storage.getWorkspaceSprints(workspace.id);
        totalSprints += workspaceSprints.length;
        
        // Get active sprint
        const activeSprint = await storage.getActiveSprint(workspace.id);
        if (activeSprint) {
          activeSprints += 1;
        }
        
        // Get workspace members (learners only) and deduplicate by ID
        const members = await storage.getWorkspaceMembers(workspace.id);
        const learners = members.filter(member => member.user.role === 'learner');
        learners.forEach(learner => uniqueLearnerIds.add(learner.userId));
      }
      
      const totalLearners = uniqueLearnerIds.size;
      
      const globalStats = {
        totalTasks,
        completedTasks,
        totalSprints,
        activeSprints,
        totalLearners,
        weeklyHours: 0, // TODO: Implement time tracking
      };
      
      res.json(globalStats);
    } catch (error) {
      console.error("Error fetching global dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Dashboard analytics routes
  app.get("/api/workspaces/:workspaceId/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const workspaceId = req.params.workspaceId;
      
      // Get all tasks for the workspace
      const allTasks = await storage.getWorkspaceTasks(workspaceId);
      
      // Get active sprint
      const activeSprint = await storage.getActiveSprint(workspaceId);
      
      // Calculate task statistics
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(task => task.status === 'done').length;
      const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;
      const todoTasks = allTasks.filter(task => task.status === 'todo').length;
      
      // Get workspace members (learners)
      const members = await storage.getWorkspaceMembers(workspaceId);
      const learners = members.filter(member => member.user.role === 'learner');
      
      // Calculate learner progress
      const learnerProgress = learners.map(member => {
        const userTasks = allTasks.filter(task => task.assignedTo === member.userId);
        const userCompletedTasks = userTasks.filter(task => task.status === 'done').length;
        const completionRate = userTasks.length > 0 ? Math.round((userCompletedTasks / userTasks.length) * 100) : 0;
        
        // Group tasks by subject
        const subjectStats: Record<string, {completed: number, total: number, rate: number}> = {};
        userTasks.forEach(task => {
          if (task.subject) {
            if (!subjectStats[task.subject]) {
              subjectStats[task.subject] = { completed: 0, total: 0, rate: 0 };
            }
            subjectStats[task.subject].total++;
            if (task.status === 'done') {
              subjectStats[task.subject].completed++;
            }
          }
        });
        
        // Calculate completion rates for each subject
        Object.keys(subjectStats).forEach(subject => {
          const stats = subjectStats[subject];
          stats.rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        });
        
        return {
          id: member.userId,
          name: `${member.user.firstName} ${member.user.lastName}`,
          initials: `${member.user.firstName[0]}${member.user.lastName[0]}`,
          completionRate,
          tasksCompleted: userCompletedTasks,
          totalTasks: userTasks.length,
          subjects: subjectStats,
        };
      });
      
      const dashboardData = {
        sprintStats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          activeSprint: activeSprint ? {
            id: activeSprint.id,
            name: activeSprint.name,
            description: activeSprint.description,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
          } : null,
        },
        learners: learnerProgress,
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
