# 今日任务：ClawSkill MVP 原型（必须今天完成）

## 最高指示
志东要求今天（2026-03-23）交付可运行的 ClawSkill 原型。不要停止，持续开发。

## ⚠️ 注意：你在容器内，不能使用 Docker！
Docker 相关工作（docker-compose、数据库启动）由 CEO 在宿主机处理。
你只需要专注写代码。

## 你的交付标准
1. **数据库层**：Kysely + PostgreSQL 实现（替换 InMemoryRepository），代码写好即可，DB 由宿主机启动
2. **认证系统**：API Key 认证（简单 Bearer token 即可）
3. **包存储**：skill 包上传/下载（本地文件存储）
4. **CLI 完整**：`clawskill search/publish/install/info` 命令全部实现
5. **服务器入口**：`clawskill serve` 或 `pnpm dev` 能启动 Fastify 服务
6. **OpenClaw 兼容**：SKILL.md frontmatter 解析与 OpenClaw 格式一致
7. **测试通过**：`pnpm test` 全部绿色

## 不需要你做的（CEO 负责）
- Docker/docker-compose 配置和启动
- PostgreSQL/Redis 实例部署
- 生产环境配置

## 优先级
1. 数据库层（Kysely + PG repository 实现）
2. CLI publish/install 流程
3. 认证中间件
4. 包文件存储
5. 测试补全

## 完成后
- 在 /data/OpenMind/shared/clawskill-status.md 写完成报告
- 通知 CEO（curl CEO Gateway）

## 数据库连接信息（CEO 已在宿主机启动）

### PostgreSQL
- Host: clawskill-postgres
- Port: 5432
- User: clawskill
- Password: clawskill_dev
- Database: clawskill
- init-db.sql 已自动执行

### Redis
- Host: clawskill-redis
- Port: 6379
- DB: 0

### 环境变量
```bash
export CLAWSKILL_DB_HOST=clawskill-postgres
export CLAWSKILL_DB_PORT=5432
export CLAWSKILL_DB_USER=clawskill
export CLAWSKILL_DB_PASSWORD=clawskill_dev
export CLAWSKILL_DB_NAME=clawskill
export CLAWSKILL_REDIS_HOST=clawskill-redis
export CLAWSKILL_REDIS_PORT=6379
```

这些服务已在同一 Docker 网络中，可直接通过容器名访问。
