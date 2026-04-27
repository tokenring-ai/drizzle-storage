# @tokenring-ai/drizzle-storage

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

## Features

- Store and retrieve agent checkpoints with full state preservation
- Store and retrieve application session checkpoints
- List checkpoints with metadata (ID, name, session ID, timestamps)
- Retrieve latest application checkpoint
- Multi-database support with consistent API across all providers
- Automatic table creation on initialization
- Type-safe configuration validation with Zod schemas

## Configuration

### Configuration Options

The package supports three database types, each with its own configuration schema:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `type` | `"sqlite"` \| `"mysql"` \| `"postgres"` | Yes | Database type |
| `databasePath` | `string` | SQLite only | Path to SQLite database file |
| `connectionString` | `string` | MySQL/Postgres | Database connection string |
| `migrationsFolder` | `string` | SQLite optional | Path to migrations folder |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string (MySQL/Postgres) | `mysql://user:pass@localhost:3306/db` |

### Configuration Example

#### SQLite Configuration

```yaml
drizzleStorage:
  type: sqlite
  databasePath: "./agent_state.db"
  migrationsFolder: "./migrations"
```

#### MySQL Configuration

```yaml
drizzleStorage:
  type: mysql
  connectionString: "mysql://user:password@localhost:3306/database"
```

#### PostgreSQL Configuration

```yaml
drizzleStorage:
  type: postgres
  connectionString: "postgres://user:password@localhost:5432/database"
```

## License

MIT License - see LICENSE file for details.

---

## Developer Reference

### Core Components

The package consists of three main storage classes and a plugin system:

- **SQLiteStorage**: SQLite database provider using Bun's native SQLite
- **MySQLStorage**: MySQL database provider with connection pooling
- **PostgresStorage**: PostgreSQL database provider with connection pooling
- **DrizzleStorage Plugin**: TokenRingPlugin for automatic service registration

### Services

#### SQLiteStorage

