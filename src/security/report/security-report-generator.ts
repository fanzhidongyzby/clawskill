/**
 * 安全报告生成器
 * 生成详细的安全扫描报告
 */
import { SecurityReport, SecurityFinding, Severity } from '../types/security';

/**
 * 报告格式
 */
export type ReportFormat = 'json' | 'html' | 'markdown' | 'sarif';

/**
 * 安全报告生成器
 */
export class SecurityReportGenerator {
  /**
   * 生成安全报告
   * @param skillId 技能ID
   * @param version 版本
   * @param findings 安全发现列表
   * @param options 扫描选项
   */
  generateReport(
    skillId: string,
    version: string,
    findings: SecurityFinding[],
    options: {
      severityThreshold?: Severity;
    } = {}
  ): SecurityReport {
    // 过滤发现
    const filteredFindings = this.filterFindings(findings, options.severityThreshold);

    // 计算摘要
    const summary = this.calculateSummary(filteredFindings);

    // 计算分数
    const score = this.calculateScore(summary);

    // 确定状态
    const status = this.determineStatus(filteredFindings, options.severityThreshold);

    return {
      skillId,
      version,
      scannedAt: new Date(),
      status,
      score,
      findings: filteredFindings,
      summary,
    };
  }

  /**
   * 过滤发现
   */
  private filterFindings(findings: SecurityFinding[], threshold?: Severity): SecurityFinding[] {
    if (!threshold) return findings;

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const thresholdIndex = severityOrder.indexOf(threshold);

    return findings.filter((finding) => {
      const findingIndex = severityOrder.indexOf(finding.severity);
      return findingIndex <= thresholdIndex;
    });
  }

  /**
   * 计算摘要
   */
  private calculateSummary(findings: SecurityFinding[]): SecurityReport['summary'] {
    const summary: SecurityReport['summary'] = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const finding of findings) {
      summary[finding.severity]++;
    }

