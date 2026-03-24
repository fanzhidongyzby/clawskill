# 环境变量配置指南

本文档详细说明 ClawSkill 所需的环境变量配置。

## 📋 配置清单

### 必需配置

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | [GitHub Settings](https://github.com/settings/tokens) |
| `OPENAI_API_KEY` | OpenAI API Key | [OpenAI Platform](https://platform.openai.com/api-keys) |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `REDIS_URL` | Redis 连接字符串 | - |
| `JWT_SECRET` | JWT 认证密钥 | - |
| `CLAWSKILL_API_KEY` | API 管理员密钥 | - |

## 🔑 GITHUB_TOKEN 配置

### 为什么需要？

ClawSkill 需要通过 GitHub API:
- 搜索技能仓库
- 获取仓库元数据
- 下载 SKILL.md 文件
- 监听 GitHub Webhook 事件
- 获取版本和标签信息

### 获取步骤

1. **访问 GitHub Token 设置页**
   ```
   https://github.com/settings/tokens
   ```

2. **生成新 Token**
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 填写 Note: `ClawSkill`
   - 选择 Expiration: `90 days` (推荐)

3. **配置权限**
   勾选以下权限:
   - ✅ `repo` - 完整仓库访问权限
   - ✅ `read:org` - 读取组织信息
   - ✅ `read:packages` - 读取包信息

4. **保存 Token**
   - 点击 "Generate token"
   - **立即复制 token** (只显示一次!)

5. **配置到环境变量**
   ```bash
   # .env 文件
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 权限说明

| 权限 | 用途 |
|------|------|
| `repo` | 读取仓库代码、标签、 releases |
| `read:org` | 读取组织信息和成员列表 |
| `read:packages` | 读取 GitHub Packages 信息 |

### 注意事项

⚠️ **安全提示**:
- 不要将 token 提交到 Git
- 使用 `.env` 文件或环境变量
- 定期更新 token (建议 90 天)
- 限制 token 的仓库访问范围 (可选)

## 🤖 OPENAI_API_KEY 配置

### 为什么需要？

ClawSkill 使用 OpenAI Embeddings API:
- 为技能生成向量嵌入
- 实现语义搜索功能
- 技能推荐系统
- 相关性评分

### 获取步骤

1. **访问 OpenAI API Keys 页面**
   ```
   https://platform.openai.com/api-keys
   ```

2. **登录或注册 OpenAI 账户**
   - 需要有效的 OpenAI 账户
   - 账户需要有 API 余额

3. **创建 API Key**
   - 点击 "Create new secret key"
   - 填写描述: `ClawSkill Semantic Search`
   - 点击 "Create secret key"

4. **保存 API Key**
   - **立即复制 key** (只显示一次!)
   - 格式: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

5. **配置到环境变量**
   ```bash
   # .env 文件
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 支持的模型

ClawSkill 支持以下 OpenAI Embeddings 模型:

| 模型 | 维度 | 价格 (每 1M tokens) |
|------|------|---------------------|
| `text-embedding-3-small` | 1536 | $0.02 |
| `text-embedding-3-large` | 3072 | $0.13 |
| `text-embedding-ada-002` | 1536 | $0.10 |

**推荐**: `text-embedding-3-small` (性价比最高)

### 注意事项

⚠️ **成本提示**:
- 每个技能约消耗 1-2K tokens
- 1000 个技能约 $0.02-0.04 (使用 text-embedding-3-small)
- 建议: 设置使用限制和告警

## 🗄️ 数据库配置

### PostgreSQL (必需)

```bash
DATABASE_URL=postgresql://clawskill:clawskill_dev@localhost:5432/clawskill
CLAWSKILL_DB_HOST=localhost
CLAWSKILL_DB_PORT=5432
CLAWSKILL_DB_USER=clawskill
CLAWSKILL_DB_PASSWORD=clawskill_dev
CLAWSKILL_DB_NAME=clawskill
CLAWSKILL_DB_SSLMODE=disable
```

**Docker Compose 启动**:
```bash
docker compose up -d postgres
```

### Redis (可选，推荐)

```bash
REDIS_URL=redis://localhost:6379
CLAWSKILL_REDIS_HOST=localhost
CLAWSKILL_REDIS_PORT=6379
CLAWSKILL_REDIS_DB=0
```

**Docker Compose 启动**:
```bash
docker compose up -d redis
```

## 🔐 安全配置

### JWT_SECRET (生产环境必需)

用于 API 认证和会话管理:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**生成强密钥**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CLAWSKILL_API_KEY (可选)

用于管理员操作:

```bash
CLAWSKILL_API_KEY=your-api-key-for-admin-operations
```

## 🚀 快速开始

### 1. 复制示例配置

```bash
cp .env.example .env
```

### 2. 编辑 .env 文件

```bash
nano .env
```

### 3. 填写必需的值

```bash
GITHUB_TOKEN=ghp_your_actual_token_here
OPENAI_API_KEY=sk-your_actual_key_here
```

### 4. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

## 🧪 验证配置

### 测试 GitHub Token

```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user
```

应该返回你的 GitHub 用户信息。

### 测试 OpenAI API Key

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello world",
    "model": "text-embedding-3-small"
  }'
```

应该返回嵌入向量数据。

### 测试数据库连接

```bash
psql $DATABASE_URL -c "SELECT version();"
```

应该返回 PostgreSQL 版本信息。

## 📝 完整 .env 示例

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
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# OpenAI API
# ========================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# 服务器配置
# ========================================
CLAWSKILL_HOST=0.0.0.0
CLAWSKILL_PORT=8080
CLAWSKILL_MODE=development
CLAWSKILL_LOG_LEVEL=info

# ========================================
# 安全配置
# ========================================
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
CLAWSKILL_API_KEY=admin-secret-key-change-in-production
```

## ❓ 常见问题

### Q: GitHub Token 无效怎么办？

A: 检查以下几点:
- Token 是否过期 (GitHub Tokens 有有效期)
- 是否有足够的权限 (repo, read:org, read:packages)
- 是否正确复制 (不要有多余空格)

### Q: OpenAI API Key 扣费警告？

A: 查看:
- OpenAI 账户余额: https://platform.openai.com/account/usage
- 设置使用限制: https://platform.openai.com/account/billing/limits
- 使用 text-embedding-3-small 降低成本

### Q: 数据库连接失败？

A: 检查:
- PostgreSQL 是否运行: `docker ps`
- 连接字符串是否正确
- 密码和用户名是否匹配

### Q: Redis 可选但推荐？

A: Redis 用于:
- 缓存搜索结果 (提升性能)
- 会话管理
- 速率限制计数

无 Redis 时功能可用，但性能会下降。

## 🔗 相关链接

- [GitHub Token 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/documentation)

---

如有问题，请查看 [GitHub Issues](https://github.com/openclaw/clawskill/issues)