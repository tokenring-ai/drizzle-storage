import type { AppSessionCheckpoint } from "@tokenring-ai/app/schema";
import type { TokenRingService } from "@tokenring-ai/app/types";
import {
  type AgentCheckpointListItem,
  AgentCheckpointListItemSchema,
  type AgentCheckpointStorage,
  type NamedAgentCheckpoint,
  type StoredAgentCheckpoint,
  StoredAgentCheckpointSchema,
} from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import {
  AppCheckpointListItemSchema,
  type AppCheckpointStorage,
  type AppSessionListItem,
  type StoredAppCheckpoint,
  StoredAppCheckpointSchema,
} from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import { desc, eq } from "drizzle-orm";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { agentCheckpoints, appCheckpoints } from "./schema.ts";

export const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});

export class PostgresStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name = "PostgresStorage";
  description = "PostgreSQL storage provider";

  connection: postgres.Sql;
  db: ReturnType<typeof drizzlePostgres>;
  displayName: string;

  constructor(readonly config: z.infer<typeof postgresStorageConfigSchema>) {
    const url = new URL(config.connectionString);
    url.password = "***";

    this.connection = postgres(config.connectionString);
    this.db = drizzlePostgres(this.connection);

    this.displayName = `Postgres (${url.toString()})`;
  }

  async start() {
    await this.db.execute(`
     CREATE TABLE IF NOT EXISTS "AgentCheckpoints"
     (
      "id"
      bigserial
      PRIMARY
      KEY
      NOT
      NULL,
      "sessionId"
      text
      NOT
      NULL,
      "agentId"
      text
      NOT
      NULL,
      "name"
      text
      NOT
      NULL,
      "agentType"
      text
      NOT
      NULL,
      "state"
      text
      NOT
      NULL,
      "createdAt"
      bigint
      NOT
      NULL
     );
    `);

    await this.db.execute(`
     CREATE TABLE IF NOT EXISTS "AppCheckpoints"
     (
      "id"
      bigserial
      PRIMARY
      KEY
      NOT
      NULL,
      "sessionId"
      text
      NOT
      NULL,
      "hostname"
      text
      NOT
      NULL,
      "projectDirectory"
      text
      NOT
      NULL,
      "state"
      text
      NOT
      NULL,
      "createdAt"
      bigint
      NOT
      NULL
     );
    `);

    //TODO: Migrations do not work well due to bun packaging. We should fix this.
    //migratePostgres(db, {migrationsFolder: join(import.meta.dirname, "migrations")});
  }

  async storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<number> {
    const result = await this.db
      .insert(agentCheckpoints)
      .values({
        agentId: checkpoint.agentId,
        sessionId: checkpoint.sessionId,
        name: checkpoint.name,
        agentType: checkpoint.agentType,
        state: JSON.stringify(checkpoint.state),
        createdAt: checkpoint.createdAt,
      })
      .returning({ id: agentCheckpoints.id });
    if (!result[0]) {
      throw new Error("No data returned from database");
    }

    return StoredAgentCheckpointSchema.shape.id.parse(result[0].id);
  }

  async retrieveAgentCheckpoint(id: number): Promise<StoredAgentCheckpoint | null> {
    const result = await this.db.select().from(agentCheckpoints).where(eq(agentCheckpoints.id, id)).limit(1);

    if (result.length === 0) return null;

    return StoredAgentCheckpointSchema.parse(result[0]);
  }

  async listAgentCheckpoints(): Promise<AgentCheckpointListItem[]> {
    const result = await this.db
      .select({
        id: agentCheckpoints.id,
        sessionId: agentCheckpoints.sessionId,
        name: agentCheckpoints.name,
        agentId: agentCheckpoints.agentId,
        agentType: agentCheckpoints.agentType,
        createdAt: agentCheckpoints.createdAt,
      })
      .from(agentCheckpoints)
      .orderBy(desc(agentCheckpoints.createdAt));

    return result.map(row => AgentCheckpointListItemSchema.parse(row));
  }

  async storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<number> {
    const result = await this.db
      .insert(appCheckpoints)
      .values({
        sessionId: checkpoint.sessionId,
        hostname: checkpoint.hostname,
        projectDirectory: checkpoint.projectDirectory,
        state: JSON.stringify(checkpoint.state),
        createdAt: checkpoint.createdAt,
      })
      .returning({ id: appCheckpoints.id });

    if (!result[0]) {
      throw new Error("No data returned from database");
    }

    return StoredAgentCheckpointSchema.shape.id.parse(result[0].id);
  }

  async retrieveAppCheckpoint(id: number): Promise<StoredAppCheckpoint | null> {
    const result = await this.db.select().from(appCheckpoints).where(eq(appCheckpoints.id, id)).limit(1);

    if (result.length === 0) return null;

    return StoredAppCheckpointSchema.parse(result[0]);
  }

  async listAppCheckpoints(): Promise<AppSessionListItem[]> {
    const result = await this.db
      .select({
        id: appCheckpoints.id,
        sessionId: appCheckpoints.sessionId,
        hostname: appCheckpoints.hostname,
        projectDirectory: appCheckpoints.projectDirectory,
        createdAt: appCheckpoints.createdAt,
      })
      .from(appCheckpoints)
      .orderBy(desc(appCheckpoints.createdAt));

    return result.map(row => AppCheckpointListItemSchema.parse(row));
  }

  async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
    const rows = await this.db.select().from(appCheckpoints).orderBy(desc(appCheckpoints.createdAt)).limit(1);
    if (rows.length === 0) return null;
    return StoredAppCheckpointSchema.parse(rows[0]);
  }
}
