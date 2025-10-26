import {
  users,
  workspaces,
  workspaceMembers,
  sprints,
  tasks,
  subjects,
  passwordResetTokens,
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
  type TaskWithRelations,
  type WorkspaceMemberWithUser,
  type SprintWithStats,
  type Subject,
  type InsertSubject,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, isNull, or, lt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Workspace operations
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]>;
  isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;

  // Sprint operations
  getSprint(id: string): Promise<Sprint | undefined>;
  getWorkspaceSprints(workspaceId: string): Promise<Sprint[]>;
  getWorkspaceSprintsWithStats(workspaceId: string): Promise<SprintWithStats[]>;
  getActiveSprint(workspaceId: string): Promise<Sprint | undefined>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: string, updates: Partial<InsertSprint>): Promise<Sprint>;
  startSprint(sprintId: string): Promise<Sprint>;
  completeSprint(sprintId: string): Promise<Sprint>;

  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getSprintTasks(sprintId: string): Promise<TaskWithRelations[]>;
  getWorkspaceTasks(workspaceId: string): Promise<TaskWithRelations[]>;
  getBacklogTasks(workspaceId: string): Promise<TaskWithRelations[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Subject operations
  getWorkspaceSubjects(workspaceId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, updates: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  isSubjectUsedByTasks(subjectId: string): Promise<boolean>;

  // Password reset token operations
  createPasswordResetToken(userId: string): Promise<{ token: string; tokenRecord: PasswordResetToken }>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  invalidatePasswordResetToken(tokenId: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;

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

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) {
      throw new Error("User not found");
    }
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

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
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

  async getWorkspaceSprintsWithStats(workspaceId: string): Promise<SprintWithStats[]> {
    // Get all sprints for the workspace, ordered by status then date
    const workspaceSprints = await db
      .select()
      .from(sprints)
      .where(eq(sprints.workspaceId, workspaceId))
      .orderBy(
        // Order: active first, then draft, then completed
        sql`CASE WHEN status = 'active' THEN 1 WHEN status = 'draft' THEN 2 ELSE 3 END`,
        desc(sprints.createdAt)
      );
    
    if (workspaceSprints.length === 0) {
      return [];
    }

    // Get all tasks for the workspace in a single raw query (no user enrichment needed for stats)
    const allTasks = await db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId));
    
    // Group tasks by sprint ID
    const tasksBySprint = new Map<string, Task[]>();
    allTasks.forEach(task => {
      if (task.sprintId) {
        if (!tasksBySprint.has(task.sprintId)) {
          tasksBySprint.set(task.sprintId, []);
        }
        tasksBySprint.get(task.sprintId)!.push(task);
      }
    });
    
    // Calculate statistics for each sprint
    return workspaceSprints.map(sprint => {
      const sprintTasks = tasksBySprint.get(sprint.id) || [];
      const totalTasks = sprintTasks.length;
      const completedTasks = sprintTasks.filter(task => task.status === 'done').length;
      const inProgressTasks = sprintTasks.filter(task => task.status === 'in_progress').length;
      const todoTasks = sprintTasks.filter(task => task.status === 'todo').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...sprint,
        taskStats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          completionRate,
        },
      };
    });
  }

  async getActiveSprint(workspaceId: string): Promise<Sprint | undefined> {
    const [sprint] = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'active')));
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

  async startSprint(sprintId: string): Promise<Sprint> {
    // First, get the sprint to check its workspace
    const sprint = await this.getSprint(sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    // Check if there's already an active sprint in this workspace
    const activeSprint = await this.getActiveSprint(sprint.workspaceId);
    if (activeSprint) {
      throw new Error('There is already an active sprint in this workspace');
    }

    // Update the sprint to active status
    const [updatedSprint] = await db
      .update(sprints)
      .set({ 
        status: 'active',
        isActive: true // keep backwards compatibility
      })
      .where(eq(sprints.id, sprintId))
      .returning();
    
    return updatedSprint;
  }

  async completeSprint(sprintId: string): Promise<Sprint> {
    // Get the sprint
    const sprint = await this.getSprint(sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    if (sprint.status !== 'active') {
      throw new Error('Only active sprints can be completed');
    }

    // Get all incomplete tasks in this sprint
    const incompleteTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.sprintId, sprintId), or(eq(tasks.status, 'todo'), eq(tasks.status, 'in_progress'))));

    // Create copies of incomplete tasks in the backlog (sprintId = NULL)
    for (const task of incompleteTasks) {
      const backlogTask = {
        ...task,
        id: undefined, // let database generate new ID
        sprintId: null,
        status: 'todo' as const,
        progress: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.insert(tasks).values(backlogTask);
    }

    // Update the sprint to completed status
    const [updatedSprint] = await db
      .update(sprints)
      .set({ 
        status: 'completed',
        isActive: false // keep backwards compatibility
      })
      .where(eq(sprints.id, sprintId))
      .returning();
    
    return updatedSprint;
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getSprintTasks(sprintId: string): Promise<TaskWithRelations[]> {
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

  async getWorkspaceTasks(workspaceId: string): Promise<TaskWithRelations[]> {
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

  async getBacklogTasks(workspaceId: string): Promise<TaskWithRelations[]> {
    const taskList = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), isNull(tasks.sprintId)));
    
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

  // Subject operations
  async getWorkspaceSubjects(workspaceId: string): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(eq(subjects.workspaceId, workspaceId))
      .orderBy(subjects.name);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    // Check for duplicate name in workspace
    const existing = await db
      .select()
      .from(subjects)
      .where(and(
        eq(subjects.workspaceId, insertSubject.workspaceId),
        eq(subjects.name, insertSubject.name)
      ))
      .limit(1);
      
    if (existing.length > 0) {
      throw new Error("Subject name already exists in this workspace");
    }
    
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async updateSubject(id: string, updates: Partial<InsertSubject>): Promise<Subject> {
    const [subject] = await db
      .update(subjects)
      .set(updates)
      .where(eq(subjects.id, id))
      .returning();
    if (!subject) {
      throw new Error("Subject not found");
    }
    return subject;
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async isSubjectUsedByTasks(subjectId: string): Promise<boolean> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.subject, subjectId))
      .limit(1);
    return !!task;
  }

  // Password reset token operations
  async createPasswordResetToken(userId: string): Promise<{ token: string; tokenRecord: PasswordResetToken }> {
    const scryptAsync = promisify(scrypt);
    
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const salt = randomBytes(16).toString('hex');
    const hashedToken = (await scryptAsync(token, salt, 64)) as Buffer;
    const tokenHash = `${hashedToken.toString('hex')}.${salt}`;
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Invalidate any existing tokens for this user
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.used, false)
      ));
    
    // Create new token
    const [tokenRecord] = await db.insert(passwordResetTokens).values({
      tokenHash,
      userId,
      expiresAt,
      used: false,
    }).returning();
    
    return { token, tokenRecord };
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const scryptAsync = promisify(scrypt);
    
    // Get all tokens that haven't been used and haven't expired
    const tokens = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`
      ));
    
    // Check each token to see if it matches
    for (const tokenRecord of tokens) {
      const [hashed, salt] = tokenRecord.tokenHash.split('.');
      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = (await scryptAsync(token, salt, 64)) as Buffer;
      
      if (timingSafeEqual(hashedBuf, suppliedBuf)) {
        return tokenRecord;
      }
    }
    
    return undefined;
  }

  async invalidatePasswordResetToken(tokenId: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
