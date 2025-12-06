import {bigint, mysqlTable, text as mysqlText} from "drizzle-orm/mysql-core";

export const agentState = mysqlTable("AgentState", {
  id: bigint("id", {mode: "number"}).primaryKey().autoincrement(),
  agentId: mysqlText("agentId").notNull(),
  name: mysqlText("name").notNull(),
  config: mysqlText("config").notNull(),
  state: mysqlText("state").notNull(),
  createdAt: bigint("createdAt", {mode: "number"}).notNull(),
});