/**
 * 安全扫描器
 * 统一的安全扫描入口
 */
import { SecretScanner } from '../scanner/secret-scanner';
import { DependencyScanner } from '../scanner/dependency-scanner';
import { SecurityReportGenerator } from '../report/security-report-generator';
import { SecurityReport, ScanOptions, ScanResult } from '../types/security';

/**
 * 安全扫描器
 */
export class SecurityScanner {
  private secretScanner: SecretScanner;
  private dependencyScanner: DependencyScanner;
  private reportGenerator: SecurityReportGenerator;

  constructor(apiEndpoint?: string) {
    this.secretScanner = new SecretScanner();
    this.dependencyScanner = new DependencyScanner(apiEndpoint);
    this.reportGenerator = new SecurityReportGenerator();
  }

  /**
   * 扫描技能
   * @param skillId 技能ID
   * @param version 版本
   * @param files 文件列表
   * @param dependencies 依赖列表
   * @param options 扫描选项
   */
  async scan(
    skillId: string,
    version: string,
    files: Array<{ path: string; content: string }>,
    dependencies: Array<{ name: string; version: string }>,
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const allFindings: any[] = [];

    // 1. 敏感信息扫描
    try {
      const secretFindings = await this.secretScanner.scanFiles(files);
      allFindings.push(...secretFindings);
    } catch (error) {
      console.error('Secret scanning failed:', error);
    }

    // 2. 依赖漏洞扫描
    if (options.includeDependencies !== false) {
      try {
        const depFindings = await this.dependencyScanner.scan(dependencies);
        allFindings.push(...depFindings);
      } catch (error) {
        console.error('Dependency scanning failed:', error);
      }
    }

    // 3. 行为分析（待实现）
    if (options.includeBehaviorAnalysis) {
      // TODO: 实现行为分析
    }

    // 4. 供应链审计（待实现）
    if (options.includeSupplyChain) {
      // TODO: 实现供应链审计
    }

    // 5. 生成报告
    const report = this.reportGenerator.generateReport(
      skillId,
      version,
      allFindings,
      {
        severityThreshold: options.severityThreshold,
      }
    );

    const duration = Date.now() - startTime;

    return {
      skillId,
      report,
      duration,
      passed: report.status !== 'failed',
    };
  }

  /**
   * 扫描 SKILL.md 文件
   * @param skillId 技能ID
   * @param version 版本
   * @param skillMdContent SKILL.md 内容
   * @param dependencies 依赖列表
   * @param options 扫描选项
   */
  async scanSkillMD(
    skillId: string,
    version: string,
    skillMdContent: string,
    dependencies: Array<{ name: string; version: string }> = [],
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    return this.scan(
      skillId,
      version,
      [{ path: 'SKILL.md', content: skillMdContent }],
      dependencies,
      options
    );
  }

  /**
   * 批量扫描
   * @param skills 技能列表
   * @param options 扫描选项
   */
  async scanBatch(
    skills: Array<{
      skillId: string;
      version: string;
      files: Array<{ path: string; content: string }>;
      dependencies: Array<{ name: string; version: string }>;
    }>,
    options: ScanOptions = {}
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    for (const skill of skills) {
      const result = await this.scan(
        skill.skillId,
        skill.version,
        skill.files,
        skill.dependencies,
        options
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 获取扫描器
   */
  getSecretScanner(): SecretScanner {
    return this.secretScanner;
  }

  getDependencyScanner(): DependencyScanner {
    return this.dependencyScanner;
  }

  getReportGenerator(): SecurityReportGenerator {
    return this.reportGenerator;
  }
}