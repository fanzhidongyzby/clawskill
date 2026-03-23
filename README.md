# ClawSkill

**AI 智能体的技能市场 — 让技能像 npm 包一样易用**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node-22+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## 技术栈

- **运行时**: Node.js 22+
- **包管理**: pnpm
- **框架**: Fastify 5
- **CLI**: Commander.js
- **测试**: Vitest
- **构建**: tsup
- **TypeScript**: strict mode

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/openclaw/clawskill.git
cd clawskill

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建
pnpm build
```

### CLI 使用

```bash
# 搜索技能
pnpm cli search weather

# 查看技能详情
pnpm cli show openclaw/weather

# 安装技能
pnpm cli install openclaw/weather

# 发布技能
pnpm cli publish ./my-skill --dry-run

# 启动 API 服务器
pnpm cli server
```

### API 服务器

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build && pnpm start
```

API 文档: http://localhost:8080/docs

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/v1/skills` | 列出技能 |
| POST | `/api/v1/skills` | 创建技能 |
| GET | `/api/v1/skills/:ns/:name` | 获取技能 |
| PUT | `/api/v1/skills/:ns/:name` | 更新技能 |
| DELETE | `/api/v1/skills/:ns/:name` | 删除技能 |
| GET | `/api/v1/skills/:ns/:name/versions` | 列出版本 |
| POST | `/api/v1/skills/:ns/:name/versions` | 发布版本 |
| GET | `/skill/:ns/:name` | Skill URL API |

## 项目结构

```
clawskill/
├── src/
│   ├── cli/           # CLI 实现
│   ├── core/          # 核心业务逻辑
│   │   ├── parser.ts      # SKILL.md 解析
│   │   ├── skill-service.ts
│   │   └── skill-url.ts   # Skill URL 解析
│   ├── server/        # Fastify 服务器
│   │   ├── config.ts
│   │   ├── index.ts
│   │   └── routes/
│   ├── types/         # TypeScript 类型
│   └── index.ts       # 主入口
├── dist/              # 构建输出
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## 测试覆盖率

| 模块 | 测试数 | 状态 |
|------|--------|------|
| parser | 8 | ✅ |
| skill-url | 16 | ✅ |
| skill-service | 20 | ✅ |
| server/routes | 11 | ✅ |
| server/config | 4 | ✅ |
| **总计** | **59** | ✅ |

```bash
pnpm test:coverage
```

## Skill URL 格式

```
namespace/name
namespace/name@version
https://clawskill.com/skill/namespace/name
https://clawskill.com/skill/namespace/name@version
```

## SKILL.md 格式

```yaml
---
name: weather
namespace: openclaw
version: 1.0.0
description: Get weather forecasts
author: OpenClaw Team
license: MIT
keywords:
  - weather
  - forecast
categories:
  - utility
install:
  openclaw: openclaw clawhub install weather
---

# Weather Skill

Skill documentation here...
```

## 开发

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 监听测试
pnpm test:watch

# 开发服务器 (热重载)
pnpm dev
```

## Docker

```bash
# 构建镜像
docker build -t clawskill .

# 运行容器
docker run -p 8080:8080 clawskill

# Docker Compose
docker compose up -d
```

## 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| PORT | 8080 | 服务器端口 |
| HOST | 0.0.0.0 | 服务器地址 |
| NODE_ENV | development | 环境 |
| LOG_LEVEL | info | 日志级别 |
| DB_HOST | localhost | 数据库主机 |
| DB_PORT | 5432 | 数据库端口 |
| DB_NAME | clawskill | 数据库名 |
| REDIS_HOST | localhost | Redis 主机 |

## 路线图

### v0.1.0 (MVP) - ✅ 完成

- [x] Skill URL 标准
- [x] SKILL.md 解析器
- [x] Fastify API 服务器
- [x] CLI 工具
- [x] 测试覆盖 (59 tests)

### v0.2.0 (Beta)

- [ ] PostgreSQL 集成 (Kysely)
- [ ] Redis 缓存
- [ ] GitHub 源集成
- [ ] 多源聚合

### v1.0.0 (Production)

- [ ] 高可用架构
- [ ] 企业级功能
- [ ] OpenClaw 插件集成

## 许可证

[MIT License](./LICENSE)

## 联系

- GitHub Issues: https://github.com/openclaw/clawskill/issues
- Discord: https://discord.gg/clawd