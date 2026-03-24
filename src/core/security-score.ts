/**
 * 安全评分服务
 *
 * 计算技能的安全评分 (0-100 分)
 * 基于以下维度：
 * - 敏感信息检测（权重 30%）
 * - 依赖漏洞（权重 25%）
 * - 代码质量（权重 20%）
 * - 维护活跃度（权重 15%）
 * - 用户反馈（权重 10%）
 */

export interface SecurityScoreDetails {
  sensitiveInfo: {
    score: number; // 0-100
    weight: 0.3;
    findings: string[];
  };
  dependencyVulnerabilities: {
    score: number; // 0-100
    weight: 0.25;
    findings: string[];
  };
  codeQuality: {
    score: number; // 0-100
    weight: 0.2;
    metrics: {
      testCoverage: number;
      codeComplexity: number;
      documentation: number;
    };
  };
  maintenanceActivity: {
    score: number; // 0-100
    weight: 0.15;
    metrics: {
      lastCommitDays: number;
      releaseFrequency: number;
      issueResponse: number;
    };
  };
  userFeedback: {
    score: number; // 0-100
    weight: 0.1;
    metrics: {
      averageRating: number;
      totalDownloads: number;
      positiveFeedback: number;
    };
  };
}

export interface SecurityScoreResult {
  score: number; // 0-100
  level: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  details: SecurityScoreDetails;
  scannedAt: Date;
}

export class SecurityScoreService {
  /**
   * 计算技能的安全评分
   */
  async calculateSecurityScore(skillId: string): Promise<SecurityScoreResult> {
    const details: SecurityScoreDetails = {
      sensitiveInfo: await this.calculateSensitiveInfoScore(skillId),
      dependencyVulnerabilities: await this.calculateDependencyScore(skillId),
      codeQuality: await this.calculateCodeQualityScore(skillId),
      maintenanceActivity: await this.calculateMaintenanceScore(skillId),
      userFeedback: await this.calculateUserFeedbackScore(skillId),
    };

    // 计算加权总分
    const totalScore =
      details.sensitiveInfo.score * details.sensitiveInfo.weight +
      details.dependencyVulnerabilities.score * details.dependencyVulnerabilities.weight +
      details.codeQuality.score * details.codeQuality.weight +
      details.maintenanceActivity.score * details.maintenanceActivity.weight +
      details.userFeedback.score * details.userFeedback.weight;

    const score = Math.round(totalScore);

    return {
      score,
      level: this.getSecurityLevel(score),
      details,
      scannedAt: new Date(),
    };
  }

  /**
   * 计算敏感信息检测得分
   * 权重: 30%
   */
  private async calculateSensitiveInfoScore(skillId: string): Promise<SecurityScoreDetails['sensitiveInfo']> {
    // 模拟实现：检测 SKILL.md 和源代码中的敏感信息
    const findings: string[] = [];

    // 这里应该调用安全扫描服务
    // const scanResult = await this.securityScanner.scanForSecrets(skillId);

    // 模拟扫描结果
    const hasSecrets = Math.random() > 0.8; // 20% 概率发现密钥
    const hasPasswords = Math.random() > 0.9; // 10% 概率发现密码
    const hasApiKeys = Math.random() > 0.85; // 15% 概率发现 API Key

    if (hasSecrets) findings.push('发现硬编码的密钥');
    if (hasPasswords) findings.push('发现硬编码的密码');
    if (hasApiKeys) findings.push('发现硬编码的 API Key');

    // 计算得分：每发现一个问题扣 20 分
    const deductions = findings.length * 20;
    const score = Math.max(0, 100 - deductions);

    return {
      score,
      weight: 0.3,
      findings,
    };
  }

