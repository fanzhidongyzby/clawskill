# Contributing to ClawSkill

感谢你有兴趣为 ClawSkill 做贡献！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)
- [测试要求](#测试要求)
- [Pull Request 流程](#pull-request-流程)

## 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告 Bug

如果你发现了 bug，请通过 [GitHub Issues](https://github.com/openclaw/clawskill/issues) 提交报告。

提交 bug 报告时，请包含：

1. **描述**: 清晰描述问题
2. **复现步骤**: 如何重现问题
3. **期望行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境**: 操作系统、Node.js 版本等
6. **日志**: 相关的错误日志或截图

### 提交功能请求

欢迎提交功能请求！请在 Issue 中详细描述：

1. **功能描述**: 你想要的功能
2. **使用场景**: 为什么需要这个功能
3. **替代方案**: 你考虑过的其他方案

### 提交代码

#### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开发环境设置

### 前置要求

- Node.js 22+
- pnpm 10+
- PostgreSQL 14+
- Docker (可选，用于容器化部署)

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/openclaw/clawskill.git
cd clawskill

# 2. 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 3. 安装依赖
pnpm install

# 4. 复制环境变量文件
cp .env.example .env

# 5. 编辑 .env 文件，配置数据库等信息
# nano .env

# 6. 启动数据库 (使用 Docker)
docker compose up -d postgres

# 7. 运行数据库迁移
pnpm db:migrate

# 8. 启动开发服务器
pnpm dev
```

### 可用命令

```bash
# 开发
pnpm dev              # 启动开发服务器（热重载）
pnpm build            # 构建项目
pnpm start            # 启动生产服务器

# CLI
pnpm cli              # 运行 CLI 工具

# 测试
pnpm test             # 运行所有测试
pnpm test:watch       # 监听模式运行测试
pnpm test:coverage    # 生成测试覆盖率报告

# 代码质量
pnpm lint             # 运行 ESLint
pnpm typecheck        # TypeScript 类型检查
pnpm clean            # 清理构建文件

# 数据库
pnpm db:migrate       # 运行数据库迁移
pnpm db:seed          # 填充种子数据
```

## 代码规范

### TypeScript 规范

- 使用 TypeScript 编写所有新代码
- 遵循 TypeScript 最佳实践
- 使用严格的类型检查（`strict: true`）
- 避免使用 `any` 类型，使用 `unknown` 或具体类型
- 为公共 API 添加 JSDoc 注释

### ESLint 规范

项目使用 ESLint 进行代码检查。提交代码前请确保通过 lint 检查：

```bash
pnpm lint
```

主要规则：

- 使用 2 空格缩进
- 使用单引号（`'`）而非双引号（`"`）
- 语句末尾加分号（`;`）
- 使用 `const` 和 `let`，避免 `var`
- 函数声明使用箭头函数或 `function` 关键字

### Prettier 配置

我们使用 Prettier 进行代码格式化（通过 ESLint 插件）：

```bash
# 自动格式化代码
pnpm lint --fix
```

### 文件组织

```
src/
├── cli/              # CLI 工具
├── core/             # 核心服务
├── server/           # 服务器
├── types/            # 类型定义
└── utils/            # 工具函数
```

### 命名约定

- **文件名**: kebab-case (例如: `skill-service.ts`)
- **类名**: PascalCase (例如: `SkillService`)
- **函数/变量**: camelCase (例如: `getSkillById`)
- **常量**: UPPER_SNAKE_CASE (例如: `MAX_RETRY_COUNT`)
- **接口/类型**: PascalCase (例如: `Skill`, `SkillOptions`)

## 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (类型)

| Type | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或外部依赖 |
| `ci` | CI 配置 |
| `chore` | 其他杂项 |
| `revert` | 回退提交 |

### Scope (范围)

常见的 scope：

- `core`: 核心功能
- `cli`: CLI 工具
- `server`: API 服务器
- `github`: GitHub 集成
- `dependency`: 依赖管理
- `search`: 搜索功能
- `security`: 安全扫描
- `docs`: 文档
- `test`: 测试

### 示例

```
feat(core): add semantic search support

- Integrate OpenAI embeddings API
- Add vector similarity search
- Implement ranking algorithm

Closes #123
```

```
fix(github): handle rate limiting errors

- Add retry logic with exponential backoff
- Update error messages for better UX

Fixes #456
```

```
docs(readme): update installation instructions

- Add Docker deployment section
- Fix typo in quick start guide
```

## 测试要求

### 测试覆盖率

- **目标覆盖率**: ≥ 70%
- **核心模块覆盖率**: ≥ 80%
- **关键路径覆盖率**: ≥ 90%

### 测试框架

我们使用 [Vitest](https://vitest.dev/) 作为测试框架。

### 编写测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('SkillService', () => {
  let service: SkillService;

  beforeEach(() => {
    service = new SkillService();
  });

  describe('getSkillById', () => {
    it('should return skill for valid ID', async () => {
      const skill = await service.getSkillById('openclaw/weather');
      expect(skill).toBeDefined();
      expect(skill.id).toBe('openclaw/weather');
    });

    it('should throw error for invalid ID', async () => {
      await expect(service.getSkillById('invalid'))
        .rejects.toThrow('Skill not found');
    });
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 运行特定测试文件
pnpm test src/core/skill-service.test.ts
```

### 测试最佳实践

1. **单元测试**: 测试单个函数或方法
2. **集成测试**: 测试多个模块的交互
3. **E2E 测试**: 测试完整的用户流程
4. **使用描述性测试名称**: `should do something when condition`
5. **AAA 模式**: Arrange, Act, Assert
6. **避免测试实现细节**: 测试行为而非实现
7. **使用 mock 和 spy**: 隔离外部依赖
8. **测试边界情况**: 空值、null、undefined、极值

## Pull Request 流程

### PR 检查清单

在提交 PR 之前，请确保：

- [ ] 代码通过 `pnpm lint` 检查
- [ ] 代码通过 `pnpm typecheck` 类型检查
- [ ] 所有测试通过 (`pnpm test`)
- [ ] 测试覆盖率 ≥ 70%
- [ ] 新功能有对应的测试
- [ ] 文档已更新（README、API 文档等）
- [ ] 提交信息符合 Conventional Commits 规范
- [ ] PR 标题遵循规范（例如: `feat: add semantic search`）
- [ ] PR 描述清晰说明更改内容
- [ ] 关联相关的 Issue（使用 `Closes #123` 或 `Fixes #123`）

### PR 标题格式

PR 标题应该与提交信息格式一致：

```
type(scope): description
```

例如：
- `feat(core): add semantic search support`
- `fix(github): handle rate limiting errors`
- `docs(readme): update installation guide`

### PR 描述模板

使用 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md) 提交 PR。

### PR 审查流程

1. **自动化检查**: CI 会自动运行 lint、test、build
2. **代码审查**: 维护者会审查你的代码
3. **反馈讨论**: 根据反馈进行修改
4. **合并**: 通过审查后合并到目标分支

### 合并策略

- **feature 分支**: 合并到 `develop`
- **bugfix 分支**: 合并到 `develop` 或 `main`
- **hotfix 分支**: 合并到 `main` 和 `develop`
- **release 分支**: 合并到 `main`

## 项目结构

```
clawskill/
├── .github/              # GitHub 配置
│   ├── workflows/        # CI/CD workflows
│   ├── ISSUE_TEMPLATE/   # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md
├── api/                  # API 定义（OpenAPI）
├── config/               # 配置文件
├── docs/                 # 文档
├── migrations/           # 数据库迁移
├── scripts/              # 脚本工具
├── src/                  # 源代码
│   ├── cli/              # CLI 工具
│   ├── core/             # 核心服务
│   ├── server/           # 服务器
│   └── types/            # 类型定义
├── tests/                # 测试文件
├── web-ui/               # Web 应用
├── .env.example          # 环境变量示例
├── .gitignore            # Git 忽略文件
├── CHANGELOG.md          # 变更日志
├── CODE_OF_CONDUCT.md    # 行为准则
├── CONTRIBUTING.md       # 贡献指南（本文件）
├── LICENSE               # 许可证
├── package.json          # 项目配置
├── pnpm-lock.yaml        # 依赖锁定文件
├── README.md             # 项目说明
└── SUPPORT.md            # 支持信息
```

## 获取帮助

- 📖 查看 [SUPPORT.md](./SUPPORT.md) 获取帮助
- 💬 加入 [Discord](https://discord.gg/clawskill)
- 📝 在 [GitHub Discussions](https://github.com/openclaw/clawskill/discussions) 提问
- 🐛 提交 [Issue](https://github.com/openclaw/clawskill/issues)

## 资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Vitest 文档](https://vitest.dev/)
- [Fastify 文档](https://fastify.dev/)
- [Kysely 文档](https://kysely.dev/)
- [ESLint 文档](https://eslint.org/)
- [Prettier 文档](https://prettier.io/)

## 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下授权。

---

再次感谢你的贡献！🎉