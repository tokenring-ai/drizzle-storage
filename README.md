# @tokenring-ai/drizzle-storage

A multi-database storage solution for Token Ring AI agent state checkpoints using Drizzle ORM.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a robust, type-safe storage backend for managing both agent state checkpoints and application session checkpoints across multiple database systems. It implements the `AgentCheckpointStorage` and `AppCheckpointStorage` interfaces with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations.

### Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, and PostgreSQL
- **Dual Storage Interfaces**: Implements both `AgentCheckpointStorage` and `AppCheckpointStorage`
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization via `start()` method
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Token Ring Service**: Seamless integration via Token Ring's service system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Comprehensive Testing**: Vitest with Bun runtime for SQLite
- **Plugin Support**: TokenRingPlugin for automatic configuration

## Installation

```bash
bun install @tokenring-ai/drizzle-storage
```

## Quick Start

### 1. Create Storage Instance

Choose the appropriate database type for your use case:

#### SQLite (Bun)

Perfect for development and small-scale applications:

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();
```

#### MySQL

Ideal for production environments with connection pooling:

```typescript
import { MySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = new MySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});

await storage.start();
```

#### PostgreSQL

Enterprise-grade database with advanced features:

```typescript
import { PostgresStorage } from '@tokenring-ai/drizzle-storage';

const storage = new PostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:password@localhost:5432/database"
});

await storage.start();
```

### 2. Store and Retrieve Agent Checkpoints

```typescript
import { NamedAgentCheckpoint } from "@tokenring-ai/checkpoint/AgentCheckpointStorage";

// Store an agent checkpoint
const checkpoint: NamedAgentCheckpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeAgentCheckpoint(checkpoint);
console.log('Checkpoint stored with ID:', id);

// Retrieve an agent checkpoint
const retrieved = await storage.retrieveAgentCheckpoint(id);
console.log('Retrieved state:', retrieved?.state);

// List all agent checkpoints
const checkpoints = await storage.listAgentCheckpoints();
console.log('Available checkpoints:', checkpoints);
```

### 3. Store and Retrieve App Checkpoints

```typescript
import { AppSessionCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";

// Store an app checkpoint
const appCheckpoint: AppSessionCheckpoint = {
  sessionId: "session-789",
  hostname: "localhost",
  projectDirectory: "/path/to/project",
  state: { projectDirectory: "/path/to/project", files: [] },
  createdAt: Date.now()
};

const appId = await storage.storeAppCheckpoint(appCheckpoint);
console.log('App checkpoint stored with ID:', appId);

// Retrieve an app checkpoint
const retrievedApp = await storage.retrieveAppCheckpoint(appId);
console.log('Retrieved app state:', retrievedApp?.state);

// List all app checkpoints
const appCheckpoints = await storage.listAppCheckpoints();
console.log('Available app checkpoints:', appCheckpoints);

// Retrieve the latest app checkpoint
const latestApp = await storage.retrieveLatestAppCheckpoint();
console.log('Latest app checkpoint:', latestApp);
```

## Plugin Configuration

Configure the storage provider in your Token Ring configuration using the `drizzleStorage` key:

```javascript
// .tokenring/coder-config.mjs
export default {
  drizzleStorage: {
    type: "postgres",
    connectionString: process.env.DATABASE_URL
  }
};
```

### Plugin Implementation

The package includes a TokenRing plugin that automatically registers the storage service for both agent and app checkpoints:

```typescript
// plugin.ts
import { TokenRingPlugin } from "@tokenring-ai/app";
import AgentCheckpointService from "@tokenring-ai/checkpoint/AgentCheckpointService";
import AppCheckpointService from "@tokenring-ai/checkpoint/AppCheckpointService";
import { z } from "zod";
import { MySQLStorage } from "./mysql/createMySQLStorage.js";
import packageJSON from "./package.json" with { type: "json" };
import { PostgresStorage } from "./postgres/createPostgresStorage.js";
import { DrizzleStorageConfigSchema } from "./schema.ts";
import { SQLiteStorage } from "./sqlite/createSQLiteStorage.js";

const packageConfigSchema = z.object({
  drizzleStorage: DrizzleStorageConfigSchema,
});

export default {
  name: packageJSON.name,
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
```

### Configuration Schema

The package uses Zod schemas for configuration validation:

```typescript
const DrizzleStorageConfigSchema = z.discriminatedUnion("type", [
  sqliteStorageConfigSchema,
  postgresStorageConfigSchema,
  mysqlStorageConfigSchema
]);
```

#### SQLite Config Schema

```typescript
const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().optional(),
});
```

#### MySQL Config Schema

```typescript
const mysqlStorageConfigSchema = z.object({
  type: z.literal("mysql"),
  connectionString: z.string(),
});
```

#### PostgreSQL Config Schema

```typescript
const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});
```

## API Reference

### Package Exports

The package provides storage classes and configuration schemas:

```typescript
// Storage classes
import { SQLiteStorage, MySQLStorage, PostgresStorage } from '@tokenring-ai/drizzle-storage';

