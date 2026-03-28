/**
 * Skill Executor - 技能执行器核心模块
 * 
 * 提供统一的技能执行接口，整合：
 * - CLI-Anything CLI 执行
 * - 技能 URL 解析
 * - 自动安装
 * - 结果处理
 */

import { CLIExecutor, ExecuteOptions, ExecuteResult, cliExecutor } from './cli-executor';
import { CLIAnythingSource, cliAnythingSource } from '../sources/cli-anything-source';
import { parseSkillUrl } from '../core/skill-url';
import { Skill, SkillSearchResult } from '../types/skill';

/**
 * 技能执行配置
 */
export interface SkillExecutorConfig {
  /** 自动安装未安装的技能 */
  autoInstall?: boolean;
  
  /** 默认超时（毫秒） */
  defaultTimeout?: number;
  
  /** JSON 输出模式 */
  jsonMode?: boolean;
  
  /** 缓存技能信息 */
  cacheSkills?: boolean;
}

/**
 * 技能 CLI 信息
 */
export interface SkillCLIInfo {
  /** 技能 URL */
  skillUrl: string;
  
  /** 入口点 */
  entryPoint: string;
  
  /** 是否已安装 */
  installed: boolean;
  
  /** 版本 */
  version: string;
  
  /** 命令组 */
  commandGroups: Array<{
    name: string;
    commands: string[];
  }>;
  
  /** SKILL.md 路径 */
  skillMdPath?: string;
}

/**
 * 批量执行结果
 */
export interface BatchExecuteResult {
  results: ExecuteResult[];
  success: boolean;
  failedCommands: string[];
}

/**
 * 技能执行器
 */
export class SkillExecutor {
  private cliExecutor: CLIExecutor;
  private cliAnythingSource: CLIAnythingSource;
  private config: SkillExecutorConfig;
  private skillCache: Map<string, Skill> = new Map();
  
  constructor(config: SkillExecutorConfig = {}) {
    this.cliExecutor = cliExecutor;
    this.cliAnythingSource = cliAnythingSource;
    this.config = {
      autoInstall: true,
      defaultTimeout: 30000,
      jsonMode: true,
      cacheSkills: true,
      ...config,
    };
  }
  
  /**
   * 执行技能命令
   * 
   * @param skillUrl 技能 URL (skill://cli-anything/blender@1.0.0)
   * @param command 命令名称
   * @param args 命令参数
   * @param options 执行选项
   */
  async execute(
    skillUrl: string,
    command: string,
    args: Record<string, any> = {},
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    // Parse skill URL
    const { namespace, name: _name, version: _version } = parseSkillUrl(skillUrl);
    
    // Validate namespace
    if (namespace !== 'cli-anything') {
      return {
        success: false,
        output: null,
        error: `Only CLI-Anything skills are supported. Got namespace: ${namespace}`,
      };
    }
    
    // Get skill info
    const skillInfo = await this.getSkillCLIInfo(skillUrl);
    
    // Auto-install if needed
    if (!skillInfo.installed && this.config.autoInstall) {
      const installResult = await this.installSkill(skillUrl);
      if (!installResult.success) {
        return {
          success: false,
          output: null,
          error: `Failed to install skill: ${installResult.error}`,
        };
      }
    }
    
    // Convert args object to CLI args array
    const cliArgs = this.argsToArray(args);
    
    // Execute command
    return this.cliExecutor.execute(
      skillInfo.entryPoint,
      command,
      cliArgs,
      {
        ...options,
        json: options.json ?? this.config.jsonMode,
        timeout: options.timeout ?? this.config.defaultTimeout,
      }
    );
  }
  
  /**
   * 执行带项目状态的命令
   */
  async executeWithProject(
    skillUrl: string,
    projectPath: string,
    command: string,
    args: Record<string, any> = {},
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    return this.execute(skillUrl, command, args, {
      ...options,
      project: projectPath,
    });
  }
  
