# ClawSkill

**AI 智能体的技能市场 — 让技能像 npm 包一样易用**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org/)
[![CI](https://github.com/openclaw/clawskill/actions/workflows/ci.yml/badge.svg)](https://github.com/openclaw/clawskill/actions)

## 愿景

ClawSkill 是 AI 智能体的"App Store"——超级中间层，统一集成全球技能资源。

### 核心特性

- **Skill URL 标准**: `https://clawskill.com/skill/{namespace}/{name}@{version}`
- **多源聚合**: GitHub、ClawHub、MCP Registry 一站式访问
- **CLI 原生**: `clawskill install openclaw/weather`
- **企业级托管**: 私有技能、安全扫描、合规审计

## 快速开始

### 安装 CLI

```bash
# 从源码安装
go install github.com/openclaw/clawskill/cmd/clawskill@latest

# 或使用 Homebrew
brew install openclaw/tap/clawskill
```

### 基本使用

```bash
# 搜索技能
clawskill search "weather forecast"

# 安装技能
clawskill install openclaw/weather

# 获取技能信息
clawskill show openclaw/weather

# 发布技能
clawskill publish ./my-skill
```

### Skill URL API

```bash
# 获取技能元数据（机器可读）
curl https://api.clawskill.com/skill/openclaw/weather

# 响应示例
{
  "id": "openclaw/weather@1.0.0",
  "name": "weather",
  "version": "1.0.0",
  "description": "Weather forecasting via wttr.in",
  "install_command": "openclaw clawhub install weather"
}
```

## 项目结构

```
clawskill/
├── cmd/                    # 命令行入口
│   ├── clawskill/          # CLI 工具
│   └── server/             # API 服务器
├── internal/               # 内部实现
│   ├── skill/              # 技能核心服务
│   ├── search/             # 搜索服务
│   ├── registry/           # 注册表服务
│   ├── security/           # 安全服务
│   └── user/               # 用户服务
├── pkg/                    # 公共库
│   ├── skillurl/           # Skill URL 解析
│   ├── parser/             # SKILL.md 解析器
│   └── resolver/           # 依赖解析
├── api/                    # API 定义
│   └── openapi.yaml        # OpenAPI 规范
├── docs/                   # 文档
├── migrations/             # 数据库迁移
└── deployments/            # 部署配置
```

## 开发

### 环境要求

- Go 1.22+
- PostgreSQL 15+
- Redis 7+
- Docker (可选)

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/openclaw/clawskill.git
cd clawskill

# 安装依赖
go mod download

# 运行测试
make test

# 启动开发服务器
make dev
```

### 运行测试

```bash
# 单元测试
make test

# 集成测试
make test-integration

# 覆盖率报告
make coverage
```

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    Agent 消费层                           │
│           (OpenClaw, LangChain, AutoGPT, 等)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Skill URL 接口层                        │
│           GET /skill/{org}/{name} - 机器可读              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  ClawSkill 核心层                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 技能发现引擎  │  │ 技能索引服务  │  │ 版本管理器    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   技能源层                               │
│    GitHub  │  ClawHub  │  MCP Registry  │  自定义源     │
└─────────────────────────────────────────────────────────┘
```

## 路线图

### v0.1.0 (MVP) - ✅ 完成

- [x] Skill URL 标准 (`pkg/skillurl/`)
- [x] 基础 API 服务 (`cmd/server/`, `internal/handler/`)
- [x] GitHub 集成 (`internal/registry/github/`)
- [x] CLI 工具 (`cmd/clawskill/`)
- [x] 基础搜索 (`internal/search/`)
- [x] SKILL.md 解析器 (`pkg/parser/`)
- [x] 安全扫描 (`internal/security/`)
- [x] 同步引擎 (`internal/registry/syncer.go`)
- [x] 配置管理 (`internal/config/`)
- [x] 结构化日志 (`internal/logger/`)
- [x] Docker Compose 部署
- [x] 测试覆盖率 > 70%

### v0.2.0 (Beta)

- [ ] 多源集成 (ClawHub, MCP)
- [ ] 版本管理增强
- [ ] 依赖解析 (`pkg/resolver/`)
- [ ] 语义搜索

### v1.0.0 (Production)

- [ ] 高可用架构
- [ ] 企业级功能
- [ ] 私有技能托管
- [ ] 完整文档

## 测试覆盖率

| 包 | 覆盖率 |
|---|-------|
| internal/config | 98.2% |
| internal/search | 100.0% |
| internal/security | 92.3% |
| internal/skill | 89.6% |
| internal/client | 85.4% |
| internal/registry | 72.7% |
| pkg/parser | 95.0% |
| pkg/skillurl | 97.4% |
| internal/middleware | 97.5% |
| internal/logger | 91.7% |

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 许可证

[MIT License](./LICENSE)

## 联系

- GitHub Issues: https://github.com/openclaw/clawskill/issues
- Discord: https://discord.gg/clawd
- Email: support@clawskill.com