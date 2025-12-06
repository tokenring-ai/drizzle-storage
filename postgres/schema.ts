import {bigint as pgBigint, bigserial, pgTable, text as pgText} from "drizzle-orm/pg-core";

export const agentState = pgTable("AgentState", {
  id: bigserial("id", {mode: "number"}).primaryKey(),
  agentId: pgText("agentId").notNull(),
  name: pgText("name").notNull(),
  config: pgText("config").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", {mode: "number"}).notNull(),
});
