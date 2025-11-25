# @tokenring-ai/drizzle-storage

A multi-database storage solution for Token Ring AI agent state checkpoints using Drizzle ORM.

## Overview

The `@tokenring-ai/drizzle-storage` package provides a robust, type-safe storage backend for managing agent state checkpoints across multiple database systems. It implements the `AgentCheckpointProvider` interface with support for SQLite (Bun), MySQL, and PostgreSQL databases.

### Key Features

- ✅ **Multi-Database Support**: SQLite, MySQL, and PostgreSQL
- ✅ **Type Safety**: Full TypeScript support with Drizzle ORM
- ✅ **Automatic Migrations**: Codebase-first approach with runtime migration application
- ✅ **Production Ready**: Connection pooling for MySQL/PostgreSQL
- ✅ **Comprehensive Testing**: Vitest with Docker containers for MySQL/PostgreSQL
- ✅ **Token Ring Integration**: Seamless integration with Token Ring AI ecosystem

## Installation

```bash
bun install @tokenring-ai/drizzle-storage
```

## Quick Start

### 1. Generate Migrations

After installation, generate the database migrations:

```bash
bun run db:generate
```

### 2. Basic Usage

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});

// Store a checkpoint
const checkpoint = {
  agentId: "agent-123",
  name: "session-1",
  state: { messages: ["Hello"], count: 1 },
  createdAt: Date.now()
};

const id = await storage.storeCheckpoint(checkpoint);

// Retrieve a checkpoint
const retrieved = await storage.retrieveCheckpoint(id);
console.log(retrieved?.state); // { messages: ["Hello"], count: 1 }

// List all checkpoints
const checkpoints = await storage.listCheckpoints();
```

## Database Support

### SQLite (Bun)

Perfect for development and small-scale applications:

```typescript
import { createSQLiteStorage } from '@tokenring-ai/drizzle-storage';

const storage = createSQLiteStorage({
  type: "sqlite",
  databasePath: "./agent_state.db"
});
```

### MySQL

Ideal for production environments with connection pooling:

```typescript
import { createMySQLStorage } from '@tokenring-ai/drizzle-storage';

const storage = createMySQLStorage({
  type: "mysql",
  connectionString: "mysql://user:password@localhost:3306/database"
});
```

### PostgreSQL

Enterprise-grade database with advanced features:

```typescript
import { createPostgresStorage } from '@tokenring-ai/drizzle-storage';

const storage = createPostgresStorage({
  type: "postgres",
  connectionString: "postgres://user:password@localhost:5432/database"
});
```

## Token Ring Configuration

Configure the storage provider in your Token Ring configuration:

```javascript
// .tokenring/coder-config.mjs
export default {
  checkpoint: {
    providers: {
      main: {
        type: "postgres",
        connectionString: process.env.DATABASE_URL
      },
      backup: {
        type: "sqlite",
        databasePath: "./backup_agent_state.db"
      }
    }
  }
};
```

## API Reference

### Factory Functions

- `createSQLiteStorage(config: SQLiteConfig): AgentCheckpointProvider`
- `createMySQLStorage(config: MySQLConfig): AgentCheckpointProvider`
- `createPostgresStorage(config: PostgresConfig): AgentCheckpointProvider`

### AgentCheckpointProvider Interface

```typescript
interface AgentCheckpointProvider {
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(id: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
}
```

### Configuration Types

```typescript
interface SQLiteConfig {
  type: "sqlite";
  databasePath: string;
}

interface MySQLConfig {
  type: "mysql";
  connectionString: string;
}

interface PostgresConfig {
  type: "postgres";
  connectionString: string;
}
```

### Data Types

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  name: string;
  state: any;
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

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer/BigInt | Auto-incrementing primary key |
| `agentId` | Text | Agent identifier |
| `name` | Text | Checkpoint name |
| `state` | Text | JSON-serialized state data |
| `createdAt` | Integer/BigInt | Unix timestamp |

## Testing

Run the comprehensive test suite with Docker containers:

```bash
bun run test
```

### Test Coverage

- ✅ SQLite: Local file-based database
- ✅ MySQL: Docker container (mysql:8.0)
- ✅ PostgreSQL: Docker container (postgres:16)
- ✅ CRUD operations for all database types
- ✅ Error handling and edge cases
- ✅ Connection management

## Development

### Scripts

- `bun run test` - Run test suite
- `bun run db:generate` - Generate database migrations
- `bun run db:generate:mysql` - Generate MySQL migrations only
- `bun run db:generate:postgres` - Generate PostgreSQL migrations only

### Project Structure

```
pkg/drizzle-storage/
├── index.ts                    # Package entry point and Token Ring integration
├── sqlite/                     # SQLite implementation
│   ├── createSQLiteStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── migrations/            # Generated migrations
├── mysql/                      # MySQL implementation
│   ├── createMySQLStorage.ts  # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── migrations/            # Generated migrations
├── postgres/                   # PostgreSQL implementation
│   ├── createPostgresStorage.ts # Factory function
│   ├── schema.ts              # Drizzle schema
│   └── migrations/            # Generated migrations
├── DrizzleAgentStateStorage.test.ts # Test suite
├── vitest.config.ts           # Test configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This documentation
```

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/chat` - Token Ring AI integration
- `drizzle-orm` - Type-safe ORM
- `mysql2` - MySQL driver
- `postgres` - PostgreSQL driver

### Development Dependencies

- `drizzle-kit` - Migration generator
- `vitest` - Testing framework
- `testcontainers` - Docker container management
- `bun-types` - TypeScript definitions for Bun

## Migration Strategy

This package uses Drizzle's codebase-first approach:

1. **Define Schema**: Schema is defined in TypeScript files
2. **Generate Migrations**: Run `bun run db:generate` to create SQL files
3. **Apply Migrations**: Migrations are automatically applied on initialization
4. **Track State**: Drizzle maintains migration history in the database

## Error Handling

The package includes comprehensive error handling:

- Database connection errors
- Invalid checkpoint data
- Non-existent checkpoint retrieval
- Migration application failures

## Performance Considerations

- **SQLite**: Single-file database, ideal for development
- **MySQL**: Connection pooling for high-performance applications
- **PostgreSQL**: Advanced features for enterprise workloads

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Add comprehensive tests for new features
3. Run `bun run db:generate` after schema changes
4. Ensure all tests pass before submitting PRs
5. Update documentation for any API changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v0.1.0

- Initial release with multi-database support
- SQLite, MySQL, and PostgreSQL implementations
- Comprehensive test suite with Docker containers
- Token Ring AI integration
- Automatic migration management