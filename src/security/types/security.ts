/**
 * 安全扫描定义
 */

/**
 * 严重性级别
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * 发现类型
 */
export type FindingType = 'malware' | 'secret' | 'vulnerability' | 'behavior' | 'dependency' | 'license';

/**
 * 安全发现
 */
export interface SecurityFinding {
  /**
   * 发现ID
   */
  id: string;

  /**
   * 类型
   */
  type: FindingType;

  /**
   * 严重性
   */
  severity: Severity;

  /**
   * 标题
   */
  title: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 位置
   */
  location: string;

  /**
   * 代码片段
   */
  code?: string;

  /**
   * 修复建议
   */
  remediation: string;

  /**
   * 引用
   */
  references?: string[];
}

/**
 * 安全扫描报告
 */
export interface SecurityReport {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 版本
   */
  version: string;

  /**
   * 扫描时间
   */
  scannedAt: Date;

  /**
   * 扫描状态
   */
  status: 'passed' | 'failed' | 'warning';

  /**
   * 安全分数 (0-100)
   */
  score: number;

  /**
   * 发现列表
   */
  findings: SecurityFinding[];

  /**
   * 摘要
   */
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  /**
   * 是否包含依赖扫描
   */
  includeDependencies?: boolean;

  /**
   * 是否包含行为分析
   */
  includeBehaviorAnalysis?: boolean;

  /**
   * 是否包含供应链审计
   */
  includeSupplyChain?: boolean;

  /**
   * 严重性阈值
   */
  severityThreshold?: Severity;

  /**
   * 超时时间（秒）
   */
  timeout?: number;
}

/**
 * 扫描结果
 */
export interface ScanResult {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 扫描报告
   */
  report: SecurityReport;

  /**
   * 扫描耗时（毫秒）
   */
  duration: number;

  /**
   * 是否通过
   */
  passed: boolean;
}