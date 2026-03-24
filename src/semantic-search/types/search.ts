/**
 * 搜索结果
 */
export interface SearchResult {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 分数（相似度）
   */
  score: number;

  /**
   * 技能数据
   */
  data: SkillData;
}

/**
 * 技能数据
 */
export interface SkillData {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  categories: string[];
}

/**
 * 向量文档
 */
export interface VectorDocument {
  /**
   * 文档ID
   */
  id: string;

  /**
   * 向量
   */
  vector: number[];

  /**
   * 元数据
   */
  metadata: Record<string, any>;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /**
   * 结果数量
   */
  topK?: number;

  /**
   * 相似度阈值
   */
  scoreThreshold?: number;

  /**
   * 是否混合搜索（向量 + 全文）
   */
  hybrid?: boolean;

  /**
   * 混合搜索权重
   */
  vectorWeight?: number;
  textWeight?: number;
}

/**
 * Embedding 配置
 */
export interface EmbeddingConfig {
  /**
   * API Key
   */
  apiKey?: string;

  /**
   * 模型名称
   */
  model?: string;

  /**
   * API 端点
   */
  endpoint?: string;

  /**
   * 向量维度
   */
  dimensions?: number;
}