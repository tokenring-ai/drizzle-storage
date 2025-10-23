import { AgentTeam, TokenRingPackage } from "@tokenring-ai/agent";
import packageJSON from "./package.json" with { type: "json" };
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import { CheckpointPackageConfigSchema } from "@tokenring-ai/checkpoint";
import {createPostgresStorage, postgresStorageConfigSchema} from "./postgres/createPostgresStorage.js";
import {createSQLiteStorage, sqliteStorageConfigSchema} from "./sqlite/createSQLiteStorage.js";
import {createMySQLStorage, mysqlStorageConfigSchema} from "./mysql/createMySQLStorage.js";

export const packageInfo: TokenRingPackage = {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const config = agentTeam.getConfigSlice("checkpoint", CheckpointPackageConfigSchema);

    if (config) {
      agentTeam.services
        .waitForItemByType(AgentCheckpointService)
        .then((checkpointService) => {
          for (const name in config.providers) {
            const provider = config.providers[name];
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
        })
        .catch(console.error);
    }
  },
};
