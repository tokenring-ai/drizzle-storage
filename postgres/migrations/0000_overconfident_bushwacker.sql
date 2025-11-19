CREATE TABLE IF NOT EXISTS "AgentState"
(
 "id" bigserial PRIMARY KEY NOT NULL,
 "agentId"   text   NOT NULL,
 "name"      text   NOT NULL,
 "state"     text   NOT NULL,
 "createdAt" bigint NOT NULL
);
