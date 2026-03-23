# 今日任务：ClawSkill MVP 原型（必须今天完成）

## 最高指示
志东要求今天（2026-03-23）交付可运行的 ClawSkill 原型。不要停止，持续开发。

## 交付标准（今天必须达成）
1. **数据库层**：Kysely + PostgreSQL 接入，替换 InMemoryRepository
2. **认证系统**：API Key 认证（简单可用即可）
3. **包存储**：skill 包上传/下载（本地文件存储先行）
4. **CLI 完整可用**：`clawskill search/publish/install/info` 全部能跑
5. **服务器可启动**：`clawskill serve` 启动后能处理请求
6. **Docker 一键启动**：`docker-compose up` 能跑起完整服务（API + DB + Redis）
7. **OpenClaw 兼容**：SKILL.md frontmatter 解析与 OpenClaw 格式一致

## 优先级排序
1. Docker compose 能跑起来（DB + Redis + API）
2. 数据库层替换
3. CLI publish/install 流程打通
4. 认证
5. 其他优化

## 完成后
- 在 /data/OpenMind/shared/clawskill-status.md 写入完成报告
- 通知 CEO
