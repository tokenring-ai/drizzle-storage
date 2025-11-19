CREATE TABLE `AgentState`
(
 `id`        bigint AUTO_INCREMENT NOT NULL,
 `agentId`   text                  NOT NULL,
 `name`      text                  NOT NULL,
 `state`     text                  NOT NULL,
 `createdAt` bigint                NOT NULL,
 CONSTRAINT `AgentState_id` PRIMARY KEY (`id`)
);
