# ClawSkill 快速开始指南

本指南将帮助您在 5 分钟内快速上手 ClawSkill。

## 📋 前置要求

- Node.js 18 或更高版本
- Docker 和 Docker Compose（可选）
- GitHub Token（可选，用于 GitHub 集成）

## 🚀 快速开始（3 步）

### 步骤 1：安装依赖

```bash
# 克隆仓库
git clone https://github.com/clawskill/clawskill.git
cd clawskill

# 安装依赖
pnpm install
```

### 步骤 2：启动数据库

```bash
# 使用 Docker Compose 启动 PostgreSQL
docker compose up -d postgres

# 等待数据库启动
sleep 5

# 运行数据库迁移
pnpm db:migrate
```

### 步骤 3：启动服务

```bash
# 开发模式
pnpm dev

# 或使用生产模式
pnpm build
pnpm start
```

服务启动后，访问：
- API: http://localhost:8080
- API 文档: http://localhost:8080/docs
- Web UI: http://localhost:5173 (需要单独启动)

## 📦 使用示例

### 1. 搜索技能

```bash
# 使用 CLI
clawskill search "weather"

# 使用 API
curl "http://localhost:8080/api/v1/search?q=weather"
```

### 2. 查看技能详情

```bash
# 使用 CLI
clawskill show openclaw/weather

# 使用 API
curl "http://localhost:8080/api/v1/skills/openclaw/weather"
```

### 3. 安装技能

```bash
# 安装到本地目录
clawskill install openclaw/weather -d ./skills/weather

# 查看安装的技能
cat ./skills/weather/SKILL.md
```

### 4. 发布技能

```bash
# 创建 API Key
clawskill key:create my-key

# 发布技能
clawskill publish ./my-skill --api-key YOUR_API_KEY
```

### 5. 语义搜索

```bash
# 使用 CLI
clawskill search:semantic "web scraping"

# 使用 API
curl -X POST http://localhost:8080/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "web scraping", "limit": 20}'
```

## 🔧 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的环境变量：

```bash
# 数据库配置
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill

# GitHub Token（可选）
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Key（可选，用于语义搜索）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Key
CLAWSKILL_API_KEY=your-api-key
```

## 🎯 常见用例

### 用例 1：发现 GitHub 上的技能

```bash
# 同步 GitHub 技能
clawskill github:sync --topic agent-skill --limit 100

# 搜索已同步的技能
clawskill search --github-only "productivity"
```

### 用例 2：安全扫描技能

```bash
# 扫描密钥泄漏
clawskill security:scan openclaw/weather --secrets

# 扫描依赖漏洞
clawskill security:scan openclaw/weather --dependencies

# 完整扫描
clawskill security:scan openclaw/weather --full
```

### 用例 3：管理技能依赖

```bash
# 查看依赖树
clawskill dependency:tree openclaw/weather

# 检查依赖冲突
clawskill dependency:check openclaw/weather

# 安装所有依赖
clawskill dependency:install openclaw/weather
```

### 用例 4：使用 Skill URL

AI Agent 可以通过 Skill URL 直接获取技能信息：

```bash
# 获取最新版本
curl "http://localhost:8080/skill/openclaw/weather"

# 获取指定版本
curl "http://localhost:8080/skill/openclaw/weather@1.0.0"

# 获取安装命令
curl "http://localhost:8080/skill/openclaw/weather/install"
```

## 🧪 测试

运行测试确保一切正常：

```bash
# 运行所有测试
pnpm test

# 查看测试覆盖率
pnpm test:coverage

# 监听模式
pnpm test:watch
```

## 📚 下一步

- 📖 阅读 [完整文档](./README.md)
- 🔌 查看 [API 文档](http://localhost:8080/docs)
- 💡 浏览 [示例技能](./examples/)
- 🤝 加入 [社区](https://github.com/clawskill/clawskill/discussions)

## ❓ 获取帮助

- 🐛 [报告问题](https://github.com/clawskill/clawskill/issues)
- 💬 [讨论区](https://github.com/clawskill/clawskill/discussions)
- 📧 [邮件支持](mailto:support@clawskill.com)

## 🎉 开始探索

现在您已经准备好了！开始探索 ClawSkill 的强大功能吧：

```bash
# 搜索热门技能
clawskill search --sort popular

# 查看推荐技能
clawskill recommend

# 启动 Web UI
cd web-ui && pnpm dev
```

祝您使用愉快！🚀