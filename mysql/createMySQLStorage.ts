import type { AppSessionCheckpoint, TokenRingService } from "@tokenring-ai/app/types";
import type {
  AgentCheckpointListItem,
  AgentCheckpointStorage,
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
} from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import type { AppCheckpointStorage, AppSessionListItem, StoredAppCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import { desc, eq } from "drizzle-orm";
import { drizzle as drizzleMysql, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { z } from "zod";
import { agentCheckpoints, appCheckpoints } from "./schema.ts";

export const mysqlStorageConfigSchema = z.object({
  type: z.literal("mysql"),
  connectionString: z.string(),
});

export class MySQLStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name = "MySQLStorage";
  description = "MySQL storage provider";

  connection: mysql.Pool;
  db: MySql2Database<Record<string, unknown>>;
  displayName: string;

  constructor(readonly config: z.infer<typeof mysqlStorageConfigSchema>) {
    const url = new URL(config.connectionString);
    url.password = "***";

    this.connection = mysql.createPool(config.connectionString);
    this.db = drizzleMysql(this.connection);

    this.displayName = `MySQL (${url.toString()})`;
  }

  async start() {
    await this.db.execute(`
        CREATE TABLE IF NOT EXISTS \`AgentCheckpoints\`
        (
            \`id\`        bigint AUTO_INCREMENT NOT NULL,
            \`sessionId\` text                  NOT NULL,
            \`agentId\`   text                  NOT NULL,
            \`name\`      text                  NOT NULL,
            \`agentType\` text                  NOT NULL,
            \`state\`     text                  NOT NULL,
            \`createdAt\` bigint                NOT NULL,
            CONSTRAINT \`AgentCheckpoints_id\` PRIMARY KEY (\`id\`)
        );
    `);

    await this.db.execute(`
        CREATE TABLE IF NOT EXISTS \`AppCheckpoints\`
        (
            \`id\`            bigint AUTO_INCREMENT NOT NULL,
            \`sessionId\`     text                  NOT NULL,
            \`hostname\`      text                  NOT NULL,
            \`projectDirectory\` text NOT NULL,
            \`state\`         text                  NOT NULL,
            \`createdAt\`     bigint                NOT NULL,
            CONSTRAINT \`AppCheckpoints_id\` PRIMARY KEY (\`id\`)
        );
    `);

    //TODO: Migrations do not work well due to bun packaging. We should fix this.
    //migrateMysql(db, {migrationsFolder: join(import.meta.dirname, "migrations")});
  }

  async storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string> {
    const result = await this.db.insert(agentCheckpoints).values({
      agentId: checkpoint.agentId,
      name: checkpoint.name,
      sessionId: checkpoint.sessionId,
      agentType: checkpoint.agentType,
      state: JSON.stringify(checkpoint.state),
      createdAt: checkpoint.createdAt,
    });
    return result[0].insertId.toString();
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
      name: row.name,
      agentId: row.agentId,
      sessionId: row.sessionId,
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
      sessionId: row.sessionId,
      name: row.name,
      agentId: row.agentId,
      agentType: row.agentType,
      createdAt: Number(row.createdAt),
    }));
  }

  async storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string> {
    const result = await this.db.insert(appCheckpoints).values({
      sessionId: checkpoint.sessionId,
      hostname: checkpoint.hostname,
      projectDirectory: checkpoint.projectDirectory,
      state: JSON.stringify(checkpoint.state),
      createdAt: checkpoint.createdAt,
    });
    return result[0].insertId.toString();
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
