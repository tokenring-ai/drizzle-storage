import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("AgentState", {
  id: integer("id").primaryKey({autoIncrement: true}),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});