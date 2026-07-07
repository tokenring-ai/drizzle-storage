# @tokenring-ai/bun-storage

## Overview

`@tokenring-ai/bun-storage` provides checkpoint persistence for TokenRing agents and app sessions. It implements both `AgentCheckpointStorage` and `AppCheckpointStorage` using Bun's native `SQL` client.

SQLite, MySQL, and PostgreSQL are supported through one provider. The database dialect is detected from the connection string, matching Bun's SQL URL handling:

- `sqlite://...`, `sqlite:...`, `file://...`, `file:...`, and `:memory:` use SQLite
- `mysql://...` and `mysql2://...` use MySQL
- everything else falls back to PostgreSQL

## Installation

```bash
bun add @tokenring-ai/bun-storage
```

## Configuration

```yaml
bunStorage:
  connectionString: "sqlite://./agent_state.db"
```

Examples:

```yaml
bunStorage:
  connectionString: "sqlite://./agent_state.db"
```

```yaml
bunStorage:
  connectionString: "mysql://user:password@localhost:3306/database"
```

```yaml
bunStorage:
  connectionString: "postgres://user:password@localhost:5432/database"
```

### Options

| Option             | Type     | Required | Description                                      |
|--------------------|----------|----------|--------------------------------------------------|
| `connectionString` | `string` | Yes      | Bun SQL connection string                        |
| `migrationsFolder` | `string` | No       | Reserved for migration support; currently unused |

This package does not define environment variables directly. Any environment-driven database configuration should be resolved before constructing the plugin config.

## API

```typescript
import { BunStorage } from "@tokenring-ai/bun-storage";

const storage = new BunStorage({
  connectionString: "sqlite://./agent_state.db",
});

await storage.start();
const id = await storage.storeAgentCheckpoint(checkpoint);
const stored = await storage.retrieveAgentCheckpoint(id);
await storage.stop();
```

### Exports

- `BunStorage`
- `bunStorageConfigSchema`
- `BunStorageConfigSchema`
- `detectDatabaseDialect`
- `BunStorageConfig`

## Database Schema

The provider creates two tables on `start()`.

### AgentCheckpoints

| Column      | Type           | Description                   |
|-------------|----------------|-------------------------------|
| `id`        | Integer/BigInt | Auto-increment primary key    |
| `sessionId` | Text           | Session identifier            |
| `agentId`   | Text           | Agent identifier              |
| `agentType` | Text           | Agent type                    |
| `name`      | Text           | Checkpoint name               |
| `state`     | Text           | JSON-serialized state payload |
| `createdAt` | Integer/BigInt | Unix timestamp                |

### AppCheckpoints

| Column             | Type           | Description                   |
|--------------------|----------------|-------------------------------|
| `id`               | Integer/BigInt | Auto-increment primary key    |
| `sessionId`        | Text           | Session identifier            |
| `hostname`         | Text           | Hostname                      |
| `projectDirectory` | Text           | Project directory             |
| `state`            | Text           | JSON-serialized state payload |
| `createdAt`        | Integer/BigInt | Unix timestamp                |

## Development

```bash
bun test
bun run build
```

The runtime implementation lives in `BunStorage.ts`. The `sqlite/`, `mysql/`, and `postgres/` directories contain Bun schema/config files for migration generation only.

## License

MIT License - see LICENSE for details.
