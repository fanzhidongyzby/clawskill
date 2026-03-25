/**
 * 技能源统一接口定义
 * 所有技能源适配器必须实现此接口
 */

export interface SourceSkill {
  id: string;
  name: string;
  namespace: string;
  description: string;
  author: string;
  version: string;
  license: string;
  keywords: string[];
  categories: string[];
  homepage: string | null;
  repository: string | null;
  stars: number;
  downloads: number;
  sourceType: SourceType;
  sourceUrl: string;
  lastUpdated: Date;
}

export type SourceType = 'github' | 'clawhub' | 'mcp' | 'npm' | 'pypi';

export interface SourceConfig {
  enabled: boolean;
  syncIntervalMs: number;
  maxConcurrency: number;
}

export interface SyncProgress {
  total: number;
  processed: number;
  added: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface SourceAdapter {
  readonly name: string;
  readonly type: SourceType;

  /** 初始化适配器 */
  initialize(): Promise<void>;

  /** 搜索技能 */
  search(query: string, limit?: number): Promise<SourceSkill[]>;

  /** 获取技能详情 */
  getSkill(id: string): Promise<SourceSkill | null>;

  /** 列出所有技能（分页） */
  list(page: number, pageSize: number): Promise<{ skills: SourceSkill[]; total: number }>;

  /** 增量同步 */
  sync(since?: Date): Promise<SyncProgress>;

  /** 健康检查 */
  healthCheck(): Promise<boolean>;
}
