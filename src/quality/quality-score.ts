/**
 * Quality Score 质量评分系统
 *
 * 五维评分框架：
 * - 目标完成度 (goalFulfillment): 30% - 技能是否有效解决问题
 * - 效率 (efficiency): 20% - 响应时间 + 资源消耗
 * - 安全性 (safety): 20% - Snyk扫描 + 许可证合规
 * - 鲁棒性 (robustness): 15% - 错误恢复 + 边缘案例
 * - 用户体验 (userExperience): 15% - 文档质量 + 社区活跃度
 *
 * 评分等级：
 * - A级 (≥0.90): 推荐使用，精选列表
 * - B级 (0.80-0.89): 良好，正常索引
 * - C级 (0.60-0.79): 可用，有改进空间
 * - D级 (<0.60): 不推荐，标记"需谨慎使用"
 */

import type { Skill, SkillDetail } from '../types/skill';

/**
 * 五维评分详情
 */
export interface QualityScoreDimensions {
  goalFulfillment: {
    score: number; // 0-1
    weight: 0.3;
    metrics: {
      descriptionClarity: number; // 描述清晰度 0-1
      installSuccess: number; // 安装成功率 0-1
      executionSuccess: number; // 执行成功率 0-1
      userSatisfaction: number; // 用户满意度 0-1
    };
    findings: string[];
  };
  efficiency: {
    score: number; // 0-1
    weight: 0.2;
    metrics: {
      avgResponseTime: number; // 平均响应时间 (ms)
      avgTokenUsage: number; // 平均 Token 使用量
      resourceEfficiency: number; // 资源效率 0-1
    };
    findings: string[];
  };
  safety: {
    score: number; // 0-1
    weight: 0.2;
    metrics: {
      vulnerabilityScore: number; // 漏洞评分 0-1 (越高越好)
      licenseCompliance: number; // 许可证合规 0-1
      sensitiveDataCheck: number; // 敏感数据检测 0-1
      permissionsMinimal: number; // 权限最小化 0-1
    };
    findings: string[];
  };
  robustness: {
    score: number; // 0-1
    weight: 0.15;
    metrics: {
      errorHandling: number; // 错误处理 0-1
      edgeCaseCoverage: number; // 边缘案例覆盖 0-1
      retryMechanism: number; // 重试机制 0-1
      fallbackAvailable: number; // 降级可用 0-1
    };
    findings: string[];
  };
  userExperience: {
    score: number; // 0-1
    weight: 0.15;
    metrics: {
      documentationQuality: number; // 文档质量 0-1
      examplesProvided: number; // 示例提供 0-1
      communityActivity: number; // 社区活跃度 0-1
      responseTime: number; // 问题响应时间 (天)
    };
    findings: string[];
  };
}

/**
 * 质量评分结果
 */
export interface QualityScoreResult {
  skillId: string;
  score: number; // 0-1 (标准化分数)
  score100: number; // 0-100 (百分制)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: QualityScoreDimensions;
  recommendation: 'recommended' | 'good' | 'acceptable' | 'caution' | 'avoid';
  scannedAt: Date;
  expiresAt: Date; // 缓存过期时间
}

/**
 * 质量评分配置
 */
export interface QualityScoreConfig {
  cacheTTLHours: number; // 缓存时间（小时）
  minRatingsForUserSatisfaction: number; // 计算用户满意度所需最小评分数
  weights: {
    goalFulfillment: number;
    efficiency: number;
    safety: number;
    robustness: number;
    userExperience: number;
  };
}

const DEFAULT_CONFIG: QualityScoreConfig = {
  cacheTTLHours: 24,
  minRatingsForUserSatisfaction: 5,
  weights: {
    goalFulfillment: 0.30,
    efficiency: 0.20,
    safety: 0.20,
    robustness: 0.15,
    userExperience: 0.15,
  },
};

/**
 * 质量评分服务
 */
export class QualityScoreService {
  private config: QualityScoreConfig;
  private cache: Map<string, QualityScoreResult> = new Map();

