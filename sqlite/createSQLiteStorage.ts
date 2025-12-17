import {
  AgentCheckpointListItem,
  AgentCheckpointProvider,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint
} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import Database from "bun:sqlite";
import {desc, eq} from "drizzle-orm";
import {drizzle as drizzleSqlite} from "drizzle-orm/bun-sqlite";
import {z} from "zod";
import {agentState} from "./schema.js";

export const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().optional(),
});

export function createSQLiteStorage(config: z.infer<typeof sqliteStorageConfigSchema>): AgentCheckpointProvider {
  const sqlite = new Database(config.databasePath);
  const db = drizzleSqlite(sqlite);


  return {
    async start() {
      await db.run(`
        CREATE TABLE IF NOT EXISTS \`AgentState\` (
            \`id\`        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            \`agentId\`   text                              NOT NULL,
            \`config\`    text                              NOT NULL,
            \`name\`      text                              NOT NULL,
            \`state\`     text                              NOT NULL,
            \`createdAt\` integer                           NOT NULL
        );
    `)
      //TODO: Migrations do not work well due to bun packaging. We should fix this.
      //migrateSqlite(db, {migrationsFolder: join(import.meta.dirname, "migrations"), });
    },
    async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string> {

      const result = await db
        .insert(agentState)
        .values({
          agentId: checkpoint.agentId,
          name: checkpoint.name,
          config: JSON.stringify(checkpoint.config),
          state: JSON.stringify(checkpoint.state),
          createdAt: checkpoint.createdAt,
        })
        .returning({id: agentState.id});
      return result[0].id.toString();
    },

    async retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
      let result = await db.select()
        .from(agentState)
        .where(eq(agentState.id, Number(id)))
        .limit(1);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        id: row.id.toString(),
        name: row.name,
        agentId: row.agentId,
        config: JSON.parse(row.config),
        state: JSON.parse(row.state),
        createdAt: Number(row.createdAt),
      };
    },

    async listCheckpoints(): Promise<AgentCheckpointListItem[]> {
      let result = await db.select({
        id: agentState.id,
        name: agentState.name,
        agentId: agentState.agentId,
        createdAt: agentState.createdAt,
      })
        .from(agentState)
        .orderBy(desc(agentState.createdAt));

      return result.map(row => ({
        id: row.id.toString(),
        name: row.name,
        agentId: row.agentId,
        createdAt: Number(row.createdAt),
      }));
    }
  }
}
