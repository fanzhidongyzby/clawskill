/**
 * Agent Skills 标准 - 完全兼容
 *
 * 标准 SKILL.md 格式：
 * - name: 1-64字符，小写+连字符
 * - description: 1-1024字符
 * - license: MIT, Apache-2.0 等
 * - compatibility: 支持的平台列表
 * - metadata: 作者、版本、分类、标签
 * - allowed-tools: 使用的工具列表
 *
 * 目录结构：
 * skill-name/
 * ├── SKILL.md          # Required: metadata + instructions
 * ├── scripts/          # Optional: executable code
 * ├── references/       # Optional: documentation
 * └── assets/           # Optional: templates, resources
 */

import type { Skill, ParsedSkillMd } from '../types/skill';

/**
 * Agent Skills 标准元数据
 */
export interface AgentSkillMetadata {
  // 必填字段
  name: string;           // 1-64字符，小写+连字符
  description: string;    // 1-1024字符
  
  // 可选字段
  license?: string;       // MIT, Apache-2.0, etc.
  compatibility?: string[]; // openclaw, claude-code, cursor, etc.
  author?: string;
  version?: string;       // semver 格式
  category?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
  allowedTools?: string[]; // 允许使用的工具列表
  
  // 扩展字段
  requires?: string[];    // 依赖的其他技能
  provides?: string[];    // 提供的能力
  examples?: SkillExample[];
}

/**
 * 技能示例
 */
export interface SkillExample {
  title: string;
  description: string;
  input: string;
  output?: string;
  notes?: string;
}

/**
 * Agent Skills 兼容性验证结果
 */
export interface CompatibilityResult {
  compatible: boolean;
  platform: string;
  issues: string[];
  warnings: string[];
  features: {
    basicParsing: boolean;
    toolRestrictions: boolean;
    extendedMetadata: boolean;
    examples: boolean;
    dependencies: boolean;
  };
}

/**
 * Agent Skills 标准验证器
 */
export class SkillStandardValidator {
  // 支持的平台列表
  public static readonly SUPPORTED_PLATFORMS = [
    'openclaw',
    'claude-code',
    'cursor',
    'copilot',
    'gemini-code',
    'codex',
    'pi',
    'opencode',
  ];
  
  // 常用许可证
  public static readonly COMMON_LICENSES = [
    'MIT',
    'Apache-2.0',
    'Apache 2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'GPL-2.0',
    'GPL-3.0',
    'LGPL-2.1',
    'LGPL-3.0',
    'MPL-2.0',
    '0BSD',
    'UNLICENSED',
    'PROPRIETARY',
  ];

  constructor() {
    // Instance-level constants (initialized in constructor)
  }

  private get VALID_NAME_PATTERN(): RegExp {
    return /^[a-z][a-z0-9-]{0,63}$/;
  }

  private get MAX_DESCRIPTION_LENGTH(): number {
    return 1024;
  }

  private get MAX_NAME_LENGTH(): number {
    return 64;
  }

  /**
   * 验证技能是否符合 Agent Skills 标准
   */
  validate(skill: ParsedSkillMd | Skill): CompatibilityResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const features = {
      basicParsing: true,
      toolRestrictions: false,
      extendedMetadata: false,
      examples: false,
      dependencies: false,
    };

    // 验证 name
    if (!skill.name) {
      issues.push('name is required');
      features.basicParsing = false;
    } else if (!this.VALID_NAME_PATTERN.test(skill.name)) {
      issues.push(`name "${skill.name}" must be 1-64 lowercase letters, numbers, or hyphens, starting with a letter`);
      features.basicParsing = false;
    }

    // 验证 description
    if (!skill.description) {
      issues.push('description is required');
      features.basicParsing = false;
    } else if (skill.description.length > this.MAX_DESCRIPTION_LENGTH) {
      warnings.push(`description exceeds ${this.MAX_DESCRIPTION_LENGTH} characters (${skill.description.length})`);
    }

    // 验证 namespace (用于生成 ID)
    if (!skill.namespace) {
      issues.push('namespace is required for skill ID');
      features.basicParsing = false;
    } else if (!this.VALID_NAME_PATTERN.test(skill.namespace)) {
      issues.push(`namespace "${skill.namespace}" must follow same naming rules as name`);
      features.basicParsing = false;
    }

    // 验证 license (可选但建议)
    if (!skill.license) {
      warnings.push('license is recommended for clarity');
    } else if (!SkillStandardValidator.COMMON_LICENSES.includes(skill.license.toUpperCase())) {
      warnings.push(`license "${skill.license}" is not a common OSS license`);
    }

    // 验证 keywords/tags
    if (skill.keywords && skill.keywords.length > 0) {
      features.extendedMetadata = true;
    }

    // 验证 categories
    if (skill.categories && skill.categories.length > 0) {
      features.extendedMetadata = true;
    }

    // 检查是否有扩展字段（通过原始数据）
    if ('allowedTools' in skill) {
      features.toolRestrictions = true;
    }
    if ('requires' in skill) {
      features.dependencies = true;
    }
    if ('examples' in skill) {
      features.examples = true;
    }

