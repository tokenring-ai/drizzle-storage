import z from "zod";
import { mysqlStorageConfigSchema } from "./mysql/createMySQLStorage.ts";
import { postgresStorageConfigSchema } from "./postgres/createPostgresStorage.ts";
import { sqliteStorageConfigSchema } from "./sqlite/createSQLiteStorage.ts";

export const DrizzleStorageConfigSchema = z.discriminatedUnion("type", [sqliteStorageConfigSchema, postgresStorageConfigSchema, mysqlStorageConfigSchema]);
