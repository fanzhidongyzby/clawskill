# 技能元数据标准化规范

**版本**: 1.0.0
**日期**: 2026-03-25

---

## 标准字段定义

### 必需字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| name | string | 技能名称 | `paper-search` |
| namespace | string | 命名空间 | `openclaw` |
| version | semver | 版本号 | `1.0.0` |
| description | string | 描述 | `搜索学术论文` |
| author | string | 作者 | `Professor` |
| license | string | 许可证 | `MIT` |

### 可选字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| keywords | string[] | 关键词 | `["paper", "search"]` |
| categories | string[] | 分类 | `["research", "academic"]` |
| homepage | URL | 主页 | `https://openclaw.ai` |
| repository | URL | 仓库 | `https://github.com/...` |
| installCommands | object[] | 安装命令 | 见下文 |
| dependencies | object[] | 依赖 | 见下文 |

### 安装命令格式

```yaml
installCommands:
  - platform: npm
    command: npm install @openclaw/paper-search
  - platform: pnpm
    command: pnpm add @openclaw/paper-search
  - platform: pip
    command: pip install openclaw-paper-search
```

### 依赖格式

```yaml
dependencies:
  - name: openclaw/semantic-search
    version: ">=1.0.0"
    optional: false
  - name: openclaw/embedding-client
    version: "^2.0.0"
    optional: true
```

---

## 字段映射规则

### 来源 → ClawSkill

| 来源 | 映射规则 |
|------|---------|
| GitHub | `repository` → `homepage` |
| NPM | `name` → `namespace/name` |
| PyPI | `name` → `namespace/name` |
| MCP | `description` → `description` |

---

## CLI 接口描述规范 (Capability Level Interface)

```yaml
# skill.yaml - CLI 规范
id: openclaw/paper-search
version: 1.0.0
description: 搜索学术论文

interface:
  inputs:
    - name: query
      type: string
      required: true
    - name: limit
      type: number
      default: 10
  outputs:
    - name: papers
      type: array
      items:
        type: object
        properties:
          title: string
          authors: array
          abstract: string
          url: string

capabilities:
  - search
  - summarize

runtime:
  node: ">=18.0.0"
  memory: "256MB"
```

---

**规范状态**: ✅ 已定义
**实施状态**: ⏳ 进行中