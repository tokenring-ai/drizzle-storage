# @tokenring-ai/drizzle-storage

A multi-database storage solution for Token Ring AI agent state checkpoints using Drizzle ORM.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a robust, type-safe storage backend for managing agent state checkpoints across multiple database systems. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases using Drizzle ORM for type-safe operations and automatic table creation.

### Key Features

- **Multi-Database Support**: SQLite (Bun), MySQL, and PostgreSQL
- **Type Safety**: Full TypeScript support with Drizzle ORM
- **Automatic Table Creation**: Schema creation on initialization
- **Connection Pooling**: Built-in pooling for MySQL and PostgreSQL
- **Token Ring Plugin**: Seamless integration via Token Ring's plugin system
- **JSON State Management**: Automatic JSON serialization/deserialization
- **Comprehensive Testing**: Vitest with Docker containers for MySQL and PostgreSQL

## Installation

```bash
bun install @tokenring-ai/drizzle-storage
```

## Quick Start

### 1. Create Storage Provider

Choose the appropriate database type for your use case:

#### SQLite (Bun)

Perfect for development and small-scale applications:

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});
```

#### MySQL

Ideal for production environments with connection pooling:

```typescript
import { createMySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = createMySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});
```

#### PostgreSQL

Enterprise-grade database with advanced features:

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage';

const storage = createPostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:password@localhost:5432/database"
});
```

### 2. Initialize and Use

```typescript
// Initialize the storage (creates tables if they don't exist)
await storage.start();

// Store a checkpoint
const checkpoint = {
  agentId: "agent-123",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  config: { customConfig: "value" },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
console.log('Checkpoint stored with ID:', id);

// Retrieve a checkpoint
const retrieved = await storage.retrieveCheckpoint(id);
console.log('Retrieved state:', retrieved?.state);

// List all checkpoints
const checkpoints = await storage.listCheckpoints();
console.log('Available checkpoints:', checkpoints);
```

## Plugin Configuration

Configure the storage provider in your Token Ring configuration:

```javascript
// .tokenring/coder-config.mjs
export default {
  checkpoint: {
    provider: {
      type: "postgres",
      connectionString: process.env.DATABASE_URL
    }
  }
};
```

### Plugin Implementation

The package includes a TokenRing plugin that automatically sets up the storage provider:

```typescript
// plugin.ts
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
```

### Configuration Schema

The package uses Zod schemas for configuration validation:

```typescript
const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
})
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

### Factory Functions

```typescript
createSQLiteStorage(config: SQLiteConfig): AgentCheckpointProvider
createMySQLStorage(config: MySQLConfig): AgentCheckpointProvider
createPostgresStorage(config: PostgresConfig): AgentCheckpointProvider
```

### AgentCheckpointProvider Interface

```typescript
interface AgentCheckpointProvider {
  start(): Promise<void>;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

### Data Types

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  name: string;
  state: any;
  config?: any;
  createdAt: number;
}

interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}

interface AgentCheckpointListItem {
  id: string;
  name: string;
  agentId: string;
  createdAt: number;
}
```

## Database Schema

All database types use the same logical schema:

| Column      | Type           | Description                              |
|-------------|----------------|------------------------------------------|
| `id`        | Integer/BigInt | Auto-incrementing primary key            |
| `agentId`   | Text           | Agent identifier                         |
| `name`      | Text           | Checkpoint name                          |
| `config`    | Text           | JSON-serialized configuration data       |
| `state`     | Text           | JSON-serialized state data               |
| `createdAt` | Integer/BigInt | Unix timestamp                           |

### Schema Implementation

Each database type has its own schema file:

- **SQLite**: `sqlite/schema.ts`
- **MySQL**: `mysql/schema.ts`
- **PostgreSQL**: `postgres/schema.ts`

Example schema (SQLite):

```typescript
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("AgentState", {
  id: integer("id").primaryKey({autoIncrement: true}),
  agentId: text("agentId").notNull(),
  name: text("name").notNull(),
  config: text("config").notNull(),
  state: text("state").notNull(),
  createdAt: integer("createdAt").notNull,
});
```

## Testing

Run the comprehensive test suite with Docker containers:

```bash
bun run test
```

### Test Coverage

- **SQLite**: Local file database (skipped in non-Bun environments)
- **MySQL**: Docker container (mysql:8.0)
- **PostgreSQL**: Docker container (postgres:16)
- CRUD operations for all database types
- Error handling and edge cases
- Non-existent checkpoint retrieval
- Connection management

### Example Test

```typescript
import {AgentCheckpointProvider, NamedAgentCheckpoint} from "@tokenring-ai/checkpoint/AgentCheckpointProvider";
import {createMySQLStorage} from "./mysql/createMySQLStorage.js";

