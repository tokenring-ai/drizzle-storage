import {
  AgentCheckpointListItem, AgentCheckpointProvider,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint
} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import Database from "bun:sqlite";
import {desc, eq} from "drizzle-orm";
import {drizzle as drizzleSqlite} from "drizzle-orm/bun-sqlite";
import {migrate as migrateSqlite} from "drizzle-orm/bun-sqlite/migrator";
import {join} from "path";
import {z} from "zod";
import {agentState} from "./schema.js";

export const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
});

export function createSQLiteStorage(config: z.infer<typeof sqliteStorageConfigSchema>) : AgentCheckpointProvider {
  const sqlite = new Database(config.databasePath);
  const db = drizzleSqlite(sqlite);
  migrateSqlite(db, {migrationsFolder: join(import.meta.dirname, "migrations")});

  return {
    async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string> {

      const result = await db
        .insert(agentState)
        .values({
          agentId: checkpoint.agentId,
          name: checkpoint.name,
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