// Configuration schemas
import {
  sqliteStorageConfigSchema,
  mysqlStorageConfigSchema,
  postgresStorageConfigSchema,
  DrizzleStorageConfigSchema
} from '@tokenring-ai/drizzle-storage';
```

### Storage Classes

All three storage classes (`SQLiteStorage`, `MySQLStorage`, `PostgresStorage`) implement the following interfaces:
- `TokenRingService`
- `AgentCheckpointStorage`
- `AppCheckpointStorage`

#### SQLiteStorage

```typescript
class SQLiteStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "sqlite";
    databasePath: string;
    migrationsFolder?: string;
  });

  // TokenRingService
  start(): Promise<void>;

  // AgentCheckpointStorage
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;

  // AppCheckpointStorage
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

#### MySQLStorage

```typescript
class MySQLStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "mysql";
    connectionString: string;
  });

  // TokenRingService
  start(): Promise<void>;

  // AgentCheckpointStorage
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;

  // AppCheckpointStorage
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

#### PostgresStorage

```typescript
class PostgresStorage implements TokenRingService, AgentCheckpointStorage, AppCheckpointStorage {
  name: string;
  description: string;
  displayName: string;

  constructor(config: {
    type: "postgres";
    connectionString: string;
  });

  // TokenRingService
  start(): Promise<void>;

  // AgentCheckpointStorage
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;

