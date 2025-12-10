import {
  AgentCheckpointListItem,
  AgentCheckpointProvider,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint
} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import {desc, eq} from "drizzle-orm";
import {drizzle as drizzlePostgres} from "drizzle-orm/postgres-js";
import {migrate as migratePostgres} from "drizzle-orm/postgres-js/migrator";
import {join} from "path";
import postgres from "postgres";
import {z} from "zod";
import {agentState} from "./schema.js";

export const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});

export function createPostgresStorage(config: z.infer<typeof postgresStorageConfigSchema>): AgentCheckpointProvider {
  const connection = postgres(config.connectionString);
  const db = drizzlePostgres(connection);

  return {
    async start() {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "AgentState" (
         "id" bigserial PRIMARY KEY NOT NULL,
         "agentId"   text   NOT NULL,
         "name"      text   NOT NULL,
         "config"    text   NOT NULL,
         "state"     text   NOT NULL,
         "createdAt" bigint NOT NULL
        );
     `);
      //TODO: Migrations do not work well due to bun packaging. We should fix this.
      //migratePostgres(db, {migrationsFolder: join(import.meta.dirname, "migrations")});

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
