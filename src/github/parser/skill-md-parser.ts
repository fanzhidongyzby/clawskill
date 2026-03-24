/**
 * SKILL.md 解析器
 * 解析 Markdown frontmatter 和技能元数据
 */
import * as yaml from 'yaml';
import crypto from 'crypto';

/**
 * SKILL.md 解析结果
 */
export interface ParsedSkillMD {
  /**
   * Frontmatter 数据
   */
  frontmatter: Record<string, any>;

  /**
   * 技能元数据
   */
  metadata: SkillMetadata;

  /**
   * 内容哈希（SHA256）
   */
  hash: string;
}

/**
 * 技能元数据
 */
export interface SkillMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  triggers?: string[];
  tools?: string[];
  compatibility?: string[];
  keywords?: string[];
  categories?: string[];
}

/**
 * SKILL.md 解析器
 */
export class SkillMDParser {
  /**
   * 解析 SKILL.md 内容
   * @param content Markdown 原始内容
   */
  parse(content: string): ParsedSkillMD {
    // 1. 提取 frontmatter
    const { frontmatter, body } = this.extractFrontmatter(content);

    // 2. 解析元数据
    const metadata = this.extractMetadata(frontmatter);

    // 3. 计算哈希
    const hash = this.computeHash(content);

    return {
      frontmatter,
      metadata,
      hash,
    };
  }

  /**
   * 提取 YAML frontmatter
   */
  private extractFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    body: string;
  } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, body: content };
    }

    try {
      const frontmatter = yaml.load(match[1]) as Record<string, any>;
      return {
        frontmatter: frontmatter || {},
        body: match[2],
      };
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error);
      return { frontmatter: {}, body: content };
    }
  }

  /**
   * 提取技能元数据
   */
  private extractMetadata(frontmatter: Record<string, any>): SkillMetadata {
    return {
      name: frontmatter.name || frontmatter.title || 'Unknown',
      description: frontmatter.description || frontmatter.summary || '',
      version: frontmatter.version,
      author: frontmatter.author,
      triggers: this.normalizeArray(frontmatter.triggers),
      tools: this.normalizeArray(frontmatter.tools),
      compatibility: this.normalizeArray(frontmatter.compatibility || frontmatter.platform),
      keywords: this.normalizeArray(frontmatter.keywords || frontmatter.tags),
      categories: this.normalizeArray(frontmatter.categories),
    };
  }

  /**
   * 标准化数组（处理字符串和数组）
   */
  private normalizeArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return [];
  }

  /**
   * 计算内容哈希
   */
  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 验证 SKILL.md 格式
   */
  validate(content: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 1. 检查 frontmatter
    const { frontmatter } = this.extractFrontmatter(content);
    if (Object.keys(frontmatter).length === 0) {
      errors.push('Missing YAML frontmatter');
    }

    // 2. 检查必填字段
    if (!frontmatter.name && !frontmatter.title) {
      errors.push('Missing required field: name or title');
    }

    if (!frontmatter.description && !frontmatter.summary) {
      errors.push('Missing required field: description or summary');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 生成 SKILL.md 模板
   */
  generateTemplate(metadata: Partial<SkillMetadata>): string {
    const template = `---
name: ${metadata.name || 'skill-name'}
description: ${metadata.description || 'A brief description of what this skill does'}
version: ${metadata.version || '0.1.0'}
author: ${metadata.author || 'Your Name'}
triggers:
  ${metadata.triggers?.map((t) => `- "${t}"`).join('\n  ') || '- "trigger1"'}
tools:
  ${metadata.tools?.map((t) => `- "${t}"`).join('\n  ') || '- "tool1"'}
compatibility:
  ${metadata.compatibility?.map((c) => `- "${c}"`).join('\n  ') || '- "openclaw"'}
keywords:
  ${metadata.keywords?.map((k) => `- "${k}"`).join('\n  ') || '- "keyword1"'}
categories:
  ${metadata.categories?.map((c) => `- "${c}"`).join('\n  ') || '- "utility"'}
---

# ${metadata.name || 'Skill Name'}

## Description

${metadata.description || 'A detailed description of what this skill does...'}

## Usage

\`\`\`bash
# Example usage
openclaw skill ${metadata.name || 'skill-name'}
\`\`\`

## Configuration

\`\`\`json
{
  "option1": "value1",
  "option2": "value2"
}
\`\`\`

## Notes

Additional notes about this skill...
`;

    return template;
  }
}