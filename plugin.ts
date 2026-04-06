import {TokenRingPlugin} from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import AppCheckpointService from "@tokenring-ai/checkpoint/AppCheckpointService";
import {z} from "zod";
import {MySQLStorage} from "./mysql/createMySQLStorage.ts";
import packageJSON from "./package.json" with {type: "json"};
import {PostgresStorage} from "./postgres/createPostgresStorage.ts";
import {DrizzleStorageConfigSchema} from "./schema.ts";
import {SQLiteStorage} from "./sqlite/createSQLiteStorage.ts";

const packageConfigSchema = z.object({
  drizzleStorage: DrizzleStorageConfigSchema,
})

export default {
  name: packageJSON.name,
  displayName: "Drizzle Storage",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const storage = config.drizzleStorage;

    if (storage) {
      let storageService: SQLiteStorage | MySQLStorage | PostgresStorage | null = null;
      if (storage.type === "sqlite") {
        storageService = new SQLiteStorage(storage);
      } else if (storage.type === "mysql") {
        storageService = new MySQLStorage(storage);
      } else if (storage.type === "postgres") {
        storageService = new PostgresStorage(storage);
      }
      if (storageService) {
        app.services.register(storageService);
        app.services.waitForItemByType(AgentCheckpointService, (checkpointService) => {
          checkpointService.setCheckpointProvider(storageService);
        });
        app.services.waitForItemByType(AppCheckpointService, (checkpointService) => {
          checkpointService.setCheckpointProvider(storageService);
        });
      }
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
