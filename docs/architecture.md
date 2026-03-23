# ClawSkill Architecture

**Version**: 1.0
**Last Updated**: 2026-03-23
**Status**: Active Development

## Overview

ClawSkill is the skill package manager for AI agents. It provides a centralized registry for discovering, installing, and managing skills that extend the capabilities of AI systems like OpenClaw.

## Core Concepts

### Skill

A skill is a reusable capability that can be installed into an AI agent. Each skill is defined by a `SKILL.md` file containing:

- **Metadata**: YAML frontmatter with name, version, description, author, etc.
- **Documentation**: Markdown content describing the skill's functionality
- **Configuration**: Optional environment variables and dependencies

### Skill URL

Skills are addressed using a standardized URL format:

```
skill://{namespace}/{name}[@{version}]
https://clawskill.com/skill/{namespace}/{name}[@{version}]
```

Examples:
- `skill://openclaw/weather` - Latest version
- `skill://openclaw/weather@1.2.0` - Specific version
- `skill://openclaw/weather@^1.0.0` - Version range

### Registry

The registry is the central service that stores and serves skill metadata. It supports multiple sources:

- **GitHub**: Primary source for open-source skills
- **ClawHub**: Official curated skill repository
- **MCP Registry**: Model Context Protocol skills
- **Custom**: Enterprise/private registries

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  CLI (clawskill)  │  Web UI  │  AI Agent (OpenClaw)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  - Authentication  - Rate Limiting  - Request Routing       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│ Skill Svc   │ Search Svc  │ Registry    │ Security Svc     │
│             │             │ Syncer      │                  │
│ - CRUD      │ - Full-text │ - GitHub    │ - Permissions    │
│ - Versions  │ - Semantic  │ - ClawHub   │ - Vulnerabilities│
│ - Deps      │ - Recommend │ - MCP       │ - Secrets        │
└─────────────┴─────────────┴─────────────┴──────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────┬───────────────────────────────────────┤
│ PostgreSQL          │ Redis                                 │
│ - Skill metadata    │ - Cache                               │
│ - Version history   │ - Rate limits                         │
│ - User data         │ - Sessions                            │
└─────────────────────┴───────────────────────────────────────┘
```

## Module Structure

```
clawskill/
├── cmd/
│   ├── clawskill/      # CLI entry point
│   └── server/         # API server entry point
│
├── internal/
│   ├── client/         # API client for CLI
│   ├── handler/        # HTTP handlers
│   ├── middleware/     # HTTP middleware
│   ├── registry/       # Skill source integration
│   │   ├── source.go   # Source interface
│   │   ├── syncer.go   # Sync engine
│   │   └── github/     # GitHub adapter
│   ├── repository/     # Data persistence
│   ├── search/         # Search engine
│   ├── security/       # Security scanning
│   └── skill/          # Skill domain logic
│
├── pkg/
│   ├── parser/         # SKILL.md parser
│   └── skillurl/       # Skill URL utilities
│
├── config/             # Configuration files
├── migrations/         # Database migrations
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

## Key Components

### 1. Parser (`pkg/parser`)

Parses SKILL.md files into structured data:

```go
type ParsedSkill struct {
    Metadata *SkillMetadata
    Body     string
    Sections map[string]string
}
```

### 2. Registry Syncer (`internal/registry/syncer.go`)

Orchestrates skill synchronization from multiple sources:

- Incremental sync based on last sync time
- Concurrent source processing
- Error handling and metrics tracking
- Graceful start/stop

### 3. Security Scanner (`internal/security`)

Multi-scanner security framework:

- Permission analysis
- Secret detection
- Vulnerability scanning
- Content pattern matching

### 4. Search Engine (`internal/search`)

In-memory search with indexing:

- Full-text search
- Memory-based indexing for fast lookups
- Extensible for external search backends

### 5. Skill Service (`internal/skill`)

Core business logic for skill management:

- CRUD operations
- Version management
- Dependency resolution

## API Endpoints

### Skill Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/skills` | List skills |
| GET | `/api/v1/skills/{namespace}/{name}` | Get skill details |
| POST | `/api/v1/skills` | Create skill |
| PUT | `/api/v1/skills/{namespace}/{name}` | Update skill |
| DELETE | `/api/v1/skills/{namespace}/{name}` | Delete skill |

### Version Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/skills/{namespace}/{name}/versions` | List versions |
| GET | `/skills/{namespace}/{name}/versions/{version}` | Get version |
| POST | `/skills/{namespace}/{name}/versions` | Publish version |

### Skill URL (AI Agent Interface)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/skill/{namespace}/{name}` | Get latest version |
| GET | `/skill/{namespace}/{name}@{version}` | Get specific version |

## Data Models

### Skill

```go
type Skill struct {
    ID          string    // {namespace}/{name}
    Name        string
    Namespace   string
    Description string
    Author      string
    License     string
    Keywords    []string
    Categories  []string
    LatestVer   string
    Downloads   int64
    Stars       int64
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### Version

```go
type Version struct {
    ID          string
    SkillID     string
    Version     string      // SemVer
    Description string
    Changelog   string
    SkillMDUrl  string
    SkillMDHash string
    Dependencies []Dependency
    PublishedAt time.Time
    Deprecated  bool
    Yanked      bool
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAWSKILL_HOST` | Server host | `0.0.0.0` |
| `CLAWSKILL_PORT` | Server port | `8080` |
| `CLAWSKILL_DB_HOST` | Database host | `localhost` |
| `CLAWSKILL_DB_PORT` | Database port | `5432` |
| `CLAWSKILL_DB_NAME` | Database name | `clawskill` |
| `CLAWSKILL_REDIS_HOST` | Redis host | `localhost` |
| `GITHUB_TOKEN` | GitHub API token | - |

## Deployment

### Docker Compose

```bash
docker-compose up -d
```

Services:
- `postgres`: PostgreSQL 16
- `redis`: Redis 7
- `api`: ClawSkill API server

### Health Check

```bash
curl http://localhost:8080/health
```

## Testing

Run all tests:
```bash
go test ./... -cover
```

Current coverage:
- `internal/registry`: 72.7%
- `internal/search`: 100%
- `internal/security`: 92.3%
- `internal/skill`: 89.6%
- `pkg/parser`: 95.0%
- `pkg/skillurl`: 97.4%

## Future Enhancements

1. **Vector Search**: Semantic skill matching using embeddings
2. **Web UI**: React-based skill browser
3. **Plugin System**: Extensible scanner and source plugins
4. **Rate Limiting**: Per-user and global rate limits
5. **Audit Logging**: Comprehensive action logging
6. **Multi-tenancy**: Organization namespaces with RBAC

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.