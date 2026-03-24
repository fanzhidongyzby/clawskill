/**
 * 敏感信息扫描器
 * 检测代码中的密钥、密码等敏感信息
 */
import { SecurityFinding, Severity } from '../types/security';

/**
 * 敏感信息模式
 */
interface SecretPattern {
  /**
   * 模式名称
   */
  name: string;

  /**
   * 正则表达式
   */
  regex: RegExp;

  /**
   * 严重性
   */
  severity: Severity;

  /**
   * 描述
   */
  description: string;
}

/**
 * 敏感信息扫描器
 */
export class SecretScanner {
  private patterns: SecretPattern[];

  constructor() {
    this.patterns = [
      {
        name: 'AWS Access Key',
        regex: /(?:AWS|aws)?[_\s-]?(?:ACCESS|access)?[_\s-]?(?:KEY|key)[_\s-]?[:=][_\s]*['"]?([A-Za-z0-9]{20})['"]?/i,
        severity: 'critical',
        description: 'AWS Access Key detected',
      },
      {
        name: 'AWS Secret Key',
        regex: /(?:AWS|aws)?[_\s-]?(?:SECRET|secret)?[_\s-]?(?:KEY|key)[_\s-]?[:=][_\s]*['"]?([A-Za-z0-9\/+]{40})['"]?/i,
        severity: 'critical',
        description: 'AWS Secret Key detected',
      },
      {
        name: 'GitHub Token',
        regex: /(?:GITHUB|github)[_\s-]?(?:TOKEN|token)[_\s-]?[:=][_\s]*['"]?(ghp_[a-zA-Z0-9]{36})['"]?/i,
        severity: 'critical',
        description: 'GitHub Personal Access Token detected',
      },
      {
        name: 'Slack Token',
        regex: /(?:SLACK|slack)[_\s-]?(?:TOKEN|token)[_\s-]?[:=][_\s]*['"]?(xox[baprs]-[a-zA-Z0-9-]+)['"]?/i,
        severity: 'high',
        description: 'Slack API Token detected',
      },
      {
        name: 'Private Key',
        regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
        severity: 'critical',
        description: 'Private key detected',
      },
      {
        name: 'API Key Generic',
        regex: /(?:api[_\s-]?key|apikey|api[_\s-]?secret)[_\s-]?[:=][_\s]*['"]?([a-zA-Z0-9_\-]{16,})['"]?/i,
        severity: 'medium',
        description: 'Possible API key detected',
      },
      {
        name: 'Database URL',
        regex: /(?:mysql|postgresql|mongodb|redis):\/\/[^\s'"`]+:[^\s'"`]+@[^\s'"`]+/i,
        severity: 'high',
        description: 'Database connection string with credentials detected',
      },
      {
        name: 'Email Address',
        regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        severity: 'low',
        description: 'Email address detected',
      },
      {
        name: 'IP Address',
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
        severity: 'low',
        description: 'IP address detected',
      },
    ];
  }

  /**
   * 扫描文本内容
   * @param content 文本内容
   * @param filePath 文件路径
   */
  scan(content: string, filePath: string = 'unknown'): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      const matches = content.matchAll(pattern.regex);

      for (const match of matches) {
        // 找到匹配的行号
        const matchIndex = match.index || 0;
        const lineNumber = this.findLineNumber(content, matchIndex);

        // 获取代码片段
        const codeSnippet = this.getCodeSnippet(lines, lineNumber, 2);

        findings.push({
          id: this.generateId(pattern.name, matchIndex),
          type: 'secret',
          severity: pattern.severity,
          title: pattern.name,
          description: pattern.description,
          location: `${filePath}:${lineNumber + 1}`,
          code: codeSnippet,
          remediation: this.getRemediation(pattern.name),
        });
      }
    }

    return findings;
  }

  /**
   * 扫描多个文件
   * @param files 文件列表
   */
  async scanFiles(files: Array<{ path: string; content: string }>): Promise<SecurityFinding[]> {
    const allFindings: SecurityFinding[] = [];

    for (const file of files) {
      const findings = this.scan(file.content, file.path);
      allFindings.push(...findings);
    }

    return allFindings;
  }

  /**
   * 添加自定义模式
   * @param pattern 自定义模式
   */
  addPattern(pattern: SecretPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * 移除模式
   * @param name 模式名称
   */
  removePattern(name: string): boolean {
    const index = this.patterns.findIndex((p) => p.name === name);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 查找行号
   */
  private findLineNumber(content: string, index: number): number {
    const before = content.substring(0, index);
    return before.split('\n').length - 1;
  }

  /**
   * 获取代码片段
   */
  private getCodeSnippet(lines: string[], lineNumber: number, context: number): string {
    const start = Math.max(0, lineNumber - context);
    const end = Math.min(lines.length, lineNumber + context + 1);

    return lines
      .slice(start, end)
      .map((line, idx) => {
        const prefix = start + idx === lineNumber ? '> ' : '  ';
        return prefix + line;
      })
      .join('\n');
  }

  /**
   * 生成发现ID
   */
  private generateId(name: string, index: number): string {
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  }

  /**
   * 获取修复建议
   */
  private getRemediation(name: string): string {
    const remediations: Record<string, string> = {
      'AWS Access Key': 'Remove the AWS Access Key and use environment variables or a secret management service.',
      'AWS Secret Key': 'Remove the AWS Secret Key and use environment variables or a secret management service.',
      'GitHub Token': 'Remove the GitHub Token and use environment variables or a secret management service.',
      'Slack Token': 'Remove the Slack Token and use environment variables or a secret management service.',
      'Private Key': 'Remove the private key from the code. Private keys should never be committed to version control.',
      'API Key Generic': 'Review the detected API key. If it is a real key, remove it and use environment variables.',
      'Database URL': 'Remove the database credentials from the code and use environment variables.',
      'Email Address': 'Review if the email address should be exposed in the code.',
      'IP Address': 'Review if the IP address should be exposed in the code.',
    };

    return remediations[name] || 'Review and remove or replace the sensitive information.';
  }
}