    return summary;
  }

  /**
   * 计算安全分数
   */
  private calculateScore(summary: SecurityReport['summary']): number {
    let score = 100;

    // 严重性扣分
    score -= summary.critical * 25;
    score -= summary.high * 15;
    score -= summary.medium * 5;
    score -= summary.low * 1;

    return Math.max(0, score);
  }

  /**
   * 确定状态
   */
  private determineStatus(findings: SecurityFinding[], threshold?: Severity): 'passed' | 'failed' | 'warning' {
    if (findings.length === 0) return 'passed';

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const thresholdIndex = threshold ? severityOrder.indexOf(threshold) : 1; // 默认 high

    for (const finding of findings) {
      const findingIndex = severityOrder.indexOf(finding.severity);
      if (findingIndex <= thresholdIndex) {
        return 'failed';
      }
    }

    return 'warning';
  }

  /**
   * 导出为 JSON
   */
  exportJson(report: SecurityReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 导出为 Markdown
   */
  exportMarkdown(report: SecurityReport): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# Security Report: ${report.skillId}@${report.version}`);
    lines.push('');
    lines.push(`**Scanned at:** ${report.scannedAt.toISOString()}`);
    lines.push(`**Status:** ${this.getStatusBadge(report.status)}`);
    lines.push(`**Score:** ${this.getScoreBadge(report.score)}`);
    lines.push('');

    // 摘要
    lines.push('## Summary');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('|----------|-------|');
    lines.push(`| Critical | ${report.summary.critical} |`);
    lines.push(`| High | ${report.summary.high} |`);
    lines.push(`| Medium | ${report.summary.medium} |`);
    lines.push(`| Low | ${report.summary.low} |`);
    lines.push(`| Info | ${report.summary.info} |`);
    lines.push('');

    // 发现
    if (report.findings.length > 0) {
      lines.push('## Findings');
      lines.push('');

      const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
      const sortedFindings = [...report.findings].sort((a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      );

      for (const finding of sortedFindings) {
        lines.push(`### ${this.getSeverityEmoji(finding.severity)} ${finding.title}`);
        lines.push('');
        lines.push(`**Type:** ${finding.type}`);
        lines.push(`**Severity:** ${finding.severity}`);
        lines.push(`**Location:** \`${finding.location}\``);
        lines.push('');
        lines.push(finding.description);
        lines.push('');

        if (finding.code) {
          lines.push('```');
          lines.push(finding.code);
          lines.push('```');
          lines.push('');
        }

        lines.push('**Remediation:**');
        lines.push(finding.remediation);
        lines.push('');

        if (finding.references && finding.references.length > 0) {
          lines.push('**References:**');
          for (const ref of finding.references) {
            lines.push(`- ${ref}`);
          }
          lines.push('');
        }
      }
    } else {
      lines.push('## ✅ No findings');
      lines.push('');
      lines.push('The scan completed successfully with no security issues found.');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 导出为 HTML
   */
  exportHtml(report: SecurityReport): string {
    const summary = report.summary;
    const findingsHtml = report.findings
      .map((finding) => `
        <div class="finding ${finding.severity}">
          <h3>${this.getSeverityEmoji(finding.severity)} ${finding.title}</h3>
          <div class="meta">
            <span class="type">${finding.type}</span>
            <span class="severity">${finding.severity}</span>
            <span class="location">${finding.location}</span>
          </div>
          <p class="description">${finding.description}</p>
          ${finding.code ? `<pre><code>${this.escapeHtml(finding.code)}</code></pre>` : ''}
          <div class="remediation">
            <strong>Remediation:</strong>
            <p>${finding.remediation}</p>
          </div>
        </div>
      `)
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Report: ${report.skillId}@${report.version}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .status.passed { background: #10b981; color: white; }
    .status.warning { background: #f59e0b; color: white; }
    .status.failed { background: #ef4444; color: white; }
    .score { font-size: 24px; font-weight: bold; }
    .summary { margin: 20px 0; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary th, .summary td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .finding { margin: 20px 0; padding: 16px; border-radius: 8px; border-left: 4px solid; }
    .finding.critical { border-left-color: #ef4444; background: #fef2f2; }
    .finding.high { border-left-color: #f97316; background: #fff7ed; }
    .finding.medium { border-left-color: #eab308; background: #fefce8; }
    .finding.low { border-left-color: #3b82f6; background: #eff6ff; }
    .finding.info { border-left-color: #6b7280; background: #f9fafb; }
    .finding h3 { margin-top: 0; }
    .finding .meta { display: flex; gap: 16px; margin: 8px 0; }
    .finding .meta span { padding: 2px 8px; background: rgba(0,0,0,0.1); border-radius: 4px; }
    .finding pre { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 4px; overflow-x: auto; }
    .remediation { margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Security Report: ${report.skillId}@${report.version}</h1>
    <p>Scanned at: ${report.scannedAt.toISOString()}</p>
    <p>Status: <span class="status ${report.status}">${report.status.toUpperCase()}</span></p>
    <p>Score: <span class="score">${report.score}/100</span></p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <table>
      <tr><th>Severity</th><th>Count</th></tr>
      <tr><td>Critical</td><td>${summary.critical}</td></tr>
      <tr><td>High</td><td>${summary.high}</td></tr>
      <tr><td>Medium</td><td>${summary.medium}</td></tr>
      <tr><td>Low</td><td>${summary.low}</td></tr>
      <tr><td>Info</td><td>${summary.info}</td></tr>
    </table>
  </div>

  <div class="findings">
    ${findingsHtml}
  </div>
</body>
</html>
    `;
  }

  /**
   * 获取状态徽章
   */
  private getStatusBadge(status: string): string {
    const badges: Record<string, string> = {
      passed: '✅ PASSED',
      warning: '⚠️ WARNING',
      failed: '❌ FAILED',
    };
    return badges[status] || status.toUpperCase();
  }

  /**
   * 获取分数徽章
   */
  private getScoreBadge(score: number): string {
    if (score >= 80) return '🟢 ' + score;
    if (score >= 60) return '🟡 ' + score;
    return '🔴 ' + score;
  }

  /**
   * 获取严重性 Emoji
   */
  private getSeverityEmoji(severity: Severity): string {
    const emojis: Record<Severity, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };
    return emojis[severity];
  }

  /**
   * 转义 HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}