  /**
   * 计算依赖漏洞得分
   * 权重: 25%
   */
  private async calculateDependencyScore(skillId: string): Promise<SecurityScoreDetails['dependencyVulnerabilities']> {
    // 模拟实现：检查依赖包的已知漏洞
    const findings: string[] = [];

    // 这里应该调用依赖扫描服务
    // const vulnScan = await this.dependencyScanner.scan(skillId);

    // 模拟扫描结果
    const criticalVulns = Math.floor(Math.random() * 2); // 0-1 个严重漏洞
    const highVulns = Math.floor(Math.random() * 3); // 0-2 个高危漏洞
    const mediumVulns = Math.floor(Math.random() * 5); // 0-4 个中危漏洞

    if (criticalVulns > 0) findings.push(`${criticalVulns} 个严重漏洞`);
    if (highVulns > 0) findings.push(`${highVulns} 个高危漏洞`);
    if (mediumVulns > 0) findings.push(`${mediumVulns} 个中危漏洞`);

    // 计算得分：严重扣 30，高危扣 20，中危扣 10
    const deductions = criticalVulns * 30 + highVulns * 20 + mediumVulns * 10;
    const score = Math.max(0, 100 - deductions);

    return {
      score,
      weight: 0.25,
      findings,
    };
  }

  /**
   * 计算代码质量得分
   * 权重: 20%
   */
  private async calculateCodeQualityScore(skillId: string): Promise<SecurityScoreDetails['codeQuality']> {
    // 模拟实现：分析代码质量
    const testCoverage = Math.floor(Math.random() * 40) + 60; // 60-100%
    const codeComplexity = Math.floor(Math.random() * 30) + 70; // 70-100
    const documentation = Math.floor(Math.random() * 40) + 60; // 60-100%

    // 综合得分
    const score = Math.round((testCoverage + codeComplexity + documentation) / 3);

    return {
      score,
      weight: 0.2,
      metrics: {
        testCoverage,
        codeComplexity,
        documentation,
      },
    };
  }

  /**
   * 计算维护活跃度得分
   * 权重: 15%
   */
  private async calculateMaintenanceScore(skillId: string): Promise<SecurityScoreDetails['maintenanceActivity']> {
    // 模拟实现：分析维护活跃度
    const lastCommitDays = Math.floor(Math.random() * 180); // 0-180 天
    const releaseFrequency = Math.floor(Math.random() * 12); // 0-12 次发布/年
    const issueResponse = Math.floor(Math.random() * 10); // 0-10 天响应时间

    // 计算得分
    const commitScore = Math.max(0, 100 - lastCommitDays / 2); // 越近越好
    const releaseScore = Math.min(100, releaseFrequency * 10); // 越频繁越好
    const responseScore = Math.max(0, 100 - issueResponse * 10); // 越快越好

    const score = Math.round((commitScore + releaseScore + responseScore) / 3);

    return {
      score,
      weight: 0.15,
      metrics: {
        lastCommitDays,
        releaseFrequency,
        issueResponse,
      },
    };
  }

  /**
   * 计算用户反馈得分
   * 权重: 10%
   */
  private async calculateUserFeedbackScore(skillId: string): Promise<SecurityScoreDetails['userFeedback']> {
    // 模拟实现：分析用户反馈
    const averageRating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0
    const totalDownloads = Math.floor(Math.random() * 10000);
    const positiveFeedback = Math.floor(Math.random() * 100); // 0-100%

    // 计算得分
    const ratingScore = (parseFloat(averageRating) / 5) * 100;
    const feedbackScore = positiveFeedback;

    const score = Math.round((ratingScore + feedbackScore) / 2);

    return {
      score,
      weight: 0.1,
      metrics: {
        averageRating: parseFloat(averageRating),
        totalDownloads,
        positiveFeedback,
      },
    };
  }

  /**
   * 获取安全等级
   */
  private getSecurityLevel(score: number): SecurityScoreResult['level'] {
    if (score < 20) return 'critical';
    if (score < 40) return 'high';
    if (score < 60) return 'medium';
    if (score < 80) return 'low';
    return 'safe';
  }
}

// 导出单例
export const securityScoreService = new SecurityScoreService();