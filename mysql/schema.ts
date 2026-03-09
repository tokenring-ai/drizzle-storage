import {bigint, mysqlTable, text as mysqlText} from "drizzle-orm/mysql-core";

export const agentCheckpoints = mysqlTable("AgentCheckpoints", {
  id: bigint("id", {mode: "number"}).primaryKey().autoincrement(),
  sessionId: mysqlText("sessionId").notNull(),
  agentId: mysqlText("agentId").notNull(),
  name: mysqlText("name").notNull(),
  agentType: mysqlText("agentType").notNull(),
  state: mysqlText("state").notNull(),
  createdAt: bigint("createdAt", {mode: "number"}).notNull(),
});

export const appCheckpoints = mysqlTable("AppCheckpoints", {
  id: bigint("id", {mode: "number"}).primaryKey().autoincrement(),
  sessionId: mysqlText("sessionId").notNull(),
  hostname: mysqlText("hostname").notNull(),
  workingDirectory: mysqlText("workingDirectory").notNull(),
  state: mysqlText("state").notNull(),
  createdAt: bigint("createdAt", {mode: "number"}).notNull(),
});
