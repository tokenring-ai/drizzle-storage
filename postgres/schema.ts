import {bigint as pgBigint, bigserial, pgTable, text as pgText} from "drizzle-orm/pg-core";

export const agentCheckpoints = pgTable("AgentCheckpoints", {
  id: bigserial("id", {mode: "number"}).primaryKey(),
  sessionId: pgText("sessionId").notNull(),
  agentId: pgText("agentId").notNull(),
  name: pgText("name").notNull(),
  agentType: pgText("agentType").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", {mode: "number"}).notNull(),
});

export const appCheckpoints = pgTable("AppCheckpoints", {
  id: bigserial("id", {mode: "number"}).primaryKey(),
  sessionId: pgText("sessionId").notNull(),
  hostname: pgText("hostname").notNull(),
  workingDirectory: pgText("workingDirectory").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", {mode: "number"}).notNull(),
});
