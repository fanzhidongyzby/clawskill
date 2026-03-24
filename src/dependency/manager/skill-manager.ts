/**
 * 技能管理器
 * 管理技能元数据和版本
 */
import { SkillMetadata, Dependency } from '../types/dependency';
import { DependencyResolver } from './dependency-resolver';
import { InstallCommandGenerator } from './generator/install-command-generator';

/**
 * 技能信息
 */
export interface SkillInfo {
  id: string;
  name: string;
  namespace: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  categories: string[];
  compatibility: string[];
  dependencies: Dependency[];
  downloads: number;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 技能管理器
 */
export class SkillManager {
  private skills: Map<string, SkillInfo>;
  private resolver: DependencyResolver;
  private commandGenerator: InstallCommandGenerator;

  constructor() {
    this.skills = new Map();
    this.resolver = new DependencyResolver();
    this.commandGenerator = new InstallCommandGenerator();
  }

  /**
   * 注册技能
   * @param skill 技能信息
   */
  registerSkill(skill: SkillInfo): void {
    // 注册到解析器
    this.resolver.registerSkill({
      id: skill.id,
      name: skill.name,
      namespace: skill.namespace,
      version: skill.version,
      dependencies: skill.dependencies,
    });

    // 存储技能信息
    this.skills.set(skill.id, skill);
  }

  /**
   * 批量注册技能
   * @param skills 技能列表
   */
  registerSkills(skills: SkillInfo[]): void {
    for (const skill of skills) {
      this.registerSkill(skill);
    }
  }

  /**
   * 获取技能
   * @param skillId 技能ID
   */
  getSkill(skillId: string): SkillInfo | undefined {
    return this.skills.get(skillId);
  }

  /**
   * 列出所有技能
   */
  listSkills(): SkillInfo[] {
    return Array.from(this.skills.values());
  }

  /**
   * 搜索技能
   * @param query 搜索关键词
   */
  searchSkills(query: string): SkillInfo[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.skills.values()).filter((skill) =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery) ||
      skill.keywords.some((k) => k.toLowerCase().includes(lowerQuery)) ||
      skill.categories.some((c) => c.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 解析依赖
   * @param skillId 技能ID
   * @param version 版本
   */
  async resolveDependencies(skillId: string, version: string) {
    return await this.resolver.resolve(skillId, version);
  }

  /**
   * 生成安装命令
   * @param skillId 技能ID
   * @param version 版本
   * @param platform 平台
   */
  generateInstallCommand(skillId: string, version: string, platform?: 'openclaw' | 'npm' | 'pip' | 'cargo' | 'go') {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    // 解析依赖
    const result = await this.resolver.resolve(skillId, version);

    // 生成安装计划
    const plan = this.commandGenerator.generateInstallPlan({
      id: skill.id,
      name: skill.name,
      namespace: skill.namespace,
      version,
      dependencies: skill.dependencies,
    }, result.flattened);

    if (platform) {
      return plan.commands.find((c) => c.platform === platform);
    }

    return plan;
  }

  /**
   * 更新技能统计
   * @param skillId 技能ID
   * @param stats 统计数据
   */
  updateStats(skillId: string, stats: { downloads?: number; stars?: number }): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    if (stats.downloads !== undefined) {
      skill.downloads += stats.downloads;
    }
    if (stats.stars !== undefined) {
      skill.stars = stats.stars;
    }

    skill.updatedAt = new Date();
  }

  /**
   * 删除技能
   * @param skillId 技能ID
   */
  removeSkill(skillId: string): boolean {
    return this.skills.delete(skillId);
  }

  /**
   * 获取技能统计
   */
  getStats(): {
    total: number;
    totalDownloads: number;
    totalStars: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let totalDownloads = 0;
    let totalStars = 0;

    for (const skill of this.skills.values()) {
      totalDownloads += skill.downloads;
      totalStars += skill.stars;

      for (const category of skill.categories) {
        byCategory[category] = (byCategory[category] || 0) + 1;
      }
    }

    return {
      total: this.skills.size,
      totalDownloads,
      totalStars,
      byCategory,
    };
  }
}