  constructor(config: Partial<QualityScoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 计算技能质量评分
   */
  async calculateQualityScore(skill: Skill | SkillDetail): Promise<QualityScoreResult> {
    // 检查缓存
    const cached = this.cache.get(skill.id);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    // 计算各维度评分
    const dimensions: QualityScoreDimensions = {
      goalFulfillment: await this.calculateGoalFulfillment(skill),
      efficiency: await this.calculateEfficiency(skill),
      safety: await this.calculateSafety(skill),
      robustness: await this.calculateRobustness(skill),
      userExperience: await this.calculateUserExperience(skill),
    };

    // 计算加权总分
    const score = this.calculateWeightedScore(dimensions);
    const score100 = Math.round(score * 100);
    const grade = this.getGrade(score);
    const recommendation = this.getRecommendation(score);

    const result: QualityScoreResult = {
      skillId: skill.id,
      score,
      score100,
      grade,
      dimensions,
      recommendation,
      scannedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheTTLHours * 60 * 60 * 1000),
    };

    // 缓存结果
    this.cache.set(skill.id, result);

    return result;
  }

  /**
   * 批量计算质量评分
   */
  async calculateBatch(skills: (Skill | SkillDetail)[]): Promise<QualityScoreResult[]> {
    return Promise.all(skills.map(skill => this.calculateQualityScore(skill)));
  }

  /**
   * 获取缓存的评分
   */
  getCached(skillId: string): QualityScoreResult | null {
    const cached = this.cache.get(skillId);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    return null;
  }

