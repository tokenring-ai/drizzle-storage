/**
 * @tokenring-ai/drizzle-storage
 *
 * A multi-database storage solution for Token Ring AI agent state checkpoints using Drizzle ORM.
 *
 * This package provides factory functions for creating storage providers that implement the
 * AgentCheckpointProvider interface. It supports SQLite (Bun), MySQL, and PostgreSQL databases.
 *
 * @example
 * ```typescript
 * import { createPostgresStorage } from '@tokenring-ai/drizzle-storage';
 *
 * const storage = createPostgresStorage({
 *   type: "postgres",
 *   connectionString: process.env.DATABASE_URL
 * });
 *
 * await storage.start();
 * ```
 */

export { createSQLiteStorage, sqliteStorageConfigSchema } from './sqlite/createSQLiteStorage.js';
export { createMySQLStorage, mysqlStorageConfigSchema } from './mysql/createMySQLStorage.js';
export { createPostgresStorage, postgresStorageConfigSchema } from './postgres/createPostgresStorage.js';