    return {
      compatible: issues.length === 0,
      platform: 'openclaw',
      issues,
      warnings,
      features,
    };
  }

  /**
   * 验证与特定平台的兼容性
   */
  validatePlatformCompatibility(
    skill: ParsedSkillMd | Skill & { compatibility?: string[] },
    platform: string
  ): CompatibilityResult {
    const baseResult = this.validate(skill);
    
    if (!SkillStandardValidator.SUPPORTED_PLATFORMS.includes(platform)) {
      baseResult.warnings.push(`platform "${platform}" is not officially supported`);
    }

    // 检查 explicit compatibility 声明
    if (skill.compatibility) {
      if (!skill.compatibility.includes(platform)) {
        baseResult.issues.push(`skill declares compatibility with ${skill.compatibility.join(', ')}, not ${platform}`);
        baseResult.compatible = false;
      }
    }

    return baseResult;
  }

  /**
   * 生成标准 SKILL.md 内容
   */
  generateSkillMd(metadata: AgentSkillMetadata, instructions: string): string {
    const lines: string[] = ['---'];

    // 必填字段
    lines.push(`name: ${metadata.name}`);
    lines.push(`description: |`);
    lines.push(`  ${metadata.description}`);

    // 可选字段
    if (metadata.license) {
      lines.push(`license: ${metadata.license}`);
    }

    if (metadata.compatibility && metadata.compatibility.length > 0) {
      lines.push(`compatibility:`);
      for (const platform of metadata.compatibility) {
        lines.push(`  - ${platform}`);
      }
    }

    if (metadata.author) {
      lines.push(`metadata:`);
      lines.push(`  author: ${metadata.author}`);
      if (metadata.version) {
        lines.push(`  version: ${metadata.version}`);
      }
      if (metadata.category) {
        lines.push(`  category: ${metadata.category}`);
      }
      if (metadata.tags && metadata.tags.length > 0) {
        lines.push(`  tags:`);
        for (const tag of metadata.tags) {
          lines.push(`    - ${tag}`);
        }
      }
    }

    if (metadata.allowedTools && metadata.allowedTools.length > 0) {
      lines.push(`allowed-tools:`);
      for (const tool of metadata.allowedTools) {
        lines.push(`  - ${tool}`);
      }
    }

    lines.push('---');
    lines.push('');
    lines.push(instructions);

    return lines.join('\n');
  }

  /**
   * 解析并标准化技能
   */
  normalize(skill: ParsedSkillMd | Skill): AgentSkillMetadata {
    return {
      name: skill.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: skill.description,
      license: skill.license || 'MIT',
      author: skill.author,
      version: skill.version,
      category: skill.categories?.[0] || 'general',
      tags: skill.keywords || [],
      homepage: skill.homepage,
      repository: skill.repository,
      compatibility: ['openclaw'],
    };
  }

  /**
   * 验证工具名称是否在允许列表中
   */
  validateToolUsage(
    toolName: string,
    allowedTools: string[] | undefined
  ): { allowed: boolean; reason: string } {
    if (!allowedTools) {
      return { allowed: true, reason: 'No tool restrictions defined' };
    }

    if (allowedTools.includes(toolName)) {
      return { allowed: true, reason: 'Tool explicitly allowed' };
    }

    // 检查通配符
    if (allowedTools.includes('*')) {
      return { allowed: true, reason: 'Wildcard permission' };
    }

    // 检查前缀匹配
    const prefixMatch = allowedTools.find(t => t.endsWith('*') && toolName.startsWith(t.slice(0, -1)));
    if (prefixMatch) {
      return { allowed: true, reason: `Matches prefix ${prefixMatch}` };
    }

    return {
      allowed: false,
      reason: `Tool "${toolName}" not in allowed list: ${allowedTools.join(', ')}`,
    };
  }

  /**
   * 获取标准目录结构
   */
  getStandardDirectoryStructure(): Record<string, { required: boolean; description: string }> {
    return {
      'SKILL.md': {
        required: true,
        description: 'Skill metadata and instructions',
      },
      'scripts/': {
        required: false,
        description: 'Executable code and helper scripts',
      },
      'references/': {
        required: false,
        description: 'Additional documentation and references',
      },
      'assets/': {
        required: false,
        description: 'Templates, resources, and static files',
      },
      'tests/': {
        required: false,
        description: 'Test cases and test utilities',
      },
      'examples/': {
        required: false,
        description: 'Example usage scenarios',
      },
    };
  }

  /**
   * 验证目录结构
   */
  validateDirectoryStructure(files: string[]): {
    valid: boolean;
    missing: string[];
    unexpected: string[];
  } {
    const structure = this.getStandardDirectoryStructure();
    const requiredFiles = Object.entries(structure)
      .filter(([_, info]) => info.required)
      .map(([name]) => name);

    const missing: string[] = [];
    const unexpected: string[] = [];

    // 检查必需文件
    for (const required of requiredFiles) {
      if (!files.some(f => f === required || f.startsWith(required))) {
        missing.push(required);
      }
    }

    // 检查非标准文件（可选）
    const standardPrefixes = Object.keys(structure);
    for (const file of files) {
      const isStandard = standardPrefixes.some(prefix => 
        file === prefix || file.startsWith(prefix)
      );
      if (!isStandard) {
        unexpected.push(file);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      unexpected,
    };
  }
}

// 导出单例
export const skillStandardValidator = new SkillStandardValidator();