  // AppCheckpointStorage
  storeAppCheckpoint(checkpoint: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

### AgentCheckpointStorage Interface

```typescript
interface AgentCheckpointStorage {
  start?(): Promise<void>;
  storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

### AppCheckpointStorage Interface

```typescript
interface AppCheckpointStorage {
  start?(): Promise<void>;
  storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

### Data Types

#### Agent Checkpoint Types

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  sessionId: string;
  agentType: string;
  name: string;
  state: any;
  createdAt: number;
}

interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

interface AgentCheckpointListItem {
  id: string;
  sessionId: string;
  name: string;
  agentId: string;
  agentType: string;
  createdAt: number;
}
```

#### App Checkpoint Types

```typescript
interface AppSessionCheckpoint {
  sessionId: string;
  hostname: string;
  projectDirectory: string;
  state: any;
  createdAt: number;
}

interface StoredAppCheckpoint extends AppSessionCheckpoint {
  id: string;
}

interface AppSessionListItem {
  id: string;
  sessionId: string;
  hostname: string;
  projectDirectory: string;
  createdAt: number;
}
```

## Database Schema

All database types use the same logical schema with two tables: `AgentCheckpoints` and `AppCheckpoints`.

### AgentCheckpoints Table

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `sessionId` | Text           | Session identifier                       |
| `agentId`   | Text           | Agent identifier                         |
| `agentType` | Text           | Type of agent (e.g., "coder", "writer")  |
| `name`      | Text           | Checkpoint name                          |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

### AppCheckpoints Table

| Column             | Type           | Description                   |
|--------------------|----------------|-------------------------------|
| `id`               | Integer/BigInt | Auto-incrementing primary key |
| `sessionId`        | Text           | Session identifier            |
| `hostname`         | Text           | Hostname of the application   |
| `projectDirectory` | Text           | Current working directory     |
| `state`            | Text           | JSON-serialized state data    |
| `createdAt`        | Integer/BigInt | Unix timestamp                |

### Schema Implementation

Each database type has its own schema file using Drizzle ORM:

- **SQLite**: `sqlite/schema.ts`
- **MySQL**: `mysql/schema.ts`
- **PostgreSQL**: `postgres/schema.ts`

Example schema (SQLite):

```typescript
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentCheckpoints = sqliteTable("AgentCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  agentType: text("agentType").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const appCheckpoints = sqliteTable("AppCheckpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("sessionId").notNull(),
  hostname: text("hostname").notNull(),
  projectDirectory: text("projectDirectory").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull(),
});
```

## Testing

Run the comprehensive test suite with Bun runtime:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **SQLite**: Local file database (requires Bun runtime)
- **MySQL/PostgreSQL**: Tests are currently skipped (require Docker/testcontainers)
- CRUD operations for both agent and app checkpoints
- Error handling and edge cases
- Non-existent checkpoint retrieval (returns `null`)
- Complex state structure preservation

### Example Test

```typescript
import { AgentCheckpointStorage, NamedAgentCheckpoint } from "@tokenring-ai/checkpoint/AgentCheckpointStorage";
import { AppCheckpointStorage, AppSessionCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { SQLiteStorage } from "./sqlite/createSQLiteStorage.js";

describe("DrizzleStorage - SQLite", () => {
  let storage: AgentCheckpointStorage;
  const dbPath = "./test-agent-state.db";

  beforeAll(async () => {
    storage = new SQLiteStorage({
      type: "sqlite",
      databasePath: dbPath,
    });
    await storage.start();
  });

  afterAll(async () => {
    // Cleanup: remove test database file
    const { unlinkSync, existsSync } = await import("node:fs");
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
    }
  });

  it("should store and retrieve checkpoint", async () => {
    const checkpoint: NamedAgentCheckpoint = {
      agentId: "test-agent-1",
      sessionId: "session-1",
      agentType: "general",
      name: "session-1",
      state: { agentState: { messages: { hello: "world" } }, toolsEnabled: ["foo"], hooksEnabled: ["bar"] },
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
  });

  it("should return null for non-existent checkpoint", async () => {
    const retrieved = await storage.retrieveAgentCheckpoint("999999");
    expect(retrieved).toBeNull();
  });
});
```

**Note**: MySQL and PostgreSQL tests are currently skipped as they require Docker/testcontainers. To enable these tests, you'll need to set up Docker containers using testcontainers.

## Project Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point with exports
├── plugin.ts                   # TokenRingPlugin implementation
├── schema.ts                   # Combined configuration schema
├── package.json                # Dependencies and scripts
├── README.md                   # Documentation
├── DrizzleAgentStateStorage.test.ts  # Test suite
├── vitest.config.ts            # Test configuration
├── LICENSE                     # MIT License
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # SQLiteStorage class
│   ├── schema.ts               # Drizzle schema
│   └── drizzle.config.ts       # Drizzle configuration
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts   # MySQLStorage class
│   ├── schema.ts               # Drizzle schema
│   └── drizzle.config.ts       # Drizzle configuration
└── postgres/                   # PostgreSQL implementation
    ├── createPostgresStorage.ts # PostgresStorage class
    ├── schema.ts               # Drizzle schema
    └── drizzle.config.ts       # Drizzle configuration
```

## Dependencies

### Runtime Dependencies

- `drizzle-orm`: Type-safe ORM for database operations
- `mysql2`: MySQL driver with connection pooling
- `postgres`: PostgreSQL driver with connection pooling
- `bun:sqlite`: Bun's built-in SQLite driver (for SQLite only)
- `zod`: Schema validation
- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/chat`: Token Ring chat framework
- `@tokenring-ai/checkpoint`: Token Ring checkpoint interface

### Development Dependencies

- `drizzle-kit`: Migration generator
- `vitest`: Testing framework
- `testcontainers`: Docker container management for testing
- `typescript`: TypeScript compiler
- `bun-types`: TypeScript definitions for Bun

## Migration Strategy

This package uses Drizzle's codebase-first approach with runtime table creation:

1. **Define Schema**: Schema is defined in TypeScript files for each database type (`sqlite/schema.ts`, `mysql/schema.ts`, `postgres/schema.ts`)
2. **Create Tables**: Tables are automatically created at runtime when the `start()` method is called using `CREATE TABLE IF NOT EXISTS` statements
3. **Note**: Drizzle migrations are not automatically applied via the migration system due to Bun packaging constraints. The `start()` method creates tables directly.

## Error Handling

The package includes comprehensive error handling:

- Database connection errors
- Invalid checkpoint data
- Non-existent checkpoint retrieval (returns `null`)
- JSON parsing errors for state

## Performance Considerations

- **SQLite**: Single-file database, ideal for development and small-scale applications
- **MySQL**: Connection pooling for high-performance applications
- **PostgreSQL**: Advanced features for enterprise workloads with connection pooling

## Usage Examples

### Direct Usage - Agent Checkpoints

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();

// Store an agent checkpoint
const checkpoint = {
  agentId: "agent-123",
  sessionId: "session-456",
  agentType: "coder",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeAgentCheckpoint(checkpoint);
console.log('Checkpoint stored with ID:', id);
```

### Direct Usage - App Checkpoints

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./app_state.db"
});

