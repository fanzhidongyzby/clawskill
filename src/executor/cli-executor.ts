/**
 * CLI Executor - 执行 CLI-Anything 生成的 CLI 命令
 * 
 * 提供统一的 CLI 执行接口，支持：
 * - JSON 输出模式
 * - 项目状态管理
 * - REPL 会话模式
 * - 错误处理和超时
 */

import { execSync, spawn, ChildProcess } from 'child_process';

/**
 * 执行选项
 */
export interface ExecuteOptions {
  /** JSON 输出模式 */
  json?: boolean;
  
  /** 项目文件路径 */
  project?: string;
  
  /** REPL 会话模式 */
  session?: boolean;
  
  /** 执行超时（毫秒） */
  timeout?: number;
  
  /** 环境变量 */
  env?: Record<string, string>;
  
  /** 工作目录 */
  cwd?: string;
}

/**
 * 执行结果
 */
export interface ExecuteResult {
  /** 执行成功 */
  success: boolean;
  
  /** 输出内容（JSON 或文本） */
  output: any;
  
  /** 错误信息 */
  error?: string;
  
  /** 元数据 */
  metadata?: {
    /** 使用的后端 */
    backend: string;
    
    /** 执行时间（毫秒） */
    duration: number;
    
    /** 命令 */
    command: string;
    
    /** 退出码 */
    exitCode: number;
  };
}

/**
 * CLI 信息
 */
export interface CLIInfo {
  /** CLI 名称 */
  name: string;
  
  /** 版本 */
  version?: string;
  
  /** 命令组 */
  commandGroups: CommandGroup[];
  
  /** 入口点 */
  entryPoint: string;
  
  /** 是否已安装 */
  installed: boolean;
}

/**
 * 命令组
 */
export interface CommandGroup {
  name: string;
  description: string;
  commands: CommandInfo[];
}

/**
 * 命令信息
 */
export interface CommandInfo {
  name: string;
  description: string;
  options?: string[];
}

/**
 * CLI 执行器
 */
