import {TokenRingPlugin} from "@tokenring-ai/app";
import {CheckpointPluginConfigSchema} from "@tokenring-ai/checkpoint";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import {z} from "zod";
import {createMySQLStorage, mysqlStorageConfigSchema} from "./mysql/createMySQLStorage.js";
import packageJSON from "./package.json" with {type: "json"};
import {createPostgresStorage, postgresStorageConfigSchema} from "./postgres/createPostgresStorage.js";
import {createSQLiteStorage, sqliteStorageConfigSchema} from "./sqlite/createSQLiteStorage.js";

const packageConfigSchema = z.object({
  checkpoint: CheckpointPluginConfigSchema.optional(),
})

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    // const config = app.getConfigSlice("checkpoint", CheckpointPluginConfigSchema);

    if (config.checkpoint) {
      app.services
        .waitForItemByType(AgentCheckpointService, (checkpointService) => {
          for (const name in config.checkpoint!.providers) {
            const provider = config.checkpoint!.providers[name];
            if (provider.type === "sqlite") {
              checkpointService.registerProvider(
                name,
                createSQLiteStorage(sqliteStorageConfigSchema.parse(provider))
              );
            } else if (provider.type === "mysql") {
              checkpointService.registerProvider(
                name,
                createMySQLStorage(mysqlStorageConfigSchema.parse(provider))
              );
            } else if (provider.type === "postgres") {
              checkpointService.registerProvider(
                name,
                createPostgresStorage(postgresStorageConfigSchema.parse(provider))
              )
            }
          }
        });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
