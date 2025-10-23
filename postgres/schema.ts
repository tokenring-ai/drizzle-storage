import { bigserial, pgTable, text as pgText, bigint as pgBigint } from "drizzle-orm/pg-core";

export const agentState = pgTable("AgentState", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  agentId: pgText("agentId").notNull(),
  name: pgText("name").notNull(),
  state: pgText("state").notNull(),
  createdAt: pgBigint("createdAt", { mode: "number" }).notNull(),
});
