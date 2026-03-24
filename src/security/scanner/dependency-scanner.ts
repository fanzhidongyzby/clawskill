/**
 * 依赖漏洞扫描器
 * 检测技能依赖中的已知漏洞
 */
import { SecurityFinding, Severity } from '../types/security';
import axios from 'axios';

/**
 * 依赖包
 */
interface Dependency {
  /**
   * 包名
   */
  name: string;

  /**
   * 版本
   */
  version: string;
}

/**
 * 漏洞信息
 */
interface Vulnerability {
  /**
   * CVE ID
   */
  id: string;

  /**
   * 严重性
   */
  severity: Severity;

  /**
   * CVSS 分数
   */
  cvssScore?: number;

  /**
   * 描述
   */
  description: string;

  /**
   * 受影响版本
   */
  affectedVersions: string[];

  /**
   * 修复版本
   */
  patchedVersions: string[];

  /**
   * 引用
   */
  references?: string[];
}

/**
 * 依赖漏洞扫描器
 */
export class DependencyScanner {
  private vulnerabilityDatabase: Map<string, Vulnerability[]>;
  private apiEndpoint?: string;

  constructor(apiEndpoint?: string) {
    this.vulnerabilityDatabase = new Map();
    this.apiEndpoint = apiEndpoint;

    // 初始化一些示例漏洞数据
    this.initializeDatabase();
  }

  /**
   * 扫描依赖
   * @param dependencies 依赖列表
   */
  async scan(dependencies: Dependency[]): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    for (const dep of dependencies) {
      // 1. 检查本地数据库
      const localVulns = this.vulnerabilityDatabase.get(dep.name) || [];
      for (const vuln of localVulns) {
        if (this.isAffected(dep.version, vuln.affectedVersions)) {
          findings.push({
            id: `vuln-${vuln.id}`,
            type: 'vulnerability',
            severity: vuln.severity,
            title: `${vuln.id} in ${dep.name}`,
            description: vuln.description,
            location: `dependency:${dep.name}@${dep.version}`,
            remediation: this.getRemediation(dep.name, dep.version, vuln),
            references: vuln.references,
          });
        }
      }

      // 2. 如果配置了 API，查询远程数据库
      if (this.apiEndpoint) {
        try {
          const remoteVulns = await this.queryRemoteDatabase(dep.name, dep.version);
          findings.push(...remoteVulns);
        } catch (error) {
          console.warn(`Failed to query remote database for ${dep.name}:`, error);
        }
      }
    }

    return findings;
  }

  /**
   * 查询远程漏洞数据库
   * @param packageName 包名
   * @param version 版本
   */
  private async queryRemoteDatabase(packageName: string, version: string): Promise<SecurityFinding[]> {
    // TODO: 实现实际的 API 调用
    // const response = await axios.get(`${this.apiEndpoint}/v1/vulnerabilities`, {
    //   params: { package: packageName, version },
    // });

    // 模拟响应
    return [];
  }

  /**
   * 检查版本是否受影响
   * @param version 版本
   * @param affectedVersions 受影响版本列表
   */
  private isAffected(version: string, affectedVersions: string[]): boolean {
    // 简化的版本检查逻辑
    // 实际实现应该使用 semver 库进行精确的版本范围匹配

    for (const affectedRange of affectedVersions) {
      if (affectedRange === '*') return true;
      if (affectedRange === version) return true;

      // 检查版本范围（如 >=1.0.0 <2.0.0）
      if (affectedRange.includes('>')) {
        // TODO: 实现完整的 semver 范围解析
        return true;
      }
    }

    return false;
  }

  /**
   * 获取修复建议
   * @param packageName 包名
   * @param currentVersion 当前版本
   * @param vulnerability 漏洞信息
   */
  private getRemediation(
    packageName: string,
    currentVersion: string,
    vulnerability: Vulnerability
  ): string {
    if (vulnerability.patchedVersions.length > 0) {
      const patches = vulnerability.patchedVersions.join(', ');
      return `Update ${packageName} from ${currentVersion} to one of the patched versions: ${patches}`;
    }

    return `Update ${packageName} to the latest version to resolve ${vulnerability.id}`;
  }

  /**
   * 初始化漏洞数据库
   */
  private initializeDatabase(): void {
    // 添加一些示例漏洞
    this.addVulnerability({
      id: 'CVE-2021-1234',
      severity: 'critical',
      cvssScore: 9.8,
      description: 'Critical vulnerability allowing remote code execution',
      affectedVersions: ['>=1.0.0 <2.0.0'],
      patchedVersions: ['2.0.0', '2.1.0'],
    }, 'example-package');

    this.addVulnerability({
      id: 'CVE-2021-5678',
      severity: 'high',
      cvssScore: 8.5,
      description: 'High severity vulnerability leading to information disclosure',
      affectedVersions: ['1.0.0', '1.0.1', '1.0.2'],
      patchedVersions: ['1.0.3'],
    }, 'another-package');
  }

  /**
   * 添加漏洞到数据库
   * @param vulnerability 漏洞信息
   * @param packageName 包名
   */
  addVulnerability(vulnerability: Vulnerability, packageName: string): void {
    const vulns = this.vulnerabilityDatabase.get(packageName) || [];
    vulns.push(vulnerability);
    this.vulnerabilityDatabase.set(packageName, vulns);
  }

  /**
   * 从数据库移除漏洞
   * @param packageName 包名
   * @param vulnId 漏洞ID
   */
  removeVulnerability(packageName: string, vulnId: string): boolean {
    const vulns = this.vulnerabilityDatabase.get(packageName);
    if (!vulns) return false;

    const index = vulns.findIndex((v) => v.id === vulnId);
    if (index !== -1) {
      vulns.splice(index, 1);
      this.vulnerabilityDatabase.set(packageName, vulns);
      return true;
    }

    return false;
  }

  /**
   * 获取数据库统计
   */
  getStats(): {
    totalPackages: number;
    totalVulnerabilities: number;
    bySeverity: Record<Severity, number>;
  } {
    let totalVulnerabilities = 0;
    const bySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const vulns of this.vulnerabilityDatabase.values()) {
      totalVulnerabilities += vulns.length;
      for (const vuln of vulns) {
        bySeverity[vuln.severity]++;
      }
    }

    return {
      totalPackages: this.vulnerabilityDatabase.size,
      totalVulnerabilities,
      bySeverity,
    };
  }
}