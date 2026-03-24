# ClawSkill - AI Agent Skill Package Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/clawskill)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

> **🎯 ClawSkill 是独立产品 - AI Agent 技能包管理器与注册中心**

> ⚠️ **重要说明**: ClawSkill 是独立的产品，不属于 OpenMind 公司或任何其他组织的功能模块。它是一个开源的 AI Agent 技能生态平台，旨在为全球 AI Agent 开发者和用户提供统一的技能管理和分发服务。

## ✨ 功能特性

### 1. 🔗 GitHub 源集成 (Priority #1)
从 GitHub 自动发现、同步和管理 AI Agent 技能仓库
- 支持组织和用户仓库搜索
- 主题和语言过滤
- 自动解析 SKILL.md 元数据
- 实时监听 GitHub 事件
- 版本管理和标签追踪

### 2. 📦 依赖管理 (Priority #2)
智能的技能依赖解析和管理
- 依赖图构建和拓扑排序
- 版本冲突检测
- 自动安装命令生成
- 支持多平台（npm, yarn, pnpm, bun）
- 依赖树可视化

### 3. 🎨 Web UI (Priority #3)
现代化的用户界面
- 技能浏览和搜索
- 技能详情展示
- 仪表板和统计
- 响应式设计
- 基于 React + Vite

### 4. 🔍 语义搜索 (Priority #4)
基于向量嵌入的智能搜索
- OpenAI Embeddings 集成
- 语义相似度匹配
- 多维度过滤（分类、语言、星数）
- 智能排序引擎
- 技能推荐系统
- 热门搜索趋势

### 5. 🚀 技能搜索优化 (Priority #5)
高性能搜索引擎
- 全文搜索支持
- 搜索历史记录
- 相关性评分
- 缓存优化
- 分页和排序

### 6. 🛡️ 安全扫描 (Priority #6)
全面的安全审计工具
- 密钥泄漏检测
- 依赖漏洞扫描
- 恶意代码检测
- 安全报告生成
- 严重性分级
- 修复建议

## 📦 安装

```bash
# 使用 pnpm 安装
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+ (可选，用于缓存)

### 1. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill

# GitHub Token (可选，用于 GitHub 集成)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Key (可选，用于语义搜索)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. 启动数据库

使用 Docker Compose 启动 PostgreSQL：

```bash
docker compose up -d postgres
```

### 3. 运行数据库迁移

```bash
pnpm db:migrate
```

### 4. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

服务将在 `http://localhost:8080` 启动

API 文档: `http://localhost:8080/docs`

### 使用 CLI

```bash
# 搜索技能
clawskill search "weather"

# 查看技能详情
clawskill show openclaw/weather

# 安装技能
clawskill install openclaw/weather -d ./skills/weather

# 发布技能
clawskill publish ./my-skill --api-key YOUR_KEY

# 同步 GitHub 技能
clawskill github:sync --topic agent-skill --limit 100

# 安全扫描
clawskill security:scan openclaw/weather --secrets --dependencies

# 语义搜索
clawskill search:semantic "web scraping" --category productivity --limit 20
```

### API 使用示例

#### 搜索技能

```bash
# 全文搜索
curl http://localhost:8080/api/v1/search?q=weather

# 语义搜索
curl -X POST http://localhost:8080/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "web scraping", "limit": 20}'
```

#### 获取技能详情

```bash
# 获取技能信息
curl http://localhost:8080/api/v1/skills/openclaw/weather

# 获取 Skill URL (AI Agent 接口)
curl http://localhost:8080/skill/openclaw/weather
curl http://localhost:8080/skill/openclaw/weather@1.0.0
```

#### 创建技能

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

#### 安全扫描

```bash
# 启动完整扫描
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

# 获取扫描结果
curl http://localhost:8080/api/v1/security/scan/SCAN_ID
```

### 启动 Web UI

```bash
cd web-ui
pnpm install
pnpm dev
```

Web UI 将在 `http://localhost:5173` 启动

## 🏗️ 架构