SQLite storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`.

**Constructor Parameters:**

```typescript
interface SQLiteStorageConfig {
  type: "sqlite";
  databasePath: string;
  migrationsFolder?: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name: "SQLiteStorage" |
| `description` | `string` | Service description: "SQLite storage provider" |
| `displayName` | `string` | Display name including database path |
| `config` | `SQLiteStorageConfig` | Configuration object |
| `sqlite` | `Database` | Bun SQLite database instance |
| `db` | `DrizzleSQLiteDatabase` | Drizzle ORM database instance |

**Methods:**

| Method | Description |
|--------|-------------|
| `start()` | Creates tables if they don't exist |
| `storeAgentCheckpoint(checkpoint)` | Stores an agent checkpoint, returns ID |
| `retrieveAgentCheckpoint(id)` | Retrieves an agent checkpoint by ID |
| `listAgentCheckpoints()` | Lists all agent checkpoints |
| `storeAppCheckpoint(checkpoint)` | Stores an app checkpoint, returns ID |
| `retrieveAppCheckpoint(id)` | Retrieves an app checkpoint by ID |
| `listAppCheckpoints()` | Lists all app checkpoints |
| `retrieveLatestAppCheckpoint()` | Retrieves the latest app checkpoint |

#### MySQLStorage

MySQL storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`.

**Constructor Parameters:**

```typescript
interface MySQLStorageConfig {
  type: "mysql";
  connectionString: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name: "MySQLStorage" |
| `description` | `string` | Service description: "MySQL storage provider" |
| `displayName` | `string` | Display name including connection URL |
| `config` | `MySQLStorageConfig` | Configuration object |
| `connection` | `mysql.Pool` | MySQL connection pool |
| `db` | `MySql2Database` | Drizzle ORM database instance |

#### PostgresStorage

PostgreSQL storage provider implementing `TokenRingService`, `AgentCheckpointStorage`, and `AppCheckpointStorage`.

**Constructor Parameters:**

```typescript
interface PostgresStorageConfig {
  type: "postgres";
  connectionString: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Service name: "PostgresStorage" |
| `description` | `string` | Service description: "PostgreSQL storage provider" |
| `displayName` | `string` | Display name including connection URL |
| `config` | `PostgresStorageConfig` | Configuration object |
| `connection` | `postgres.Sql` | PostgreSQL connection |
| `db` | `DrizzlePostgresDatabase` | Drizzle ORM database instance |

### Provider Documentation

All storage providers implement the same interfaces:

#### AgentCheckpointStorage Interface

```typescript
interface AgentCheckpointStorage {
  start?(): Promise<void>;
  storeAgentCheckpoint(data: NamedAgentCheckpoint): Promise<string>;
  retrieveAgentCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listAgentCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

#### AppCheckpointStorage Interface

```typescript
interface AppCheckpointStorage {
  start?(): Promise<void>;
  storeAppCheckpoint(data: AppSessionCheckpoint): Promise<string>;
  retrieveAppCheckpoint(id: string): Promise<StoredAppCheckpoint | null>;
  listAppCheckpoints(): Promise<AppSessionListItem[]>;
  retrieveLatestAppCheckpoint(): Promise<StoredAppCheckpoint | null>;
}
```

### RPC Endpoints

This package does not define RPC endpoints directly. It provides storage services that are used by other packages implementing RPC functionality.

### Usage Examples

#### Direct Usage - Agent Checkpoints

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';
import type { NamedAgentCheckpoint } from "@tokenring-ai/checkpoint/AgentCheckpointStorage";

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

await storage.start();

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

#### Direct Usage - App Checkpoints

```typescript
import { SQLiteStorage } from '@tokenring-ai/drizzle-storage';
import type { AppSessionCheckpoint } from "@tokenring-ai/checkpoint/AppCheckpointStorage";

const storage = new SQLiteStorage({
  type: "sqlite",
  databasePath: "./app_state.db"
});

await storage.start();

// Store an app checkpoint
const appCheckpoint: AppSessionCheckpoint = {
  sessionId: "app-session-1",
  hostname: "localhost",
  projectDirectory: "/path/to/project",
  state: { projectDirectory: "/path/to/project", files: [] },
  createdAt: Date.now()
};

const id = await storage.storeAppCheckpoint(appCheckpoint);
console.log('App checkpoint stored with ID:', id);

// Retrieve the latest app checkpoint
const latest = await storage.retrieveLatestAppCheckpoint();
console.log('Latest app checkpoint:', latest);
```

#### Using the Plugin

```javascript
// .tokenring/coder-config.mjs
export default {
  drizzleStorage: {
    type: "sqlite",
    databasePath: "./agent_state.db"
  }
};
```

The plugin automatically:

1. Creates the appropriate storage instance based on configuration
2. Registers it as a service in the app
3. Connects it to both `AgentCheckpointService` and `AppCheckpointService`

### Testing

Run the comprehensive test suite with Bun runtime:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

**Note:** Tests require Bun runtime because the SQLite implementation uses `bun:sqlite`. MySQL and PostgreSQL tests are currently skipped as they require Docker/testcontainers.

### Dependencies

#### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Token Ring application framework |
| `@tokenring-ai/checkpoint` | 0.2.0 | Checkpoint interfaces |
| `drizzle-orm` | ^0.45.2 | Type-safe ORM |
| `mysql2` | ^3.20.0 | MySQL driver |
| `postgres` | ^3.4.9 | PostgreSQL driver |
| `zod` | ^4.3.6 | Schema validation |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-kit` | ^0.31.10 | Migration generator |
| `vitest` | ^4.1.1 | Testing framework |
| `bun-types` | ^1.3.11 | Bun TypeScript definitions |
| `typescript` | ^6.0.2 | TypeScript compiler |

### Schema Documentation

The package defines Zod schemas for configuration validation:

#### DrizzleStorageConfigSchema

Combined schema using discriminated union:

```typescript
const DrizzleStorageConfigSchema = z.discriminatedUnion("type", [
  sqliteStorageConfigSchema,
  postgresStorageConfigSchema,
  mysqlStorageConfigSchema
]);
```

#### SQLite Configuration Schema

```typescript
const sqliteStorageConfigSchema = z.object({
  type: z.literal("sqlite"),
  databasePath: z.string(),
  migrationsFolder: z.string().exactOptional(),
});
```

#### MySQL Configuration Schema

```typescript
const mysqlStorageConfigSchema = z.object({
  type: z.literal("mysql"),
  connectionString: z.string(),
});
```

#### PostgreSQL Configuration Schema

```typescript
const postgresStorageConfigSchema = z.object({
  type: z.literal("postgres"),
  connectionString: z.string(),
});
```

### Database Schema

All database types use the same logical schema with two tables: `AgentCheckpoints` and `AppCheckpoints`.

#### AgentCheckpoints Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer/BigInt | Auto-incrementing primary key |
| `sessionId` | Text | Session identifier |
| `agentId` | Text | Agent identifier |
| `agentType` | Text | Type of agent (e.g., "coder", "writer") |
| `name` | Text | Checkpoint name |
| `state` | Text | JSON-serialized state data |
| `createdAt` | Integer/BigInt | Unix timestamp |

#### AppCheckpoints Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer/BigInt | Auto-incrementing primary key |
| `sessionId` | Text | Session identifier |
| `hostname` | Text | Hostname of the application |
| `projectDirectory` | Text | Current working directory |
| `state` | Text | JSON-serialized state data |
| `createdAt` | Integer/BigInt | Unix timestamp |

### Project Structure

```text
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

### Scripts

| Script | Description |
|--------|-------------|
| `test` | Run all tests |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage |
| `db:generate` | Generate migrations for all databases |
| `db:generate:sqlite` | Generate SQLite migrations |
| `db:generate:postgres` | Generate PostgreSQL migrations |
| `db:generate:mysql` | Generate MySQL migrations |
| `build` | Type check with TypeScript |

### Related Components

- `@tokenring-ai/checkpoint`: Checkpoint interfaces and types
- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/coder`: Coder application (uses checkpoint storage)
- `@tokenring-ai/writer`: Writer application (uses checkpoint storage)
