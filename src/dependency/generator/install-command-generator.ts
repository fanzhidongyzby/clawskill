/**
 * 安装命令生成器
 * 根据技能类型和目标平台生成安装命令
 */
import { DependencyItem, SkillMetadata } from '../types/dependency';

/**
 * 安装命令
 */
export interface InstallCommand {
  /**
   * 平台类型
   */
  platform: 'openclaw' | 'npm' | 'pip' | 'cargo' | 'go';

  /**
   * 命令文本
   */
  command: string;

  /**
   * 说明
   */
  description?: string;

  /**
   * 是否需要额外步骤
   */
  postInstall?: string;
}

/**
 * 安装计划
 */
export interface InstallPlan {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 版本
   */
  version: string;

  /**
   * 依赖列表
   */
  dependencies: DependencyItem[];

  /**
   * 安装命令（按平台）
   */
  commands: InstallCommand[];

  /**
   * 总步骤数
   */
  totalSteps: number;
}

/**
 * 平台配置
 */
interface PlatformConfig {
  name: string;
  installPrefix: string;
  versionSeparator: string;
  postInstallHint?: string;
}

/**
 * 安装命令生成器
 */
export class InstallCommandGenerator {
  private platforms: Map<string, PlatformConfig>;

  constructor() {
    this.platforms = new Map([
      ['openclaw', {
        name: 'OpenClaw',
        installPrefix: 'openclaw clawhub install',
        versionSeparator: '@',
        postInstallHint: '# 验证安装\nopenclaw clawhub list',
      }],
      ['npm', {
        name: 'npm',
        installPrefix: 'npm install',
        versionSeparator: '@',
        postInstallHint: '# 验证安装\nnpm list',
      }],
      ['pip', {
        name: 'pip',
        installPrefix: 'pip install',
        versionSeparator: '==',
        postInstallHint: '# 验证安装\npip show',
      }],
      ['cargo', {
        name: 'Cargo',
        installPrefix: 'cargo install',
        versionSeparator: '--version',
        postInstallHint: '# 验证安装\ncargo list',
      }],
      ['go', {
        name: 'Go',
        installPrefix: 'go install',
        versionSeparator: '@',
        postInstallHint: '# 验证安装\ngo version',
      }],
    ]);
  }

  /**
   * 生成安装计划
   * @param skill 技能元数据
   * @param dependencies 依赖列表
   */
  generateInstallPlan(skill: SkillMetadata, dependencies: DependencyItem[]): InstallPlan {
    const commands: InstallCommand[] = [];

    // 为每个平台生成命令
    for (const [platform, config] of this.platforms) {
      const command = this.generateCommand(skill, dependencies, platform as any);
      commands.push(command);
    }

    return {
      skillId: skill.id,
      version: skill.version,
      dependencies,
      commands,
      totalSteps: 1 + dependencies.length,
    };
  }

  /**
   * 生成单个平台的安装命令
   */
  private generateCommand(
    skill: SkillMetadata,
    dependencies: DependencyItem[],
    platform: 'openclaw' | 'npm' | 'pip' | 'cargo' | 'go'
  ): InstallCommand {
    const config = this.platforms.get(platform)!;
    const lines: string[] = [];

    // 1. 安装依赖
    if (dependencies.length > 0) {
      lines.push('# 安装依赖');
      for (const dep of dependencies) {
        const depCommand = this.formatPackageCommand(dep.name, dep.version, config);
        lines.push(depCommand);
      }
      lines.push('');
    }

    // 2. 安装技能
    lines.push('# 安装技能');
    const skillCommand = this.formatPackageCommand(skill.id, skill.version, config);
    lines.push(skillCommand);

    // 3. 后置步骤
    if (config.postInstallHint) {
      lines.push('');
      lines.push(config.postInstallHint);
    }

    return {
      platform,
      command: lines.join('\n'),
      description: config.name,
      postInstall: config.postInstallHint,
    };
  }

  /**
   * 格式化包安装命令
   */
  private formatPackageCommand(
    packageName: string,
    version?: string,
    config: PlatformConfig
  ): string {
    let command = `${config.installPrefix} ${packageName}`;

    if (version && version !== 'latest') {
      command += `${config.versionSeparator}${version}`;
    }

    return command;
  }

  /**
   * 生成批处理安装命令（安装多个技能）
   * @param skills 技能列表
   * @param platform 目标平台
   */
  generateBatchInstall(
    skills: SkillMetadata[],
    platform: 'openclaw' | 'npm' | 'pip' | 'cargo' | 'go'
  ): string {
    const config = this.platforms.get(platform)!;
    const lines: string[] = [];

    lines.push('# 批量安装技能');
    lines.push('');

    const packages = skills.map((skill) => {
      if (skill.version && skill.version !== 'latest') {
        return `${skill.id}${config.versionSeparator}${skill.version}`;
      }
      return skill.id;
    });

    if (platform === 'npm' || platform === 'openclaw') {
      // npm 和 OpenClaw 支持一次安装多个包
      lines.push(`${config.installPrefix} ${packages.join(' ')}`);
    } else {
      // 其他平台逐个安装
      for (const pkg of packages) {
        lines.push(`${config.installPrefix} ${pkg}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 生成 Dockerfile 安装脚本
   * @param skills 技能列表
   */
  generateDockerfile(skills: SkillMetadata[]): string {
    const lines: string[] = [
      'FROM node:20-alpine',
      '',
      '# 安装 OpenClaw',
      'RUN npm install -g openclaw',
      '',
      '# 安装技能',
    ];

    for (const skill of skills) {
      lines.push(`RUN openclaw clawhub install ${skill.id}@${skill.version}`);
    }

    return lines.join('\n');
  }

  /**
   * 生成 Shell 安装脚本
   * @param skills 技能列表
   * @param platform 平台
   */
  generateShellScript(skills: SkillMetadata[], platform: string): string {
    const lines: string[] = [
      '#!/bin/bash',
      'set -e',
      '',
      '# 安装技能脚本',
      '',
    ];

    for (const skill of skills) {
      lines.push(`echo "Installing ${skill.id}@${skill.version}..."`);

      if (platform === 'openclaw') {
        lines.push(`openclaw clawhub install ${skill.id}@${skill.version}`);
      } else if (platform === 'npm') {
        lines.push(`npm install ${skill.id}@${skill.version}`);
      } else if (platform === 'pip') {
        lines.push(`pip install ${skill.id}==${skill.version}`);
      }

      lines.push('');
    }

    lines.push('echo "All skills installed successfully!"');

    return lines.join('\n');
  }

  /**
   * 检测平台
   * @param packageName 包名
   */
  detectPlatform(packageName: string): 'openclaw' | 'npm' | 'pip' | 'cargo' | 'go' | null {
    if (packageName.startsWith('@openclaw/') || packageName.includes('openclaw')) {
      return 'openclaw';
    }
    if (packageName.startsWith('@') || /node_modules|\.js$/.test(packageName)) {
      return 'npm';
    }
    if (/\.(py|whl)$/.test(packageName) || packageName.includes('python')) {
      return 'pip';
    }
    if (/\.(rs)$/.test(packageName) || packageName.includes('rust')) {
      return 'cargo';
    }
    if (/\.(go)$/.test(packageName) || packageName.includes('golang')) {
      return 'go';
    }
    return null;
  }

  /**
   * 添加自定义平台
   * @param platform 平台名称
   * @param config 平台配置
   */
  addPlatform(platform: string, config: PlatformConfig): void {
    this.platforms.set(platform, config);
  }
}