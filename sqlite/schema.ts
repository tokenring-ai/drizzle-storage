import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentCheckpoints = sqliteTable("AgentCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  agentType: text("agentType").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const appCheckpoints = sqliteTable("AppCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  hostname: text("hostname").notNull(),
  projectDirectory: text("projectDirectory").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});
