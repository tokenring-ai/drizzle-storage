# Drizzle Storage Package Documentation

## Overview

The `@tokenring-ai/drizzle-storage` package provides a multi-database storage solution using Drizzle ORM for managing agent state checkpoints in the Token Ring AI system. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases.

Key features:
- Multi-database support: Bun SQLite, MySQL, PostgreSQL
- Automatic schema migrations using Drizzle Kit
- Type-safe database operations with Drizzle ORM
- Comprehensive test coverage with Docker containers
- Unified interface across all database types

## Installation/Setup

1. Ensure Bun is installed
2. Install dependencies via `bun install` in the project root
3. Generate migrations: `bun run db:generate`
4. Configure your database connection in the Token Ring config

## Package Structure

- **`index.ts`**: Package entry point with TokenRingPackage integration
- **`sqlite/`**: SQLite implementation with schema and migrations
- **`mysql/`**: MySQL implementation with schema and migrations
- **`postgres/`**: PostgreSQL implementation with schema and migrations
- **`DrizzleAgentStateStorage.test.ts`**: Vitest tests with testcontainers
- **`vitest.config.ts`**: Test configuration
- **`package.json`**: Package metadata and dependencies
- **`README.md`**: This documentation
- **`LICENSE`**: MIT license

## Core Components

### Storage Factory Functions

The package provides separate factory functions for each database type, all implementing the `AgentCheckpointProvider` interface.

**Factory Functions**:
- `createSQLiteStorage(config: { type: "sqlite", databasePath: string }): AgentCheckpointProvider`
- `createMySQLStorage(config: { type: "mysql", connectionString: string }): AgentCheckpointProvider`
- `createPostgresStorage(config: { type: "postgres", connectionString: string }): AgentCheckpointProvider`

**AgentCheckpointProvider Methods**:
- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>` - Stores checkpoint, returns ID
- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>` - Retrieves by ID
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>` - Lists all checkpoints

### Schema

All databases use the same logical schema:
- `id`: Auto-incrementing primary key
- `agentId`: Agent identifier (TEXT)
- `name`: Checkpoint name (TEXT)
- `state`: JSON-serialized state (TEXT)
- `createdAt`: Timestamp (INTEGER/BIGINT)

### Migrations

Migrations are automatically applied on initialization. To generate new migrations after schema changes:

```bash
bun run db:generate
```

## Usage Examples

### SQLite

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage/sqlite/createSQLiteStorage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

const checkpoint = {
  agentId: "agent-123",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);
const retrieved = await storage.retrieveCheckpoint(id);
```

### MySQL

```typescript
import { createMySQLStorage } from '@tokenring-ai/drizzle-storage/mysql/createMySQLStorage';

const storage = createMySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:pass@localhost:3306/dbname"
});
```

### PostgreSQL

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage/postgres/createPostgresStorage';

const storage = createPostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:pass@localhost:5432/dbname"
});
```

### Token Ring Configuration

```javascript
// .tokenring/coder-config.mjs
export default {
  checkpoint: {
    providers: {
      main: {
        type: "postgres",
        connectionString: process.env.DATABASE_URL
      }
    }
  }
};
```

## Testing

Run tests with automatic Docker container provisioning:

```bash
bun run test
```

Tests cover:
- SQLite with local file database
- MySQL with testcontainers
- PostgreSQL with testcontainers
- CRUD operations for all database types
- Edge cases (non-existent records, etc.)

## Configuration Options

### SQLite
- `type`: `"sqlite"`
- `databasePath`: Path to SQLite file

### MySQL
- `type`: `"mysql"`
- `connectionString`: MySQL connection string (format: `mysql://user:pass@host:port/db`)

### PostgreSQL
- `type`: `"postgres"`
- `connectionString`: PostgreSQL connection string (format: `postgres://user:pass@host:port/db`)

## API Reference

### Factory Functions
- `createSQLiteStorage(config: { type: "sqlite", databasePath: string }): AgentCheckpointProvider`
- `createMySQLStorage(config: { type: "mysql", connectionString: string }): AgentCheckpointProvider`
- `createPostgresStorage(config: { type: "postgres", connectionString: string }): AgentCheckpointProvider`

### AgentCheckpointProvider Interface
- `storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>`
- `retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>`
- `listCheckpoints(): Promise<AgentCheckpointListItem[]>`

### Types
- `NamedAgentCheckpoint`: `{ agentId: string; name: string; state: any; createdAt: number }`
- `StoredAgentCheckpoint`: `{ id: string; name: string; agentId: string; state: any; createdAt: number }`
- `AgentCheckpointListItem`: `{ id: string; name: string; agentId: string; createdAt: number }`

## Dependencies

- `drizzle-orm`: Type-safe ORM
- `drizzle-kit`: Migration generator
- `mysql2`: MySQL driver
- `postgres`: PostgreSQL driver
- `vitest`: Testing framework
- `testcontainers`: Docker container management for tests
- `@tokenring-ai/ai-client`: Token Ring integration
- `bun:sqlite`: SQLite runtime (Bun)

## Migration Strategy

This package follows the "codebase-first" approach:

1. Define schema in TypeScript (e.g., `sqlite/schema.ts`)
2. Generate SQL migrations: `bun run db:generate`
3. Migrations auto-apply on storage initialization
4. Drizzle tracks applied migrations in the database

## Contributing

- Ensure all tests pass before submitting PRs
- Add tests for new database types or features
- Run `bun run db:generate` after schema changes
- Follow existing code patterns

## License

MIT
