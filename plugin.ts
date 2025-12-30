import {TokenRingPlugin} from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import {CheckpointConfigSchema} from "@tokenring-ai/checkpoint/schema";
import {z} from "zod";
import {createMySQLStorage, mysqlStorageConfigSchema} from "./mysql/createMySQLStorage.js";
import packageJSON from "./package.json" with {type: "json"};
import {createPostgresStorage, postgresStorageConfigSchema} from "./postgres/createPostgresStorage.js";
import {createSQLiteStorage, sqliteStorageConfigSchema} from "./sqlite/createSQLiteStorage.js";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
})

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.checkpoint) {
      app.services
        .waitForItemByType(AgentCheckpointService, (checkpointService) => {
          const provider = config.checkpoint!.provider;

          if (provider.type === "sqlite") {
            checkpointService.setCheckpointProvider(
              createSQLiteStorage(sqliteStorageConfigSchema.parse(provider))
            );
          } else if (provider.type === "mysql") {
            checkpointService.setCheckpointProvider(
              createMySQLStorage(mysqlStorageConfigSchema.parse(provider))
            );
          } else if (provider.type === "postgres") {
            checkpointService.setCheckpointProvider(
              createPostgresStorage(postgresStorageConfigSchema.parse(provider))
            )
          }
        });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
