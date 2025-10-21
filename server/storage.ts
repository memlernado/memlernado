import {
  users,
  workspaces,
  workspaceMembers,
  sprints,
  tasks,
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type WorkspaceMember,
  type InsertWorkspaceMember,
  type Sprint,
  type InsertSprint,
  type Task,
  type InsertTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workspace operations
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user: User })[]>;
  isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;

  // Sprint operations
  getSprint(id: string): Promise<Sprint | undefined>;
  getWorkspaceSprints(workspaceId: string): Promise<Sprint[]>;
  getActiveSprint(workspaceId: string): Promise<Sprint | undefined>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: string, updates: Partial<InsertSprint>): Promise<Sprint>;

  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getSprintTasks(sprintId: string): Promise<(Task & { assignee?: User; creator: User })[]>;
  getWorkspaceTasks(workspaceId: string): Promise<(Task & { assignee?: User; creator: User })[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      pruneSessionInterval: 60, // Prune expired sessions every 60 seconds
      errorLog: console.error,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Workspace operations
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const userWorkspaces = await db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));
    
    return userWorkspaces.map(uw => uw.workspace);
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(insertWorkspace).returning();
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace> {
    const [workspace] = await db.update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [workspaceMember] = await db.insert(workspaceMembers).values(member).returning();
    return workspaceMember;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { user: User })[]> {
    const members = await db
      .select()
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    
    return members.map(m => ({
      ...m.workspace_members,
      user: m.users,
    }));
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
    
    return !!member;
  }

  // Sprint operations
  async getSprint(id: string): Promise<Sprint | undefined> {
    const [sprint] = await db.select().from(sprints).where(eq(sprints.id, id));
    return sprint;
  }

  async getWorkspaceSprints(workspaceId: string): Promise<Sprint[]> {
    return await db
      .select()
      .from(sprints)
      .where(eq(sprints.workspaceId, workspaceId))
      .orderBy(desc(sprints.createdAt));
  }

  async getActiveSprint(workspaceId: string): Promise<Sprint | undefined> {
    const [sprint] = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.isActive, true)));
    return sprint;
  }

  async createSprint(insertSprint: InsertSprint): Promise<Sprint> {
    const sprintData = {
      ...insertSprint,
      startDate: new Date(insertSprint.startDate),
      endDate: new Date(insertSprint.endDate),
    };
    const [sprint] = await db.insert(sprints).values(sprintData).returning();
    return sprint;
  }

  async updateSprint(id: string, updates: Partial<InsertSprint>): Promise<Sprint> {
    const updateData: Partial<InsertSprint & { startDate?: Date; endDate?: Date }> = { ...updates,
      startDate: updates.startDate ? new Date(updates.startDate) : undefined,
      endDate: updates.endDate ? new Date(updates.endDate) : undefined,
     };
    
    const [sprint] = await db
      .update(sprints)
      .set(updateData)
      .where(eq(sprints.id, id))
      .returning();
    return sprint;
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getSprintTasks(sprintId: string): Promise<(Task & { assignee?: User; creator: User })[]> {
    const taskList = await db.select().from(tasks).where(eq(tasks.sprintId, sprintId));
    
    const enrichedTasks = [];
    for (const task of taskList) {
      const creator = await this.getUser(task.createdBy);
      const assignee = task.assignedTo ? await this.getUser(task.assignedTo) : undefined;
      
      enrichedTasks.push({
        ...task,
        creator: creator!,
        assignee,
      });
    }
    
    return enrichedTasks;
  }

  async getWorkspaceTasks(workspaceId: string): Promise<(Task & { assignee?: User; creator: User })[]> {
    const taskList = await db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId));
    
    const enrichedTasks = [];
    for (const task of taskList) {
      const creator = await this.getUser(task.createdBy);
      const assignee = task.assignedTo ? await this.getUser(task.assignedTo) : undefined;
      
      enrichedTasks.push({
        ...task,
        creator: creator!,
        assignee,
      });
    }
    
    return enrichedTasks;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
      ...(updates.status === 'done' ? { completedAt: new Date() } : {}),
    };
    
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