describe("DrizzleAgentStateStorage", () => {
  let storage: AgentCheckpointProvider;

  beforeAll(async () => {
    storage = createMySQLStorage({
      type: "mysql",
      connectionString: "mysql://root:test@localhost:3306/testdb",
    });
  });

  it("should store and retrieve checkpoint", async () => {
    const checkpoint: NamedAgentCheckpoint = {
      agentId: "test-agent-1",
      name: "session-1",
      state: {agentState: {messages: {hello: "world"}}, toolsEnabled: ["foo"]},
      createdAt: Date.now(),
    };

    const id = await storage.storeCheckpoint(checkpoint);
    expect(id).toBeDefined();

    const retrieved = await storage.retrieveCheckpoint(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.agentId).toBe(checkpoint.agentId);
    expect(retrieved?.state).toEqual(checkpoint.state);
  });
});
```

## Project Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point with exports
├── plugin.ts                   # TokenRingPlugin implementation
├── package.json                # Dependencies and scripts
├── README.md                   # Documentation
├── DrizzleAgentStateStorage.test.ts  # Test suite
├── vitest.config.ts            # Test configuration
├── LICENSE                     # MIT License
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── drizzle.config.ts      # Drizzle configuration
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── drizzle.config.ts      # Drizzle configuration
└── postgres/                   # PostgreSQL implementation
    ├── createPostgresStorage.ts # Factory function
    ├── schema.ts              # Drizzle schema
    └── drizzle.config.ts      # Drizzle configuration
```

## Dependencies

### Runtime Dependencies

- `drizzle-orm`: Type-safe ORM for database operations
- `mysql2`: MySQL driver with connection pooling
- `postgres`: PostgreSQL driver with connection pooling
- `zod`: Schema validation
- `@tokenring-ai/checkpoint`: Token Ring checkpoint interface
- `@tokenring-ai/app`: Token Ring application framework
- `bun:sqlite`: Bun's built-in SQLite driver (for SQLite only)

### Development Dependencies

- `drizzle-kit`: Migration generator
- `vitest`: Testing framework
- `testcontainers`: Docker container management for testing
- `typescript`: TypeScript compiler
- `bun-types`: TypeScript definitions for Bun

## Migration Strategy

This package uses Drizzle's codebase-first approach:

1. **Define Schema**: Schema is defined in TypeScript files for each database type (`sqlite/schema.ts`, `mysql/schema.ts`, `postgres/schema.ts`)
2. **Create Tables**: Tables are automatically created at runtime when the `start()` method is called using `CREATE TABLE IF NOT EXISTS` statements
3. **Note**: Migrations are not automatically applied via Drizzle's migration system due to Bun packaging constraints. The `start()` method creates tables directly.

## Error Handling

The package includes comprehensive error handling:

- Database connection errors
- Invalid checkpoint data
- Non-existent checkpoint retrieval
- JSON parsing errors for state and config

## Performance Considerations

- **SQLite**: Single-file database, ideal for development and small-scale applications
- **MySQL**: Connection pooling for high-performance applications
- **PostgreSQL**: Advanced features for enterprise workloads with connection pooling

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Add comprehensive tests for new features
3. Update schema files when adding new columns
4. Ensure all tests pass before submitting PRs
5. Update documentation for any API changes

## License

MIT License - see [LICENSE](./LICENSE) file for details.