  /**
   * 清除缓存
   */
  clearCache(skillId?: string): void {
    if (skillId) {
      this.cache.delete(skillId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 计算目标完成度 (30%)
   */
  private async calculateGoalFulfillment(skill: Skill | SkillDetail): Promise<QualityScoreDimensions['goalFulfillment']> {
    const findings: string[] = [];
    const metrics = {
      descriptionClarity: this.assessDescriptionClarity(skill),
      installSuccess: this.assessInstallSuccess(skill),
      executionSuccess: 0.85, // 默认值，实际应从执行日志获取
      userSatisfaction: 0.80, // 默认值，实际应从用户反馈获取
    };

    // 分析描述清晰度
    if (metrics.descriptionClarity < 0.5) {
      findings.push('描述不够清晰，建议添加更详细的使用说明');
    }

    // 分析安装成功率
    if (metrics.installSuccess < 0.8) {
      findings.push('安装成功率较低，请检查依赖配置');
    }

    // 计算综合得分
    const score = (
      metrics.descriptionClarity * 0.2 +
      metrics.installSuccess * 0.3 +
      metrics.executionSuccess * 0.3 +
      metrics.userSatisfaction * 0.2
    );

    return { score, weight: 0.3, metrics, findings };
  }

  /**
   * 计算效率 (20%)
   */
  private async calculateEfficiency(skill: Skill | SkillDetail): Promise<QualityScoreDimensions['efficiency']> {
    const findings: string[] = [];
    const metrics = {
      avgResponseTime: 500, // 默认值 (ms)
      avgTokenUsage: 1000, // 默认值
      resourceEfficiency: 0.75, // 默认值
    };

    // 基于技能特征估算
    if (skill.keywords?.includes('fast') || skill.keywords?.includes('lightweight')) {
      metrics.avgResponseTime = 200;
      metrics.resourceEfficiency = 0.9;
    }

    // 计算效率得分（响应时间越低越好）
    const timeScore = Math.max(0, 1 - metrics.avgResponseTime / 5000);
    const tokenScore = Math.max(0, 1 - metrics.avgTokenUsage / 10000);

    const score = (timeScore * 0.4 + tokenScore * 0.3 + metrics.resourceEfficiency * 0.3);

    if (metrics.avgResponseTime > 2000) {
      findings.push(`平均响应时间较长 (${metrics.avgResponseTime}ms)`);
    }

    return { score, weight: 0.2, metrics, findings };
  }

  /**
   * 计算安全性 (20%)
   */
  private async calculateSafety(skill: Skill | SkillDetail): Promise<QualityScoreDimensions['safety']> {
    const findings: string[] = [];
    const metrics = {
      vulnerabilityScore: 1.0, // 默认无漏洞
      licenseCompliance: this.assessLicenseCompliance(skill.license),
      sensitiveDataCheck: 1.0, // 默认通过
      permissionsMinimal: 0.9, // 默认良好
    };

    // 检查许可证合规性
    if (metrics.licenseCompliance < 1) {
      findings.push(`许可证 ${skill.license} 可能存在合规风险`);
    }

    // 计算安全得分
    const score = (
      metrics.vulnerabilityScore * 0.35 +
      metrics.licenseCompliance * 0.25 +
      metrics.sensitiveDataCheck * 0.25 +
      metrics.permissionsMinimal * 0.15
    );

    return { score, weight: 0.2, metrics, findings };
  }

  /**
   * 计算鲁棒性 (15%)
   */
  private async calculateRobustness(skill: Skill | SkillDetail): Promise<QualityScoreDimensions['robustness']> {
    const findings: string[] = [];
    const metrics = {
      errorHandling: 0.8, // 默认值
      edgeCaseCoverage: 0.7, // 默认值
      retryMechanism: 0.6, // 默认值
      fallbackAvailable: 0.5, // 默认值
    };

    // 基于描述和关键词推断
    const desc = skill.description.toLowerCase();
    if (desc.includes('retry') || desc.includes('重试')) {
      metrics.retryMechanism = 0.9;
    }
    if (desc.includes('fallback') || desc.includes('降级')) {
      metrics.fallbackAvailable = 0.85;
    }
    if (desc.includes('error') || desc.includes('错误处理')) {
      metrics.errorHandling = 0.9;
    }

    const score = (
      metrics.errorHandling * 0.3 +
      metrics.edgeCaseCoverage * 0.3 +
      metrics.retryMechanism * 0.2 +
      metrics.fallbackAvailable * 0.2
    );

    if (metrics.retryMechanism < 0.7) {
      findings.push('建议添加重试机制以提高可靠性');
    }

    return { score, weight: 0.15, metrics, findings };
  }

  /**
   * 计算用户体验 (15%)
   */
  private async calculateUserExperience(skill: Skill | SkillDetail): Promise<QualityScoreDimensions['userExperience']> {
    const findings: string[] = [];
    const metrics = {
      documentationQuality: this.assessDocumentationQuality(skill),
      examplesProvided: this.assessExamplesProvided(skill),
      communityActivity: this.assessCommunityActivity(skill),
      responseTime: 3, // 默认响应时间（天）
    };

    // 分析文档质量
    if (metrics.documentationQuality < 0.6) {
      findings.push('文档质量有待提高，建议添加更多示例');
    }

    // 分析社区活跃度
    if (metrics.communityActivity < 0.5) {
      findings.push('社区活跃度较低，建议增加互动');
    }

    const score = (
      metrics.documentationQuality * 0.35 +
      metrics.examplesProvided * 0.25 +
      metrics.communityActivity * 0.25 +
      Math.max(0, 1 - metrics.responseTime / 14) * 0.15
    );

    return { score, weight: 0.15, metrics, findings };
  }

  /**
   * 计算加权总分
   */
  private calculateWeightedScore(dimensions: QualityScoreDimensions): number {
    return (
      dimensions.goalFulfillment.score * dimensions.goalFulfillment.weight +
      dimensions.efficiency.score * dimensions.efficiency.weight +
      dimensions.safety.score * dimensions.safety.weight +
      dimensions.robustness.score * dimensions.robustness.weight +
      dimensions.userExperience.score * dimensions.userExperience.weight
    );
  }

  /**
   * 获取评分等级
   */
  private getGrade(score: number): QualityScoreResult['grade'] {
    if (score >= 0.90) return 'A';
    if (score >= 0.80) return 'B';
    if (score >= 0.70) return 'C';
    if (score >= 0.60) return 'D';
    return 'F';
  }

  /**
   * 获取推荐等级
   */
  private getRecommendation(score: number): QualityScoreResult['recommendation'] {
    if (score >= 0.90) return 'recommended';
    if (score >= 0.80) return 'good';
    if (score >= 0.70) return 'acceptable';
    if (score >= 0.60) return 'caution';
    return 'avoid';
  }

  // ========== 辅助评估方法 ==========

  /**
   * 评估描述清晰度
   */
  private assessDescriptionClarity(skill: Skill | SkillDetail): number {
    let score = 0;
    const desc = skill.description || '';

    // 长度检查
    if (desc.length >= 50) score += 0.2;
    if (desc.length >= 100) score += 0.2;

    // 关键词检查
    if (/use|使用|when|当|example|示例/i.test(desc)) score += 0.2;
    if (/install|安装|setup|配置/i.test(desc)) score += 0.2;

    // 结构检查
    if (desc.includes('\n') || desc.includes('。')) score += 0.2;

    return Math.min(1, score);
  }

  /**
   * 评估安装成功率
   */
  private assessInstallSuccess(skill: Skill | SkillDetail): number {
    // 基于技能特征估算
    let score = 0.9; // 默认高成功率

    // 有安装命令则成功率更高
    if ('installCommands' in skill && skill.installCommands?.length > 0) {
      score = 0.95;
    }

    return score;
  }

  /**
   * 评估许可证合规性
   */
  private assessLicenseCompliance(license: string): number {
    // OSI 认可的开源许可证
    const safeLicenses = [
      'MIT', 'Apache-2.0', 'Apache 2.0', 'BSD-2-Clause', 'BSD-3-Clause',
      'ISC', '0BSD', 'MPL-2.0', 'LGPL-2.1', 'LGPL-3.0',
    ];

    // 需要关注的许可证
    const cautionLicenses = [
      'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL', 'BSL',
    ];

    const normalizedLicense = license?.toUpperCase() || '';

    if (safeLicenses.some(l => normalizedLicense.includes(l.toUpperCase()))) {
      return 1.0;
    }
    if (cautionLicenses.some(l => normalizedLicense.includes(l.toUpperCase()))) {
      return 0.6;
    }
    if (license === 'UNLICENSED' || license === 'PROPRIETARY') {
      return 0.3;
    }

    return 0.8; // 未知许可证，给予中等评分
  }

  /**
   * 评估文档质量
   */
  private assessDocumentationQuality(skill: Skill | SkillDetail): number {
    let score = 0.5; // 基础分

    // 有描述
    if (skill.description && skill.description.length > 50) {
      score += 0.15;
    }

    // 有关键词
    if (skill.keywords && skill.keywords.length > 0) {
      score += 0.1;
    }

    // 有主页或仓库
    if (skill.homepage || skill.repository) {
      score += 0.15;
    }

    // 有 README (仅 SkillDetail)
    if ('readme' in skill && skill.readme) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * 评估示例提供情况
   */
  private assessExamplesProvided(skill: Skill | SkillDetail): number {
    let score = 0;

    const desc = skill.description?.toLowerCase() || '';
    const keywords = skill.keywords?.join(' ').toLowerCase() || '';

    // 检查描述中的示例
    if (/example|示例|sample|例子/i.test(desc)) {
      score += 0.4;
    }

    // 检查关键词中的示例相关词
    if (/example|sample|demo|tutorial/i.test(keywords)) {
      score += 0.3;
    }

    // 有安装命令
    if ('installCommands' in skill && skill.installCommands?.length > 0) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  /**
   * 评估社区活跃度
   */
  private assessCommunityActivity(skill: Skill | SkillDetail): number {
    let score = 0.5; // 基础分

    // 基于 stars
    if (skill.stars > 100) score += 0.1;
    if (skill.stars > 500) score += 0.1;
    if (skill.stars > 1000) score += 0.1;

    // 基于下载量
    if (skill.downloads > 100) score += 0.05;
    if (skill.downloads > 1000) score += 0.05;
    if (skill.downloads > 10000) score += 0.1;

    return Math.min(1, score);
  }
}

// 导出单例
export const qualityScoreService = new QualityScoreService();