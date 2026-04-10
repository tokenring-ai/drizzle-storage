/**
 * @tokenring-ai/drizzle-storage
 *
 * A multi-database storage solution for Token Ring AI agent state checkpoints using Drizzle ORM.
 *
 * This package provides storage classes that implement both the AgentCheckpointStorage
 * and AppCheckpointStorage interfaces. It supports SQLite (Bun), MySQL, and PostgreSQL databases.
 *
 * @example
 * ```typescript
 * import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';
 *
 * const storage = new SQLiteStorage({
 *   type: "sqlite",
 *   databasePath: "./agent_state.db"
 * });
 *
 * await storage.start();
 * ```
 */

export {
  MySQLStorage,
  mysqlStorageConfigSchema,
} from "./mysql/createMySQLStorage.js";
export {
  PostgresStorage,
  postgresStorageConfigSchema,
} from "./postgres/createPostgresStorage.js";
export {
  SQLiteStorage,
  sqliteStorageConfigSchema,
} from "./sqlite/createSQLiteStorage.js";
