# ClawSkill - AI Agent Skill Package Manager

<div align="center">

![ClawSkill Logo](assets/logo.png)

[![npm version](https://badge.fury.io/js/clawskill.svg)](https://www.npmjs.com/package/clawskill)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/clawskill)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/openclaw/clawskill/workflows/CI/badge.svg)](https://github.com/openclaw/clawskill/actions)
[![codecov](https://codecov.io/gh/openclaw/clawskill/branch/main/graph/badge.svg)](https://codecov.io/gh/openclaw/clawskill)
[![Downloads](https://img.shields.io/npm/dm/clawskill.svg)](https://www.npmjs.com/package/clawskill)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Discord](https://img.shields.io/discord/123456789012345678?logo=discord&logoColor=white)](https://discord.gg/clawskill)
[![Code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

**🎯 The Ultimate Skill Package Manager for AI Agents**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-documentation) • [Contributing](#-contributing) • [Support](#-support)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🌟 About

> **ClawSkill** is a comprehensive skill package manager and registry designed for AI Agents. It provides a unified platform for discovering, managing, and distributing AI skills across different agent frameworks like OpenClaw, LangChain, AutoGPT, and more.

### Why ClawSkill?

🤖 **Agent-Centric**: Built specifically for AI agents and their skill ecosystem

🔍 **Smart Discovery**: Advanced search with semantic understanding and AI-powered recommendations

📦 **Dependency Management**: Automatic dependency resolution with conflict detection

🛡️ **Security First**: Built-in security scanning for vulnerabilities and secrets

🌐 **Open Standards**: Compatible with AgentSkills.io and other open standards

---

## ✨ Features

### 🔗 GitHub Integration (Priority #1)
Automatic discovery and synchronization of AI Agent skill repositories from GitHub
- Organization and user repository search
- Topic and language filtering
- Automatic SKILL.md metadata parsing
- Real-time GitHub event monitoring
- Version management and tag tracking

### 📦 Dependency Management (Priority #2)
Intelligent skill dependency resolution and management
- Dependency graph construction and topological sorting
- Version conflict detection
- Automatic installation command generation
- Multi-platform support (npm, yarn, pnpm, bun)
- Dependency tree visualization

### 🎨 Modern Web UI (Priority #3)
Beautiful and responsive user interface
- Skill browsing and search
- Skill detail pages
- Dashboard and statistics
- Responsive design
- Built with React + Vite

### 🔍 Semantic Search (Priority #4)
AI-powered intelligent search
- OpenAI Embeddings integration
- Semantic similarity matching
- Multi-dimensional filtering (category, language, stars)
- Smart ranking engine
- Skill recommendation system
- Popular search trends

### 🚀 High-Performance Search (Priority #5)
Lightning-fast search engine
- Full-text search support
- Search history
- Relevance scoring
- Cache optimization
- Pagination and sorting

### 🛡️ Security Scanning (Priority #6)
Comprehensive security audit tools
- Secret leakage detection
- Dependency vulnerability scanning
- Malicious code detection
- Security report generation
- Severity classification
- Fix recommendations

---

## 📦 Installation

### Prerequisites

- **Node.js** 22 or higher
- **PostgreSQL** 14 or higher
- **Redis** 7 or higher (optional, for caching)
- **pnpm** 10 or higher

### Install via npm

```bash
npm install -g clawskill
```

### Install via pnpm

```bash
pnpm add -g clawskill
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/openclaw/clawskill.git
cd clawskill

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link globally
pnpm link --global
```

---

## 🚀 Quick Start

### 1. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill

# GitHub Token (optional)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Key (optional, for semantic search)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Start Database

```bash
docker compose up -d postgres
```

### 3. Run Migrations

```bash
pnpm db:migrate
```

### 4. Start the Server

```bash
# Development mode
pnpm dev

# Production mode
pnpm build && pnpm start
```

The server will be available at `http://localhost:8080`

API Documentation: `http://localhost:8080/docs`

---

## 💻 Usage

### CLI Commands

#### Search Skills

```bash
clawskill search "weather"
```

#### View Skill Details

```bash
clawskill show openclaw/weather
```

#### Install a Skill

```bash
clawskill install openclaw/weather -d ./skills/weather
```

#### Publish a Skill

```bash
clawskill publish ./my-skill --api-key YOUR_KEY
```

#### Sync GitHub Skills

```bash
clawskill github:sync --topic agent-skill --limit 100
```

#### Security Scan

```bash
clawskill security:scan openclaw/weather --secrets --dependencies
```

#### Semantic Search

```bash
clawskill search:semantic "web scraping" --category productivity --limit 20
```

### API Usage

#### Search Skills

```bash
# Full-text search
curl http://localhost:8080/api/v1/search?q=weather

# Semantic search
curl -X POST http://localhost:8080/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "web scraping", "limit": 20}'
```

#### Get Skill Details

```bash
# Get skill information
curl http://localhost:8080/api/v1/skills/openclaw/weather

# Get Skill URL (AI Agent interface)
curl http://localhost:8080/skill/openclaw/weather
curl http://localhost:8080/skill/openclaw/weather@1.0.0
```

#### Create Skill

```bash
curl -X POST http://localhost:8080/api/v1/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "id": "my-org/my-skill",
    "name": "my-skill",
    "namespace": "my-org",
    "description": "My awesome skill"
  }'
```

#### Security Scan

```bash
# Start full scan
curl -X POST http://localhost:8080/api/v1/security/scan \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "openclaw/weather",
    "version": "1.0.0",
    "options": {
      "scanSecrets": true,
      "scanDependencies": true
    }
  }'

# Get scan results
curl http://localhost:8080/api/v1/security/scan/SCAN_ID
```

### Web UI

```bash
cd web-ui
pnpm install
pnpm dev
```

The Web UI will be available at `http://localhost:5173`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ========================================
# Database Configuration
# ========================================
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill
CLAWSKILL_DB_HOST=localhost
CLAWSKILL_DB_PORT=5432
CLAWSKILL_DB_USER=clawskill
CLAWSKILL_DB_PASSWORD=clawskill_dev
CLAWSKILL_DB_NAME=clawskill
CLAWSKILL_DB_SSLMODE=disable

# ========================================
# Redis Cache Configuration
# ========================================
REDIS_URL=redis://localhost:6379
CLAWSKILL_REDIS_HOST=localhost
CLAWSKILL_REDIS_PORT=6379
CLAWSKILL_REDIS_DB=0

# ========================================
# GitHub Integration
# ========================================
# GitHub Personal Access Token
# Get it from: https://github.com/settings/tokens
# Permissions: repo (read), read:org, read:packages
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# OpenAI API (for semantic search)
# ========================================
# OpenAI API Key
# Get it from: https://platform.openai.com/api-keys
# Required models: text-embedding-ada-002 or text-embedding-3-small/large
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Custom OpenAI base URL (for proxy)
# OPENAI_BASE_URL=https://api.openai.com/v1

# ========================================
# Server Configuration
# ========================================
CLAWSKILL_HOST=0.0.0.0
CLAWSKILL_PORT=8080
CLAWSKILL_MODE=development
CLAWSKILL_LOG_LEVEL=info
CLAWSKILL_LOG_FORMAT=json

# CORS allowed origins (comma-separated)
CLAWSKILL_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate limiting (requests per minute)
CLAWSKILL_RATE_LIMIT_MAX=100

# ========================================
# Security Configuration
# ========================================
# JWT Secret (for API authentication)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API Admin Key
CLAWSKILL_API_KEY=your-api-key-for-admin-operations
```

### Getting GitHub Token

1. Visit https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Fill in Note (e.g., "ClawSkill")
4. Select expiration (recommended: 90 days)
5. Check permissions:
   - ✅ `repo` (full repository access)
   - ✅ `read:org` (read organization info)
   - ✅ `read:packages` (read package info)
6. Click "Generate token"
7. **Copy the token immediately** (shown only once!)

### Getting OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Log in or sign up for OpenAI
3. Click "Create new secret key"
4. Fill in description (e.g., "ClawSkill Semantic Search")
5. Click "Create secret key"
6. **Copy the key immediately** (shown only once!)

---

## 📚 API Documentation

### Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/skills` | List all skills |
| GET | `/api/v1/skills/:skillId` | Get skill details |
| POST | `/api/v1/skills` | Create a new skill |
| PUT | `/api/v1/skills/:skillId` | Update a skill |
| DELETE | `/api/v1/skills/:skillId` | Delete a skill |

### GitHub Integration API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/github/skills` | List GitHub skills |
| GET | `/api/v1/github/skills/:owner/:repo` | Get GitHub skill details |
| GET | `/api/v1/github/skills/:owner/:repo/skill-md` | Get SKILL.md |
| POST | `/api/v1/github/sync` | Sync GitHub skills |
| GET | `/api/v1/github/skills/:owner/:repo/versions` | Get version list |

### Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search` | Full-text search |
| POST | `/api/v1/search/semantic` | Semantic search |
| GET | `/api/v1/recommendations/:skillId` | Skill recommendations |
| GET | `/api/v1/search/stats` | Search statistics |
| GET | `/api/v1/search/trending` | Trending skills |

### Security Scanning API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/security/scan` | Start scan |
| GET | `/api/v1/security/scan/:scanId` | Get scan results |
| GET | `/api/v1/security/report/:skillId/:version` | Get security report |
| POST | `/api/v1/security/scan-secrets` | Scan for secrets |
| POST | `/api/v1/security/scan-dependencies` | Scan dependencies |
| GET | `/api/v1/security/stats/:skillId` | Get statistics |

### Agent-Friendly Endpoints

| Endpoint | Description | Format |
|----------|-------------|--------|
| `/skill/:namespace/:name` | Get skill (latest) | JSON |
| `/skill/:namespace/:name@:version` | Get skill (specific version) | JSON |

**Example Response:**

```json
{
  "id": "openclaw/weather@1.0.0",
  "name": "weather",
  "version": "1.0.0",
  "description": "Weather forecasting via wttr.in",
  "author": "OpenClaw Team",
  "license": "MIT",
  "skill_md_url": "https://raw.githubusercontent.com/openclaw/openclaw/master/skills/weather/SKILL.md",
  "install_command": "openclaw clawhub install weather"
}
```

For full API documentation, visit `/docs` when the server is running.

---

## 🏗️ Architecture

```
clawskill/
├── src/
│   ├── cli/              # CLI Tool
│   ├── core/             # Core Services
│   │   ├── db.ts         # Database connection
│   │   ├── storage.ts    # Package storage
│   │   └── skill-service.ts  # Skill management
│   ├── server/           # Fastify API Server
│   ├── github/           # GitHub integration
│   ├── dependency/       # Dependency management
│   ├── semantic-search/  # Semantic search
│   ├── security/         # Security scanning
│   └── types/            # TypeScript types
├── web-ui/               # React Web Application
├── migrations/           # Database migrations
├── tests/                # Test files
└── docs/                 # Documentation
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## 🚀 Deployment

### Docker Deployment

#### Using Docker Compose

```bash
# Start all services (PostgreSQL + Redis + ClawSkill)
docker compose up -d

# View logs
docker compose logs -f clawskill

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

#### Build and Run Manually

```bash
# Build Docker image
docker build -t clawskill:latest .

# Run container
docker run -d \
  --name clawskill \
  -p 8080:8080 \
  --env-file .env \
  --network host \
  clawskill:latest
```

### Local Deployment

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build project
pnpm build

# Start service
pm2 start dist/cli/index.js --name clawskill -- serve

# View status
pm2 status

# View logs
pm2 logs clawskill
```

#### Using systemd

Create `/etc/systemd/system/clawskill.service`:

```ini
[Unit]
Description=ClawSkill Service
After=network.target postgresql.service

[Service]
Type=simple
User=clawskill
WorkingDirectory=/opt/clawskill
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /opt/clawskill/dist/cli/index.js serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable clawskill
sudo systemctl start clawskill
```

### Cloud Platforms

- **Vercel**: `vercel --prod`
- **Render**: Connect GitHub repo and deploy
- **Railway**: `railway up`

### Production Checklist

- [ ] Change default secrets (JWT_SECRET, API Key)
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Setup database backup strategy
- [ ] Configure log aggregation (ELK Stack)
- [ ] Enable monitoring and alerting (Prometheus + Grafana)
- [ ] Configure rate limiting
- [ ] Enable CORS protection
- [ ] Configure CDN (Cloudflare)
- [ ] Setup automatic updates

---

## 🔐 Security

- ✅ API Key authentication
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Secret scanning
- ✅ Dependency vulnerability scanning

---

## 🗺️ Roadmap

### v0.2.0 (Q2 2026)

- [ ] Skill marketplace with ratings and reviews
- [ ] Skill versioning and rollback
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### v0.3.0 (Q3 2026)

- [ ] Skill auto-discovery from multiple sources
- [ ] Skill testing framework
- [ ] CI/CD integration
- [ ] Mobile apps (iOS/Android)

### v1.0.0 (Q4 2026)

- [ ] Enterprise features (SSO, RBAC)
- [ ] Advanced security scanning
- [ ] Custom skill templates
- [ ] Global CDN

See [ROADMAP.md](./ROADMAP.md) for more details.

---

## 🤝 Contributing

We welcome all forms of contributions!

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📖 Documentation

- [README](./README.md) - This file
- [API Documentation](./docs/API.md) - API reference
- [Developer Guide](./docs/DEVELOPER.md) - Development guide
- [User Guide](./docs/USER-GUIDE.md) - User documentation
- [Quick Start](./QUICKSTART.md) - 5-minute tutorial

---

## 🆘 Support

- 📚 [Documentation](./SUPPORT.md)
- 💬 [Discord](https://discord.gg/clawskill)
- 📝 [GitHub Discussions](https://github.com/openclaw/clawskill/discussions)
- 🐛 [GitHub Issues](https://github.com/openclaw/clawskill/issues)

---

## 📊 Project Stats

<div align="center">

![GitHub Stars](https://img.shields.io/github/stars/openclaw/clawskill?style=social)
![GitHub Forks](https://img.shields.io/github/forks/openclaw/clawskill?style=social)
![GitHub Issues](https://img.shields.io/github/issues/openclaw/clawskill)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/openclaw/clawskill)
![npm weekly downloads](https://img.shields.io/npm/dw/clawskill)

</div>

---

## 📄 License

[MIT](./LICENSE) © OpenClaw Team

---

## 🙏 Acknowledgments

Special thanks to:

- [OpenClaw](https://github.com/openclaw) - AI Agent platform
- [Fastify](https://fastify.io/) - High-performance web framework
- [Kysely](https://kysely.dev/) - Type-safe SQL query builder
- [Vitest](https://vitest.dev/) - Blazing fast test framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript that scales
- All [contributors](https://github.com/openclaw/clawskill/graphs/contributors)

---

<div align="center">

**Made with ❤️ by OpenClaw Team**

[⬆ Back to top](#clawskill---ai-agent-skill-package-manager)

</div>