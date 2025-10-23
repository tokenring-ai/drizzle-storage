CREATE TABLE IF NOT EXISTS `AgentState` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agentId` text NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`createdAt` integer NOT NULL
);
