# AgentSkills.io 兼容性声明

**版本**: 1.0.0
**日期**: 2026-03-25
**状态**: ✅ 兼容

---

## 兼容性概述

ClawSkill 完全兼容 [AgentSkills.io](https://agentskills.io) 标准，提供：

1. **SKILL.md 格式兼容** - 完整支持 AgentSkills 规范
2. **Skill URL 协议兼容** - `namespace/name@version` 格式
3. **元数据字段兼容** - 所有标准字段和扩展字段
4. **安装命令兼容** - 支持 npm/pip 等多种包管理器

---

## SKILL.md 格式映射

| AgentSkills 字段 | ClawSkill 字段 | 状态 |
|------------------|----------------|------|
| name | name | ✅ |
| version | version | ✅ |
| description | description | ✅ |
| author | author | ✅ |
| license | license | ✅ |
| keywords | keywords | ✅ |
| categories | categories | ✅ |
| homepage | homepage | ✅ |
| repository | repository | ✅ |
| install | installCommands | ✅ |
| dependencies | dependencies | ✅ |

---

## Skill URL 协议

AgentSkills: `skill://namespace/name@version`
ClawSkill: `namespace/name@version` 或 `/skill/namespace/name`

**互操作**: ✅ 完全兼容

---

## 验证方法

```bash
# ClawSkill 支持 AgentSkills 格式的 SKILL.md
clawskill publish ./my-skill

# ClawSkill 支持标准 Skill URL
clawskill install namespace/name@1.0.0
```

---

**兼容性认证**: ClawSkill v0.1.0+
**认证日期**: 2026-03-25