  /**
   * 批量执行命令
   */
  async executeBatch(
    skillUrl: string,
    commands: Array<{
      command: string;
      args: Record<string, any>;
    }>,
    options: ExecuteOptions = {}
  ): Promise<BatchExecuteResult> {
    const results: ExecuteResult[] = [];
    const failedCommands: string[] = [];
    
    for (const cmd of commands) {
      const result = await this.execute(skillUrl, cmd.command, cmd.args, options);
      results.push(result);
      
      if (!result.success) {
        failedCommands.push(cmd.command);
        // Stop on first failure unless continue on error
        if (!options.env?.CONTINUE_ON_ERROR) {
          break;
        }
      }
    }
    
    return {
      results,
      success: failedCommands.length === 0,
      failedCommands,
    };
  }
  
  /**
   * 获取技能 CLI 信息
   */
  async getSkillCLIInfo(skillUrl: string): Promise<SkillCLIInfo> {
    const { name, version: _version } = parseSkillUrl(skillUrl);
    const skill = await this.getSkill(skillUrl);
    
    const entryPoint = `cli-anything-${name}`;
    const installed = await this.cliExecutor.isInstalled(entryPoint);
    
    let commandGroups: Array<{ name: string; commands: string[] }> = [];
    
    if (installed) {
      const cliInfo = await this.cliExecutor.getCLIInfo(entryPoint);
      commandGroups = cliInfo.commandGroups.map(g => ({
        name: g.name,
        commands: g.commands.map(c => c.name),
      }));
    }
    
    return {
      skillUrl,
      entryPoint,
      installed,
      version: skill.version,
      commandGroups,
      skillMdPath: skill.skillMdPath,
    };
  }
  
  /**
   * 安装技能
   */
  async installSkill(skillUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.cliAnythingSource.install(skillUrl);
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * 搜索技能
   */
  async searchSkills(query: string): Promise<SkillSearchResult[]> {
    return this.cliAnythingSource.search(query);
  }
  
  /**
   * 列出所有 CLI-Anything 技能
   */
  async listAllSkills(): Promise<SkillSearchResult[]> {
    return this.cliAnythingSource.listAll();
  }
  
  /**
   * 按类别列出技能
   */
  async listSkillsByCategory(category: string): Promise<SkillSearchResult[]> {
    return this.cliAnythingSource.listByCategory(category);
  }
  
  /**
   * 获取所有类别
   */
  async getCategories(): Promise<string[]> {
    return this.cliAnythingSource.getCategories();
  }
  
  /**
   * 获取技能帮助信息
   */
  async getSkillHelp(skillUrl: string): Promise<string> {
    const { name } = parseSkillUrl(skillUrl);
    const entryPoint = `cli-anything-${name}`;
    
    if (!await this.cliExecutor.isInstalled(entryPoint)) {
      throw new Error(`Skill '${name}' is not installed`);
    }
    
    return this.cliExecutor.getHelp(entryPoint);
  }
  
  /**
   * 启动 REPL 会话
   */
  async startREPL(skillUrl: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { name } = parseSkillUrl(skillUrl);
    const entryPoint = `cli-anything-${name}`;
    
    if (!await this.cliExecutor.isInstalled(entryPoint)) {
      return {
        success: false,
        error: `Skill '${name}' is not installed`,
      };
    }
    
    // Note: REPL requires interactive terminal
    // This is primarily for documentation/testing
    return {
      success: true,
    };
  }
  
  // ==================== Private Methods ====================
  
  private async getSkill(skillUrl: string): Promise<Skill> {
    // Check cache
    if (this.config.cacheSkills && this.skillCache.has(skillUrl)) {
      return this.skillCache.get(skillUrl)!;
    }
    
    const skill = await this.cliAnythingSource.getSkill(skillUrl);
    
    // Cache it
    if (this.config.cacheSkills) {
      this.skillCache.set(skillUrl, skill);
    }
    
    return skill;
  }
  
  private argsToArray(args: Record<string, any>): string[] {
    const result: string[] = [];
    
    for (const [key, value] of Object.entries(args)) {
      if (value === true) {
        // Boolean flag
        result.push(`--${key}`);
      } else if (value === false || value === null || value === undefined) {
        // Skip false/null/undefined
        continue;
      } else if (Array.isArray(value)) {
        // Array values
        for (const item of value) {
          result.push(`--${key}`, String(item));
        }
      } else if (typeof value === 'object') {
        // JSON object
        result.push(`--${key}`, JSON.stringify(value));
      } else {
        // Primitive value
        result.push(`--${key}`, String(value));
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const skillExecutor = new SkillExecutor();