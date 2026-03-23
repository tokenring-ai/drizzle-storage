import {AgentCheckpointStorage, NamedAgentCheckpoint} from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import {AppCheckpointStorage, AppSessionCheckpoint} from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import {afterAll, describe, expect, it} from "vitest";

const isBun = typeof Bun !== "undefined";

/**
 * DrizzleStorage Tests
 * 
 * Note: These tests require Bun runtime because the SQLite storage implementation
 * uses Bun's native `bun:sqlite` module. Tests will be skipped when running in
 * Node.js environment.
 * 
 * To run these tests:
 * 1. Use Bun runtime: `bun test`
 * 2. MySQL/Postgres tests require Docker/testcontainers
 */

describe("DrizzleAgentStateStorage - SQLite (Bun Required)", () => {
  if (!isBun) {
    it.skip("SQLite tests require Bun runtime", () => {
      // This test is skipped when Bun is not available
      expect(true).toBe(true);
    });
    return;
  }

  describe("SQLite Storage Operations", () => {
    let storage: AgentCheckpointStorage;
    const dbPath = "./test-agent-state.db";

    beforeAll(async () => {
      // Use dynamic import to avoid bun:sqlite import error in Node.js
      const {SQLiteStorage} = await import("./sqlite/createSQLiteStorage.js");
      storage = new SQLiteStorage({
        type: "sqlite",
        databasePath: dbPath,
      });
      await storage.start();
    });

    afterAll(async () => {
      // Cleanup: remove test database file
      const {unlinkSync, existsSync} = await import("node:fs");
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    });

    it("should have displayName property", () => {
      expect(storage.displayName).toBeDefined();
      expect(typeof storage.displayName).toBe("string");
    });

    it("should store and retrieve checkpoint", async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-1",
        sessionId: "session-1",
        agentType: "general",
        name: "session-1",
        state: {agentState: {messages: {hello: "world"}}, toolsEnabled: ["foo"], hooksEnabled: ["bar"]},
        createdAt: Date.now(),
      };

      const id = await storage.storeAgentCheckpoint(checkpoint);
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");

      const retrieved = await storage.retrieveAgentCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe(checkpoint.agentId);
      expect(retrieved?.name).toBe(checkpoint.name);
      expect(retrieved?.state).toEqual(checkpoint.state);
      expect(retrieved?.sessionId).toBe(checkpoint.sessionId);
      expect(retrieved?.agentType).toBe(checkpoint.agentType);
    });

    it("should list checkpoints", async () => {
      const list = await storage.listAgentCheckpoints();
      expect(Array.isArray(list)).toBe(true);
      if (list.length > 0) {
        expect(list[0]).toHaveProperty("id");
        expect(list[0]).toHaveProperty("name");
        expect(list[0]).toHaveProperty("agentId");
        expect(list[0]).toHaveProperty("createdAt");
      }
    });

    it("should return null for non-existent checkpoint", async () => {
      const retrieved = await storage.retrieveAgentCheckpoint("999999");
      expect(retrieved).toBeNull();
    });

    it("should handle multiple checkpoints", async () => {
      const checkpoint1: NamedAgentCheckpoint = {
        agentId: "test-agent-2",
        sessionId: "session-2",
        agentType: "general",
        name: "session-2",
        state: {messages: {test: "value1"}},
        createdAt: Date.now(),
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: "test-agent-3",
        sessionId: "session-3",
        agentType: "specialized",
        name: "session-3",
        state: {messages: {test: "value2"}},
        createdAt: Date.now(),
      };

      const id1 = await storage.storeAgentCheckpoint(checkpoint1);
      const id2 = await storage.storeAgentCheckpoint(checkpoint2);

      const retrieved1 = await storage.retrieveAgentCheckpoint(id1);
      const retrieved2 = await storage.retrieveAgentCheckpoint(id2);

      expect(retrieved1?.name).toBe("session-2");
      expect(retrieved2?.name).toBe("session-3");
    });

    it("should preserve complex state structures", async () => {
      const complexState = {
        agentState: {
          messages: [
            {role: "user", content: "Hello"},
            {role: "assistant", content: "Hi there!"},
          ],
          toolsEnabled: ["tool1", "tool2"],
          hooksEnabled: ["hook1"],
        },
        metadata: {
          version: "1.0",
          timestamp: Date.now(),
        },
      };

      const checkpoint: NamedAgentCheckpoint = {
        agentId: "test-agent-complex",
        sessionId: "complex-session",
        agentType: "general",
        name: "complex-session",
        state: complexState,
        createdAt: Date.now(),
      };

      const id = await storage.storeAgentCheckpoint(checkpoint);
      const retrieved = await storage.retrieveAgentCheckpoint(id);

      expect(retrieved?.state).toEqual(complexState);
    });
  });

  describe("SQLite App Checkpoint Storage", () => {
    let storage: AppCheckpointStorage;
    const dbPath = "./test-app-state.db";

    beforeAll(async () => {
      // Use dynamic import to avoid bun:sqlite import error in Node.js
      const {SQLiteStorage} = await import("./sqlite/createSQLiteStorage.js");
      storage = new SQLiteStorage({
        type: "sqlite",
        databasePath: dbPath,
      });
      await storage.start();
    });

    afterAll(async () => {
      // Cleanup: remove test database file
      const {unlinkSync, existsSync} = await import("node:fs");
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    });

    it("should store and retrieve app checkpoint", async () => {
      const checkpoint: AppSessionCheckpoint = {
        sessionId: "app-session-1",
        hostname: "localhost",
        projectDirectory: "/test/project",
        state: {activeTools: ["tool1"], settings: {theme: "dark"}},
        createdAt: Date.now(),
      };

      const id = await storage.storeAppCheckpoint(checkpoint);
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");

      const retrieved = await storage.retrieveAppCheckpoint(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(checkpoint.sessionId);
      expect(retrieved?.hostname).toBe(checkpoint.hostname);
      expect(retrieved?.projectDirectory).toBe(checkpoint.projectDirectory);
      expect(retrieved?.state).toEqual(checkpoint.state);
    });

    it("should list app checkpoints", async () => {
      const list = await storage.listAppCheckpoints();
      expect(Array.isArray(list)).toBe(true);
      if (list.length > 0) {
        expect(list[0]).toHaveProperty("id");
        expect(list[0]).toHaveProperty("sessionId");
        expect(list[0]).toHaveProperty("hostname");
        expect(list[0]).toHaveProperty("projectDirectory");
        expect(list[0]).toHaveProperty("createdAt");
      }
    });

    it("should return null for non-existent app checkpoint", async () => {
      const retrieved = await storage.retrieveAppCheckpoint("999999");
      expect(retrieved).toBeNull();
    });

    it("should retrieve latest app checkpoint", async () => {
      const checkpoint1: AppSessionCheckpoint = {
        sessionId: "app-session-1",
        hostname: "localhost",
        projectDirectory: "/test/project",
        state: {activeTools: ["tool1"]},
        createdAt: Date.now() - 1000,
      };

      const checkpoint2: AppSessionCheckpoint = {
        sessionId: "app-session-2",
        hostname: "localhost",
        projectDirectory: "/test/project",
        state: {activeTools: ["tool2"]},
        createdAt: Date.now(),
      };

      await storage.storeAppCheckpoint(checkpoint1);
      const id2 = await storage.storeAppCheckpoint(checkpoint2);

      const latest = await storage.retrieveLatestAppCheckpoint();
      expect(latest).toBeDefined();
      expect(latest?.sessionId).toBe("app-session-2");
      expect(latest?.id).toBe(id2);
    });
  });
});

describe("DrizzleAgentStateStorage - MySQL & PostgreSQL", () => {
  if (!isBun) {
    it.skip("Database tests require Bun runtime and Docker", () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe.skip("MySQL (Requires Docker)", () => {
    // MySQL tests require Docker/testcontainers
    // These tests are skipped in environments without Docker
    it.skip("should store and retrieve checkpoint in MySQL", async () => {
      // Implementation requires GenericContainer from testcontainers
      expect(true).toBe(true);
    });
  });

  describe.skip("PostgreSQL (Requires Docker)", () => {
    // PostgreSQL tests require Docker/testcontainers
    // These tests are skipped in environments without Docker
    it.skip("should store and retrieve checkpoint in PostgreSQL", async () => {
      // Implementation requires GenericContainer from testcontainers
      expect(true).toBe(true);
    });
  });
});
