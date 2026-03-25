# OpenClaw 技能平台开发者文档

本文档面向技能开发者，详细介绍如何创建、发布和管理 OpenClaw 技能。

---

## 目录

- [开发环境准备](#开发环境准备)
- [技能结构](#技能结构)
- [技能开发指南](#技能开发指南)
- [API 参考](#api-参考)
- [发布流程](#发布流程)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 开发环境准备

### 前置要求

- **Node.js**: 16.0 或更高版本
- **npm**: 7.0 或更高版本
- **Git**: 用于版本控制
- **OpenClaw CLI**: `npm install -g @openclaw/cli`

### 环境配置

```bash
# 1. 安装 OpenClaw CLI
npm install -g @openclaw/cli

# 2. 登录账号
openclaw login

# 3. 验证安装
openclaw --version
```

---

## 技能结构

### 标准目录结构

```
my-skill/
├── SKILL.md          # 技能定义文件
├── package.json      # npm 包配置
├── README.md         # 技能说明文档
├── CHANGELOG.md      # 变更日志
├── src/
│   └── index.ts      # 技能主入口
├── scripts/          # 辅助脚本
└── tests/            # 测试文件
```

### SKILL.md 规范

`SKILL.md` 是技能的核心定义文件，采用 YAML 格式：

```yaml
name: "我的技能"
description: "技能的详细描述"
version: "1.0.0"
author: "开发者名称"
category: "productivity"
tags:
  - "自动化"
  - "工具"
license: "MIT"
repository: "https://github.com/username/my-skill"
openclaw:
  version: "1.0.0"
  model: "gpt-4"
  permissions:
    - "read"
    - "write"
  dependencies:
    - name: "另一个技能"
      version: ">= 1.0.0"
```

### package.json 配置

```json
{
  "name": "openclaw-skill-my-skill",
  "version": "1.0.0",
  "description": "我的 OpenClaw 技能",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src"
  },
  "keywords": [
    "openclaw",
    "skill",
    "automation"
  ],
  "author": "开发者名称",
  "license": "MIT",
  "openclaw": {
    "skillName": "my-skill",
    "category": "productivity",
    "permissions": ["read", "write"]
  }
}
```

---

## 技能开发指南

### 基础技能示例

```typescript
// src/index.ts

import { SkillContext, SkillResponse } from '@openclaw/sdk'

export interface MySkillInput {
  text: string
  options?: {
    uppercase?: boolean
    reverse?: boolean
  }
}

export interface MySkillOutput {
  result: string
  metadata: {
    original: string
    processed: boolean
  }
}

export default async function (
  context: SkillContext,
  input: MySkillInput
): Promise<SkillResponse<MySkillOutput>> {
  try {
    let result = input.text

    // 处理逻辑
    if (input.options?.uppercase) {
      result = result.toUpperCase()
    }

    if (input.options?.reverse) {
      result = result.split('').reverse().join('')
    }

    // 返回结果
    return {
      success: true,
      data: {
        result,
        metadata: {
          original: input.text,
          processed: result !== input.text,
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'PROCESSING_ERROR',
      },
    }
  }
}
```

### 使用 OpenClaw SDK

#### 安装 SDK

```bash
npm install @openclaw/sdk
```

#### 核心接口

```typescript
import {
  SkillContext,
  SkillResponse,
  Tool,
  Message,
} from '@openclaw/sdk'

// 技能上下文
interface SkillContext {
  userId: string
  sessionId: string
  workspace: string
  environment: 'development' | 'production'
  tools: Tool[]
  logger: Logger
}

// 工具接口
interface Tool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (params: any) => Promise<any>
}
```

#### 使用工具

```typescript
export default async function (
  context: SkillContext,
  input: MySkillInput
): Promise<SkillResponse<MySkillOutput>> {
  // 查找工具
  const tool = context.tools.find(t => t.name === 'search')

  if (!tool) {
    return {
      success: false,
      error: {
        message: '搜索工具不可用',
        code: 'TOOL_NOT_FOUND',
      },
    }
  }

  // 执行工具
  const searchResult = await tool.execute({
    query: input.text,
  })

  // 处理结果
  return {
    success: true,
    data: {
      result: searchResult.items,
    },
  }
}
```

### 错误处理

```typescript
export default async function (
  context: SkillContext,
  input: MySkillInput
): Promise<SkillResponse<MySkillOutput>> {
  try {
    // 业务逻辑
    validateInput(input)
    const result = processData(input)

    return {
      success: true,
      data: {
        result,
      },
    }
  } catch (error) {
    // 记录错误
    context.logger.error('处理失败', error)

    // 返回错误响应
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details,
      },
    }
  }
}

function validateInput(input: MySkillInput): void {
  if (!input.text) {
    throw new Error('输入文本不能为空')
  }

  if (input.text.length > 10000) {
    throw new Error('输入文本过长，最大支持 10000 字符')
  }
}
```

### 异步操作

```typescript
export default async function (
  context: SkillContext,
  input: MySkillInput
): Promise<SkillResponse<MySkillOutput>> {
  // 并行执行多个异步操作
  const [result1, result2] = await Promise.all([
    fetchData(input.url1),
    processData(input.url2),
  ])

  // 流式处理大数据
  const stream = await createStream(input.source)
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(processChunk(chunk))
  }

  return {
    success: true,
    data: {
      result: combineResults(result1, result2, chunks),
    },
  }
}
```

---

## API 参考

### 技能生命周期

#### 1. 初始化

```typescript
export function init(context: SkillContext): void {
  // 初始化配置
  // 建立连接
  // 加载资源
}
```

#### 2. 执行

```typescript
export default async function (
  context: SkillContext,
  input: any
): Promise<SkillResponse<any>> {
  // 主逻辑
}
```

#### 3. 清理

```typescript
export function cleanup(context: SkillContext): void {
  // 关闭连接
  // 释放资源
  // 保存状态
}
```

### 上下文 API

```typescript
// 日志记录
context.logger.info('信息')
context.logger.warn('警告')
context.logger.error('错误')

// 存储状态
await context.state.set('key', value)
const value = await context.state.get('key')

// 发送消息
await context.message.send({
  channel: 'general',
  text: '处理完成',
})

// 调用其他技能
const result = await context.skill.call('another-skill', {
  param: value,
})
```

### 工具 API

```typescript
// 执行工具
const result = await tool.execute({
  param1: value1,
  param2: value2,
})

// 批量执行
const results = await Promise.all([
  tool.execute({ id: 1 }),
  tool.execute({ id: 2 }),
  tool.execute({ id: 3 }),
])
```

---

## 发布流程

### 1. 测试技能

```bash
# 运行单元测试
npm test

# 本地调试
openclaw run --path .
```

### 2. 准备发布

```bash
# 检查版本号
npm version patch  # 或 minor, major

# 更新 CHANGELOG.md
# 记录本次发布的变更

# 构建
npm run build
```

### 3. 发布技能

```bash
# 预发布模式（验证）
openclaw publish --dry-run

# 正式发布
openclaw publish

# 指定版本发布
openclaw publish --version 2.0.0
```

### 4. 跟踪审核状态

```bash
# 查看我的技能
openclaw list --all

# 查看特定技能详情
openclaw version <skill-id>
```

---

## 最佳实践

### 代码质量

#### 1. 类型安全

```typescript
// 使用 TypeScript 严格模式
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// 定义清晰的接口
interface SkillInput {
  text: string
  options?: {
    max_length?: number
    format?: 'json' | 'text'
  }
}
```

#### 2. 错误处理

```typescript
// 定义错误类型
enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT = 'TIMEOUT',
}

// 抛出结构化错误
throw new ErrorWithCode(
  '输入无效',
  ErrorCode.INVALID_INPUT,
  { field: 'text', expected: 'string' }
)
```

#### 3. 日志记录

```typescript
// 记录关键操作
context.logger.info('开始处理', { inputLength: input.text.length })

// 记录性能指标
const startTime = Date.now()
const result = await process(input)
const duration = Date.now() - startTime
context.logger.info('处理完成', { duration, resultSize: result.length })

// 记录错误详情
context.logger.error('处理失败', {
  error: error.message,
  stack: error.stack,
  input: input,
})
```

### 性能优化

#### 1. 缓存结果

```typescript
const cacheKey = `result:${hash(input)}`

// 检查缓存
const cached = await context.state.get(cacheKey)
if (cached) {
  return { success: true, data: cached }
}

// 处理并缓存
const result = await process(input)
await context.state.set(cacheKey, result, { ttl: 3600 })

return { success: true, data: result }
```

#### 2. 批量处理

```typescript
// 批量处理多个请求
async function batchProcess(items: Item[]): Promise<Result[]> {
  const BATCH_SIZE = 10

  const results = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    )
    results.push(...batchResults)
  }

  return results
}
```

#### 3. 流式处理

```typescript
// 处理大文件或大量数据
async function streamProcess(source: ReadableStream): Promise<WritableStream> {
  const transform = new TransformStream({
    async transform(chunk, controller) {
      const processed = await processChunk(chunk)
      controller.enqueue(processed)
    },
  })

  return source.pipeThrough(transform)
}
```

### 安全考虑

#### 1. 输入验证

```typescript
function validateInput(input: any): void {
  // 类型检查
  if (typeof input.text !== 'string') {
    throw new Error('text 必须是字符串')
  }

  // 长度限制
  if (input.text.length > 10000) {
    throw new Error('text 过长')
  }

  // 内容过滤
  if (containsMaliciousContent(input.text)) {
    throw new Error('包含非法内容')
  }
}
```

#### 2. 敏感信息保护

```typescript
// 不要记录敏感信息
context.logger.info('处理请求', {
  userId: context.userId,
  // 不要记录: password, token, apiKey
})

// 使用环境变量
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error('未配置 API_KEY')
}
```

#### 3. 权限检查

```typescript
// 检查所需权限
if (!context.permissions.includes('write')) {
  return {
    success: false,
    error: {
      message: '权限不足',
      code: 'PERMISSION_DENIED',
    },
  }
}
```

### 文档规范

#### 1. README.md 模板

```markdown
# 技能名称

简短描述技能的功能。

## 功能特性

- 特性 1
- 特性 2
- 特性 3

## 安装

```bash
openclaw install <skill-id>
```

## 使用方法

```typescript
const result = await skill.execute({
  text: "输入文本",
  options: {
    uppercase: true,
  }
})
```

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 输入文本 |
| options | object | 否 | 配置选项 |

## 返回值

```typescript
{
  result: string
  metadata: {
    original: string
    processed: boolean
  }
}
```

## 示例

### 基础使用

```typescript
const result = await skill.execute({
  text: "Hello World"
})
console.log(result.result) // "Hello World"
```

### 高级使用

```typescript
const result = await skill.execute({
  text: "Hello World",
  options: {
    uppercase: true,
    reverse: true,
  }
})
console.log(result.result) // "DLROW OLLEH"
```

## 许可证

MIT
```

#### 2. CHANGELOG.md 模板

```markdown
# Changelog

## [1.0.0] - 2026-03-25

### Added
- 初始版本
- 基础文本处理功能
- 大小写转换选项
- 反转选项

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
```

---

## 常见问题

### 开发问题

**Q: 技能无法加载怎么办？**

A: 检查以下几点：
1. `package.json` 中的 `main` 字段指向正确的入口文件
2. 入口文件导出了默认函数
3. TypeScript 编译没有错误
4. 所有依赖都已安装

**Q: 如何调试技能？**

A: 使用以下方法：
1. 使用 `context.logger` 记录调试信息
2. 使用 `openclaw run` 本地运行
3. 在 IDE 中设置断点调试
4. 查看平台日志

**Q: 技能可以访问文件系统吗？**

A: 可以，但需要申请相应权限。在 `SKILL.md` 中声明所需的权限：
```yaml
openclaw:
  permissions:
    - "file:read"
    - "file:write"
```

### 发布问题

**Q: 审核被拒绝如何处理？**

A:
1. 查看拒绝原因
2. 根据反馈修改技能
3. 重新测试
4. 重新提交

**Q: 如何更新已发布的技能？**

A:
1. 修改代码
2. 更新版本号
3. 更新 CHANGELOG
4. 重新发布

**Q: 可以下架已发布的技能吗？**

A: 可以。联系管理员或使用管理工具下架技能。下架后新用户无法安装，但已安装用户可以继续使用。

---

## 技术支持

如需帮助，请：

1. 查看 [API 文档](./API.md)
2. 阅读 [用户手册](./USER-GUIDE.md)
3. 提交 Issue 到 GitHub
4. 加入开发者社区

---

## 附录

### 推荐工具库

- **TypeScript**: 类型安全
- **Jest**: 单元测试
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Zod**: 运行时类型验证

### 相关资源

- [OpenClaw SDK 文档](https://docs.openclaw.com/sdk)
- [技能示例库](https://github.com/openclaw/skills)
- [开发者社区](https://community.openclaw.com)

---

感谢您为 OpenClaw 生态系统做出贡献！