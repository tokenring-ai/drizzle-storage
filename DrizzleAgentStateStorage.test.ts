import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { NamedAgentCheckpoint, AgentCheckpointProvider } from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import { unlinkSync } from "fs";
import { createSQLiteStorage } from "./sqlite/createSQLiteStorage.js";
import { createMySQLStorage } from "./mysql/createMySQLStorage.js";
import { createPostgresStorage } from "./postgres/createPostgresStorage.js";

describe("DrizzleAgentStateStorage", () => {
  describe("SQLite", () => {
    const dbPath = "./test-agent-state.db";
    let storage: AgentCheckpointProvider;

    beforeAll(() => {
      storage = createSQLiteStorage({
        type: "sqlite",
        databasePath: dbPath,
      });
    });

    afterAll(() => {
      try {
        unlinkSync(dbPath);
      } catch {}
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-1",
        name: "session-1",
        state: { agentState: { messages: {hello: "world"} }, toolsEnabled: ["foo"], hooksEnabled: ["bar"] },
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toBeDefined();

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.name).toBe(checkpoint.name);
      expect(retrieved?.state).toEqual(checkpoint.state);
    });

    it("should list checkpoints", async () => {
      const list = await storage.listCheckpoints();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty("id");
      expect(list[0]).toHaveProperty("name");
      expect(list[0]).toHaveProperty("agentId");
      expect(list[0]).toHaveProperty("createdAt");
    });

    it("should return null for non-existent checkpoint", async () => {
      const retrieved = await storage.retrieveCheckpoint("999999");
      expect(retrieved).toBeNull();
    });
  });

  describe("MySQL", () => {
    let container: StartedTestContainer;
    let storage: AgentCheckpointProvider;

    beforeAll(async () => {
      container = await new GenericContainer("mysql:8.0")
        .withEnvironment({
          MYSQL_ROOT_PASSWORD: "test",
          MYSQL_DATABASE: "testdb",
        })
        .withExposedPorts(3306)
        .start();

      const port = container.getMappedPort(3306);
      const connectionString = `mysql://root:test@localhost:${port}/testdb`;

      storage = createMySQLStorage({
        type: "mysql",
        connectionString,
      });
    });

    afterAll(async () => {
      await container.stop();
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-mysql",
        name: "session-mysql",
        state: { agentState: { messages: {hello: "mysql"} }, toolsEnabled: ["foo"], hooksEnabled: ["bar"] },
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toBeDefined();

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.state).toEqual(checkpoint.state);
    });

    it("should list checkpoints", async () => {
      const list = await storage.listCheckpoints();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe("Postgres", () => {
    let container: StartedTestContainer;
    let storage: AgentCheckpointProvider;

    beforeAll(async () => {
      container = await new GenericContainer("postgres:16")
        .withEnvironment({
          POSTGRES_PASSWORD: "test",
          POSTGRES_DB: "testdb",
        })
        .withExposedPorts(5432)
        .start();

      const port = container.getMappedPort(5432);
      const connectionString = `postgres://postgres:test@localhost:${port}/testdb`;

      storage = createPostgresStorage({
        type: "postgres",
        connectionString,
      });
    });

    afterAll(async () => {
      await container.stop();
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-pg",
        name: "session-pg",
        state: { agentState: { messages: {hello: "postgres"} }, toolsEnabled: ["foo"], hooksEnabled: ["bar"]},
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toBeDefined();

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.state).toEqual(checkpoint.state);
    });

    it("should list checkpoints", async () => {
      const list = await storage.listCheckpoints();
      expect(list.length).toBeGreaterThan(0);
    });
  });
});