export class CLIExecutor {
  /**
   * 执行 CLI 命令
   * 
   * @param entryPoint CLI 入口点（如 'cli-anything-blender'）
   * @param command 命令名称
   * @param args 命令参数
   * @param options 执行选项
   */
  async execute(
    entryPoint: string,
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    const startTime = Date.now();
    
    // Check if CLI is installed
    if (!await this.isInstalled(entryPoint)) {
      return {
        success: false,
        output: null,
        error: `CLI '${entryPoint}' is not installed. Run: clawskill install skill://cli-anything/${entryPoint.replace('cli-anything-', '')}`,
      };
    }
    
    // Build command arguments
    const cmdArgs = this.buildCommandArgs(command, args, options);
    
    try {
      const result = await this.runCommand(entryPoint, cmdArgs, options);
      const duration = Date.now() - startTime;
      
      // Parse JSON output if requested
      let output = result.stdout;
      if (options.json && result.stdout) {
        try {
          output = JSON.parse(result.stdout);
        } catch {
          // Keep raw output if not valid JSON
        }
      }
      
      return {
        success: result.exitCode === 0,
        output,
        error: result.stderr || undefined,
        metadata: {
          backend: entryPoint,
          duration,
          command: `${entryPoint} ${cmdArgs.join(' ')}`,
          exitCode: result.exitCode,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: (error as Error).message,
        metadata: {
          backend: entryPoint,
          duration: Date.now() - startTime,
          command: `${entryPoint} ${cmdArgs.join(' ')}`,
          exitCode: 1,
        },
      };
    }
  }
  
  /**
   * 执行多个命令（批量）
   */
  async executeBatch(
    entryPoint: string,
    commands: Array<{ command: string; args: string[] }>,
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult[]> {
    const results: ExecuteResult[] = [];
    
    for (const cmd of commands) {
      const result = await this.execute(entryPoint, cmd.command, cmd.args, options);
      results.push(result);
      
      // Stop batch if any command fails
      if (!result.success && !options.env?.CONTINUE_ON_ERROR) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * 检查 CLI 是否安装
   */
  async isInstalled(entryPoint: string): Promise<boolean> {
    try {
      execSync(`which ${entryPoint}`, { 
        stdio: 'pipe',
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取 CLI --help 信息
   */
  async getHelp(entryPoint: string): Promise<string> {
    try {
      const result = execSync(`${entryPoint} --help`, {
        encoding: 'utf-8',
        timeout: 10000,
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to get help for '${entryPoint}': ${(error as Error).message}`);
    }
  }
  
  /**
   * 获取 CLI 版本
   */
  async getVersion(entryPoint: string): Promise<string | null> {
    try {
      const result = execSync(`${entryPoint} --version`, {
        encoding: 'utf-8',
        timeout: 5000,
      });
      return result.trim();
    } catch {
      return null;
    }
  }
  
  /**
   * 获取 CLI 信息（解析 --help）
   */
  async getCLIInfo(entryPoint: string): Promise<CLIInfo> {
    const installed = await this.isInstalled(entryPoint);
    
    if (!installed) {
      return {
        name: entryPoint,
        entryPoint,
        installed: false,
        commandGroups: [],
      };
    }
    
    const helpText = await this.getHelp(entryPoint);
    const version = await this.getVersion(entryPoint);
    const commandGroups = this.parseHelp(helpText);
    
    return {
      name: entryPoint,
      version: version || undefined,
      entryPoint,
      installed: true,
      commandGroups,
    };
  }
  
  /**
   * 启动 REPL 会话
   */
  startREPLSession(
    entryPoint: string,
    options: ExecuteOptions = {}
  ): ChildProcess {
    return spawn(entryPoint, [], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
    });
  }
  
  /**
   * 运行带项目的命令
   */
  async executeWithProject(
    entryPoint: string,
    projectPath: string,
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    return this.execute(entryPoint, command, args, {
      ...options,
      project: projectPath,
    });
  }
  
  // ==================== Private Methods ====================
  
  private buildCommandArgs(
    command: string,
    args: string[],
    options: ExecuteOptions
  ): string[] {
    const result: string[] = [];
    
    // Add global flags
    if (options.json) result.push('--json');
    if (options.project) result.push('--project', options.project);
    
    // Add command
    result.push(command);
    
    // Add command arguments
    result.push(...args);
    
    return result;
  }
  
  private async runCommand(
    entryPoint: string,
    args: string[],
    options: ExecuteOptions
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const timeout = options.timeout || 30000;
    const fullCommand = `${entryPoint} ${args.join(' ')}`;
    
    try {
      const stdout = execSync(fullCommand, {
        encoding: 'utf-8',
        timeout,
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      
      return {
        stdout,
        stderr: '',
        exitCode: 0,
      };
    } catch (error: any) {
      if (error.status) {
        return {
          stdout: error.stdout || '',
          stderr: error.stderr || error.message,
          exitCode: error.status,
        };
      }
      throw error;
    }
  }
  
  private parseHelp(helpText: string): CommandGroup[] {
    const groups: CommandGroup[] = [];
    
    // Simple parsing - look for command patterns
    // Most CLI-Anything CLIs use Click format
    const lines = helpText.split('\n');
    
    let currentGroup: CommandGroup | null = null;
    
    for (const line of lines) {
      // Match command group headers (e.g., "Commands:")
      const groupMatch = line.match(/^(\w+):$/);
      if (groupMatch) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          name: groupMatch[1],
          description: '',
          commands: [],
        };
        continue;
      }
      
      // Match commands (e.g., "  scene      Create and manage scenes")
      if (currentGroup) {
        const cmdMatch = line.match(/^\s{2,}(\w+)\s+(.*)$/);
        if (cmdMatch) {
          currentGroup.commands.push({
            name: cmdMatch[1],
            description: cmdMatch[2].trim(),
          });
        }
      }
    }
    
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  }
}

// Export singleton instance
export const cliExecutor = new CLIExecutor();