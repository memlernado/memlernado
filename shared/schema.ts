import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'facilitator' or 'learner'
  language: text("language").notNull().default("en"), // 'en', 'es', 'pl'
  timezone: text("timezone"), // for future use
  createdAt: timestamp("created_at").defaultNow(),
});

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workspace members table
export const workspaceMembers = pgTable("workspace_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'facilitator' or 'learner'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Sprints table
export const sprints = pgTable("sprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'completed'
  isActive: boolean("is_active").default(false), // kept for backwards compatibility
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subject: varchar("subject").references(() => subjects.id, { onDelete: "restrict" }), // References subjects table
  status: text("status").notNull().default("todo"), // 'todo', 'in_progress', 'done'
  estimatedTime: text("estimated_time"), // e.g., "30min", "1h"
  timeSpent: text("time_spent"), // e.g., "25min"
  progress: integer("progress").default(0), // 0-100
  sprintId: varchar("sprint_id").references(() => sprints.id),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  assignedTo: varchar("assigned_to").references(() => users.id), // learner
  createdBy: varchar("created_by").notNull().references(() => users.id), // facilitator
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenHash: text("token_hash").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workspace invitations table
export const workspaceInvitations = pgTable("workspace_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  email: text("email").notNull(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdWorkspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  createdSprints: many(sprints),
  passwordResetTokens: many(passwordResetTokens),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  creator: one(users, {
    fields: [workspaces.createdBy],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  sprints: many(sprints),
  tasks: many(tasks),
  subjects: many(subjects),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sprints.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [sprints.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  sprint: one(sprints, {
    fields: [tasks.sprintId],
    references: [sprints.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
}));

export const subjectsRelations = relations(subjects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subjects.workspaceId],
    references: [workspaces.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const workspaceInvitationsRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvitations.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [workspaceInvitations.invitedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceInvitationSchema = createInsertSchema(workspaceInvitations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;

export type SprintWithStats = Sprint & {
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
  };
};

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type InsertWorkspaceInvitation = z.infer<typeof insertWorkspaceInvitationSchema>;

// Extended types for enriched data
export type TaskWithRelations = Task & { 
  assignee?: User; 
  creator: User; 
};

export type WorkspaceMemberWithUser = WorkspaceMember & { 
  user: User; 
};

export type WorkspaceInvitationWithRelations = WorkspaceInvitation & {
  workspace: Workspace;
  inviter: User;
};

export type WorkspaceWithStats = Workspace & {
  learnerCount: number;
  activeSprintCount: number;
};

// Dashboard types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalSprints: number;
  activeSprints: number;
  totalLearners: number;
  weeklyHours: number;
}

export interface DashboardData {
  sprintStats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    activeSprint: {
      id: string;
      name: string;
      description: string;
      startDate: Date;
      endDate: Date;
    } | null;
  };
  learners: Array<{
    id: string;
    name: string;
    initials: string;
    completionRate: number;
    tasksCompleted: number;
    totalTasks: number;
    subjects: Record<string, { completed: number; total: number; rate: number }>;
  }>;
}

// Auth types
export type LoginData = Pick<InsertUser, "username" | "password">;

// Component prop types
export interface WorkspaceContextType {
  selectedWorkspaceId: string | null;
  selectedWorkspace: Workspace | null;
  workspaces: Workspace[];
  setSelectedWorkspaceId: (id: string) => void;
  isLoading: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any; // UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: any; // UseMutationResult<void, Error, void>;
  registerMutation: any; // UseMutationResult<SelectUser, Error, InsertUser>;
}