await storage.start();

// Store an app checkpoint
const appCheckpoint = {
  sessionId: "app-session-1",
  hostname: "localhost",
  projectDirectory: "/path/to/project",
  state: {projectDirectory: "/path/to/project", files: []},
  createdAt: Date.now()
};

const id = await storage.storeAppCheckpoint(appCheckpoint);
console.log('App checkpoint stored with ID:', id);
```

### List Agent Checkpoints

```typescript
const checkpoints = await storage.listAgentCheckpoints();
for (const checkpoint of checkpoints) {
  console.log(`${checkpoint.name} (${checkpoint.agentId}): ${checkpoint.id}`);
}
```

### List App Checkpoints

```typescript
const checkpoints = await storage.listAppCheckpoints();
for (const checkpoint of checkpoints) {
  console.log(`${checkpoint.sessionId} (${checkpoint.hostname}): ${checkpoint.id}`);
}
```

### Retrieve Latest App Checkpoint

```typescript
const latest = await storage.retrieveLatestAppCheckpoint();
if (latest) {
  console.log('Latest app checkpoint:', latest);
} else {
  console.log('No app checkpoints found');
}
```

### Handle Non-existent Checkpoints

```typescript
const retrieved = await storage.retrieveAgentCheckpoint("999999");
if (retrieved === null) {
  console.log('Checkpoint not found');
}
```

### Using the Plugin

```javascript
// .tokenring/coder-config.mjs
export default {
  drizzleStorage: {
    type: "sqlite",
    databasePath: "./agent_state.db"
  }
};
```

## Development

### Generating Migrations

```bash
# Generate migrations for all database types
bun run db:generate

# Generate migrations for specific database
bun run db:generate:sqlite
bun run db:generate:postgres
bun run db:generate:mysql
```

### Building

```bash
bun run build
```

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Add comprehensive tests for new features
3. Update schema files when adding new columns
4. Ensure all tests pass before submitting PRs
5. Update documentation for any API changes

## License

MIT License - see [LICENSE](./LICENSE) file for details.