```
clawskill/
├── src/
│   ├── core/           # 核心服务（数据库、存储、技能管理）
│   ├── server/         # Fastify API 服务器
│   ├── cli/            # 命令行工具
│   ├── github/         # GitHub 源集成
│   ├── dependency/     # 依赖管理
│   ├── semantic-search/# 语义搜索
│   ├── security/       # 安全扫描
│   └── types/          # TypeScript 类型定义
├── web-ui/             # React Web 应用
├── migrations/         # 数据库迁移
└── tests/              # 测试文件
```

## 🔧 配置

### 环境变量

创建 `.env` 文件在项目根目录：

```bash
# ========================================
# 数据库配置
# ========================================
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill
CLAWSKILL_DB_HOST=localhost
CLAWSKILL_DB_PORT=5432
CLAWSKILL_DB_USER=clawskill
CLAWSKILL_DB_PASSWORD=clawskill_dev
CLAWSKILL_DB_NAME=clawskill
CLAWSKILL_DB_SSLMODE=disable

# ========================================
# Redis 缓存配置
# ========================================
REDIS_URL=redis://localhost:6379
CLAWSKILL_REDIS_HOST=localhost
CLAWSKILL_REDIS_PORT=6379
CLAWSKILL_REDIS_DB=0

# ========================================
# GitHub 集成
# ========================================
# GitHub Personal Access Token (需要仓库访问权限)
# 获取方式: https://github.com/settings/tokens
# 权限: repo (read), read:org, read:packages
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# OpenAI API (用于语义搜索)
# ========================================
# OpenAI API Key (用于生成嵌入向量)
# 获取方式: https://platform.openai.com/api-keys
# 需要: text-embedding-ada-002 或 text-embedding-3-small/large 模型权限
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选: 自定义 OpenAI 基础 URL (如果使用代理)
# OPENAI_BASE_URL=https://api.openai.com/v1

# ========================================
# 服务器配置
# ========================================
CLAWSKILL_HOST=0.0.0.0
CLAWSKILL_PORT=8080
CLAWSKILL_MODE=development
CLAWSKILL_LOG_LEVEL=info
CLAWSKILL_LOG_FORMAT=json

# CORS 允许的来源 (逗号分隔)
CLAWSKILL_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 速率限制 (每分钟请求数)
CLAWSKILL_RATE_LIMIT_MAX=100

# ========================================
# 安全配置
# ========================================
# JWT Secret (用于 API 认证)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API 管理员密钥
CLAWSKILL_API_KEY=your-api-key-for-admin-operations
```

### 获取 GITHUB_TOKEN

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 填写 Note (如 "ClawSkill")
4. 选择过期时间 (建议选择 90 天)
5. 勾选权限:
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `read:org` (读取组织信息)
   - ✅ `read:packages` (读取包信息)
6. 点击 "Generate token"
7. **立即复制 token** (只显示一次!)

### 获取 OPENAI_API_KEY

1. 访问 https://platform.openai.com/api-keys
2. 登录或注册 OpenAI 账户
3. 点击 "Create new secret key"
4. 填写描述 (如 "ClawSkill Semantic Search")
5. 点击 "Create secret key"
6. **立即复制 key** (只显示一次!)

### 服务器配置

编辑 `src/server/config.ts`:

```typescript
export const config = {
  port: 8080,
  host: '0.0.0.0',
  corsOrigins: ['http://localhost:5173'],
  rateLimitMax: 100,
  logLevel: 'info',
};
```

## 📚 API 文档

### 核心 API

- `GET /api/v1/skills` - 列出技能
- `GET /api/v1/skills/:skillId` - 获取技能详情
- `POST /api/v1/skills` - 创建技能
- `PUT /api/v1/skills/:skillId` - 更新技能
- `DELETE /api/v1/skills/:skillId` - 删除技能

### GitHub 集成 API

- `GET /api/v1/github/skills` - 列出 GitHub 技能
- `GET /api/v1/github/skills/:owner/:repo` - 获取技能详情
- `GET /api/v1/github/skills/:owner/:repo/skill-md` - 获取 SKILL.md
- `POST /api/v1/github/sync` - 同步 GitHub 技能
- `GET /api/v1/github/skills/:owner/:repo/versions` - 获取版本列表

### 搜索 API

- `GET /api/v1/search` - 全文搜索
- `POST /api/v1/search/semantic` - 语义搜索
- `GET /api/v1/recommendations/:skillId` - 技能推荐
- `GET /api/v1/search/stats` - 搜索统计
- `GET /api/v1/search/trending` - 热门技能

