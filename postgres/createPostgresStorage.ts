import type {AppSessionCheckpoint, TokenRingService,} from "@tokenring-ai/app/types";
import type {
  AgentCheckpointListItem,
  AgentCheckpointStorage,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
} from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type {AppCheckpointStorage, AppSessionListItem, StoredAppCheckpoint,} from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import {desc, eq} from "drizzle-orm";
import {drizzle as drizzlePostgres} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {z} from "zod";
import {agentCheckpoints, appCheckpoints} from "./schema.ts";

export const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});

export class PostgresStorage
  implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name = "PostgresStorage";
  description = "PostgreSQL storage provider";

  connection: postgres.Sql;
  db: ReturnType<typeof drizzlePostgres>;
  displayName: string;

  constructor(
    readonly config: z.infer<typeof postgresStorageConfigSchema>,
  ) {
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
            "id"        bigserial PRIMARY KEY NOT NULL,
            "sessionId" text                  NOT NULL,
            "agentId"   text                  NOT NULL,
            "name"      text                  NOT NULL,
            "agentType" text                  NOT NULL,
            "config"    text                  NOT NULL,
            "state"     text                  NOT NULL,
            "createdAt" bigint                NOT NULL
        );
    `);
    //TODO: Migrations do not work well due to bun packaging. We should fix this.
    //migratePostgres(db, {migrationsFolder: join(import.meta.dirname, "migrations")});
  }

  async storeAgentCheckpoint(
    checkpoint: NamedAgentCheckpoint,
  ): Promise<string> {
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
      .returning({id: agentCheckpoints.id});
    return result[0].id.toString();
  }

  async retrieveAgentCheckpoint(
    id: string,
  ): Promise<StoredAgentCheckpoint | null> {
    const result = await this.db
      .select()
      .from(agentCheckpoints)
      .where(eq(agentCheckpoints.id, Number(id)))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id.toString(),
      sessionId: row.sessionId,
      name: row.name,
      agentId: row.agentId,
      agentType: row.agentType,
      state: JSON.parse(row.state),
      createdAt: Number(row.createdAt),
    };
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

    return result.map((row) => ({
      id: row.id.toString(),
      sessionId: row.sessionId,
      name: row.name,
      agentId: row.agentId,
      agentType: row.agentType,
      createdAt: Number(row.createdAt),
    }));
  }

  async storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string> {
    const result = await this.db
      .insert(appCheckpoints)
      .values({
        sessionId: checkpoint.sessionId,
        hostname: checkpoint.hostname,
        projectDirectory: checkpoint.projectDirectory,
        state: JSON.stringify(checkpoint.state),
        createdAt: checkpoint.createdAt,
      })
      .returning({id: appCheckpoints.id});
    return result[0].id.toString();
  }

  async retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null> {
    const result = await this.db
      .select()
      .from(appCheckpoints)
      .where(eq(appCheckpoints.id, Number(id)))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id.toString(),
      sessionId: row.sessionId,
      hostname: row.hostname,
      projectDirectory: row.projectDirectory,
      state: JSON.parse(row.state),
      createdAt: Number(row.createdAt),
    };
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

    return result.map((row) => ({
      id: row.id.toString(),
      sessionId: row.sessionId,
      hostname: row.hostname,
      projectDirectory: row.projectDirectory,
      createdAt: Number(row.createdAt),
    }));
  }

  async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
    const rows = await this.db
      .select()
      .from(appCheckpoints)
      .orderBy(desc(appCheckpoints.createdAt))
      .limit(1);
    if (rows.length === 0) return null;
    return {
      id: rows[0].id.toString(),
      sessionId: rows[0].sessionId,
      hostname: rows[0].hostname,
      projectDirectory: rows[0].projectDirectory,
      state: JSON.parse(rows[0].state),
      createdAt: Number(rows[0].createdAt),
    };
  }
}
