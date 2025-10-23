import {
  AgentCheckpointListItem, AgentCheckpointProvider,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint
} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import {desc, eq} from "drizzle-orm";
import {drizzle as drizzleMysql} from "drizzle-orm/mysql2";
import {migrate as migrateMysql} from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import {join} from "path";
import {z} from "zod";
import {agentState} from "./schema.js";

export const mysqlStorageConfigSchema = z.object({
  type: z.literal("mysql"),
  connectionString: z.string(),
});

export function createMySQLStorage(config: z.infer<typeof mysqlStorageConfigSchema>) : AgentCheckpointProvider {
  const connection = mysql.createPool(config.connectionString);
  const db = drizzleMysql(connection);
  migrateMysql(db, {migrationsFolder: join(import.meta.dirname, "migrations")});

  return {
    async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string> {
      const result = await db
        .insert(agentState)
        .values({
          agentId: checkpoint.agentId,
          name: checkpoint.name,
          state: JSON.stringify(checkpoint.state),
          createdAt: checkpoint.createdAt,
        });
      return result[0].insertId.toString();
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
