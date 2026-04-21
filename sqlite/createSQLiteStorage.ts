import Database from "bun:sqlite";
import type { AppSessionCheckpoint, TokenRingService } from "@tokenring-ai/app/types";
import type {
  AgentCheckpointListItem,
  AgentCheckpointStorage,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
} from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { AppCheckpointStorage, AppSessionListItem, StoredAppCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import { desc, eq } from "drizzle-orm";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { z } from "zod";
import { agentCheckpoints, appCheckpoints } from "./schema.ts";

export const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().exactOptional(),
});

export class SQLiteStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name = "SQLiteStorage";
  description = "SQLite storage provider";

  sqlite: Database;
  db: ReturnType<typeof drizzleSqlite>;
  displayName: string;

  constructor(readonly config: z.infer<typeof sqliteStorageConfigSchema>) {
    this.sqlite = new Database(config.databasePath);
    this.db = drizzleSqlite(this.sqlite);
    this.displayName = `SQLite (${config.databasePath})`;
  }

  start() {
    this.db.run(`
        CREATE TABLE IF NOT EXISTS \`AgentCheckpoints\`
        (
            \`id\`        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            \`sessionId\` text                              NOT NULL,
            \`agentId\`   text                              NOT NULL,
            \`agentType\` text                              NOT NULL,
            \`name\`      text                              NOT NULL,
            \`state\`     text                              NOT NULL,
            \`createdAt\` integer                           NOT NULL
        );
    `);

    this.db.run(`
        CREATE TABLE IF NOT EXISTS \`AppCheckpoints\`
        (
            \`id\`            integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            \`sessionId\`     text                              NOT NULL,
            \`hostname\`      text                              NOT NULL,
            \`projectDirectory\` text NOT NULL,
            \`state\`         text                              NOT NULL,
            \`createdAt\`     integer                           NOT NULL
        );
    `);

    //TODO: Migrations do not work well due to bun packaging. We should fix this.
    //migrateSqlite(db, {migrationsFolder: join(import.meta.dirname, "migrations"), });
  }

  async storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string> {
    const result = await this.db
      .insert(agentCheckpoints)
      .values({
        agentId: checkpoint.agentId,
        name: checkpoint.name,
        sessionId: checkpoint.sessionId,
        agentType: checkpoint.agentType,
        state: JSON.stringify(checkpoint.state),
        createdAt: checkpoint.createdAt,
      })
      .returning({ id: agentCheckpoints.id });
    return result[0].id.toString();
  }

  async retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null> {
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

    return result.map(row => ({
      id: row.id.toString(),
      name: row.name,
      sessionId: row.sessionId,
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
      .returning({ id: appCheckpoints.id });
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

    return result.map(row => ({
      id: row.id.toString(),
      sessionId: row.sessionId,
      hostname: row.hostname,
      projectDirectory: row.projectDirectory,
      createdAt: Number(row.createdAt),
    }));
  }

  async retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null> {
    const rows = await this.db.select().from(appCheckpoints).orderBy(desc(appCheckpoints.createdAt)).limit(1);
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