### 安全扫描 API

- `POST /api/v1/security/scan` - 启动扫描
- `GET /api/v1/security/scan/:scanId` - 获取扫描结果
- `GET /api/v1/security/report/:skillId/:version` - 获取安全报告
- `POST /api/v1/security/scan-secrets` - 扫描密钥
- `POST /api/v1/security/scan-dependencies` - 扫描依赖
- `GET /api/v1/security/stats/:skillId` - 获取统计

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 📊 数据库

运行迁移：

```bash
pnpm db:migrate
```

填充种子数据：

```bash
pnpm db:seed
```

## 🚀 部署

### Docker 部署

#### 1. 使用 Docker Compose

```bash
# 启动所有服务（PostgreSQL + Redis + ClawSkill）
docker compose up -d

# 查看日志
docker compose logs -f clawskill

# 停止服务
docker compose down

# 停止并删除数据卷
docker compose down -v
```

#### 2. 单独构建和运行

```bash
# 构建 Docker 镜像
docker build -t clawskill:latest .

# 运行容器
docker run -d \
  --name clawskill \
  -p 8080:8080 \
  --env-file .env \
  --network host \
  clawskill:latest
```

#### 3. Docker Compose 配置

`docker-compose.yml` 示例：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: clawskill-postgres
    environment:
      POSTGRES_USER: clawskill
      POSTGRES_PASSWORD: clawskill_dev
      POSTGRES_DB: clawskill
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clawskill"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: clawskill-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  clawskill:
    build: .
    container_name: clawskill
    ports:
      - "8080:8080"
    environment:
      - CLAWSKILL_DB_HOST=postgres
      - CLAWSKILL_DB_PASSWORD=clawskill_dev
      - CLAWSKILL_REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./storage:/app/storage
    restart: unless-stopped

volumes:
  postgres-data:
```

### 本地部署

#### 1. 使用 PM2（生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
pnpm build

# 启动服务
pm2 start dist/cli/index.js --name clawskill -- serve

# 查看状态
pm2 status

# 查看日志
pm2 logs clawskill

# 重启服务
pm2 restart clawskill

# 停止服务
pm2 stop clawskill
```

#### 2. 使用 systemd（Linux）

创建 `/etc/systemd/system/clawskill.service`：

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

启用和启动服务：

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable clawskill

# 启动服务
sudo systemctl start clawskill

# 查看状态
sudo systemctl status clawskill

# 查看日志
sudo journalctl -u clawskill -f
```

#### 3. 使用 Nginx 反向代理

Nginx 配置 `/etc/nginx/sites-available/clawskill`：

```nginx
server {
    listen 80;
    server_name clawskill.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:8080;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/clawskill /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 云平台部署

#### Vercel 部署

1. 创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/cli/index.js"
    }
  ]
}
```

2. 部署：

```bash
vercel --prod
```

#### Render 部署

1. 在 Render 创建 Web Service
2. 连接 GitHub 仓库
3. 配置环境变量
4. 部署

#### Railway 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 添加 PostgreSQL
railway add postgresql

# 添加 Redis
railway add redis

# 部署
railway up
```

### 生产环境检查清单

- [ ] 修改默认密钥（JWT_SECRET, API Key）
- [ ] 启用 HTTPS（使用 Let's Encrypt）
- [ ] 配置防火墙规则
- [ ] 设置数据库备份策略
- [ ] 配置日志聚合（如 ELK Stack）
- [ ] 启用监控和告警（Prometheus + Grafana）
- [ ] 配置速率限制
- [ ] 启用 CORS 保护
- [ ] 配置 CDN（如 Cloudflare）
- [ ] 设置自动更新策略

## 🔐 安全

- API Key 认证
- 速率限制
- CORS 保护
- Helmet 安全头
- SQL 注入防护
- XSS 防护

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT](./LICENSE)

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw) - AI Agent 平台
- [Fastify](https://fastify.io/) - 高性能 Web 框架
- [Kysely](https://kysely.dev/) - 类型安全的 SQL 查询构建器
- [Octokit](https://github.com/octokit) - GitHub API 客户端

---

Made with ❤️ by OpenClaw Team