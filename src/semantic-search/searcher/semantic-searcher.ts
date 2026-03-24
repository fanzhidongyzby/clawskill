/**
 * 语义搜索器
 * 基于向量相似度的智能搜索
 */
import { SearchResult, SearchOptions, SkillData } from '../types/search';
import { VectorIndexer } from '../indexer/vector-indexer';
import { EmbeddingClient } from '../embedder/embedding-client';

/**
 * 语义搜索器
 */
export class SemanticSearcher {
  private vectorIndexer: VectorIndexer;
  private embeddingClient: EmbeddingClient;

  constructor() {
    this.vectorIndexer = new VectorIndexer();
    this.embeddingClient = new EmbeddingClient();
  }

  /**
   * 搜索技能
   * @param query 查询文本
   * @param skills 技能列表
   * @param options 搜索选项
   */
  async search(
    query: string,
    skills: SkillData[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const topK = options.topK || 10;
    const scoreThreshold = options.scoreThreshold || 0;

    // 构建索引（如果尚未构建）
    if (this.vectorIndexer.getStats().totalDocuments === 0) {
      await this.vectorIndexer.buildSkillIndex(skills);
    }

    // 向量搜索
    const vectorResults = await this.vectorIndexer.search(query, topK * 2); // 获取更多结果用于过滤

    // 转换为搜索结果
    const results: SearchResult[] = vectorResults
      .map((result) => ({
        skillId: result.document.id,
        score: result.score,
        data: result.document.metadata as SkillData,
      }))
      .filter((result) => result.score >= scoreThreshold)
      .slice(0, topK);

    return results;
  }

  /**
   * 混合搜索（向量 + 文本）
   * @param query 查询文本
   * @param skills 技能列表
   * @param options 搜索选项
   */
  async hybridSearch(
    query: string,
    skills: SkillData[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!options.hybrid) {
      return this.search(query, skills, options);
    }

    const vectorWeight = options.vectorWeight || 0.7;
    const textWeight = options.textWeight || 0.3;

    // 向量搜索
    const vectorResults = await this.search(query, skills, { ...options, topK: 50 });
    const vectorScoreMap = new Map(
      vectorResults.map((r) => [r.skillId, r.score])
    );

    // 文本搜索（简单的关键词匹配）
    const textResults = this.textSearch(query, skills);
    const textScoreMap = new Map(
      textResults.map((r) => [r.skillId, r.score])
    );

    // 合并结果
    const combinedResults = new Map<string, SearchResult>();

    for (const skill of skills) {
      const vectorScore = vectorScoreMap.get(skill.id) || 0;
      const textScore = textScoreMap.get(skill.id) || 0;

      const combinedScore = vectorScore * vectorWeight + textScore * textWeight;

      if (combinedScore > 0) {
        combinedResults.set(skill.id, {
          skillId: skill.id,
          score: combinedScore,
          data: skill,
        });
      }
    }

    // 排序并返回
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK || 10);
  }

  /**
   * 文本搜索（简单的关键词匹配）
   * @param query 查询文本
   * @param skills 技能列表
   */
  private textSearch(query: string, skills: SkillData[]): Array<{
    skillId: string;
    score: number;
  }> {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    const results: Array<{
      skillId: string;
      score: number;
    }> = [];

    for (const skill of skills) {
      let score = 0;
      const skillText = `${skill.name} ${skill.description} ${skill.keywords.join(' ')}`.toLowerCase();

      // 完全匹配
      if (skillText.includes(queryLower)) {
        score += 1.0;
      }

      // 部分匹配
      for (const term of queryTerms) {
        if (skillText.includes(term)) {
          score += 0.5;
        }
      }

      if (score > 0) {
        results.push({ skillId: skill.id, score });
      }
    }

    // 归一化分数
    const maxScore = Math.max(...results.map((r) => r.score), 1);
    return results.map((r) => ({
      skillId: r.skillId,
      score: r.score / maxScore,
    }));
  }

  /**
   * 相似技能推荐
   * @param skillId 技能ID
   * @param skills 技能列表
   * @param topK 返回数量
   */
  async findSimilar(
    skillId: string,
    skills: SkillData[],
    topK: number = 5
  ): Promise<SearchResult[]> {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    // 使用技能描述作为查询
    return this.search(skill.description, skills, { topK: topK + 1 })
      .then((results) => results.filter((r) => r.skillId !== skillId).slice(0, topK));
  }

  /**
   * 聚类技能
   * @param skills 技能列表
   * @param clusterCount 聚类数量
   */
  async clusterSkills(skills: SkillData[], clusterCount: number = 5): Promise<Map<number, SkillData[]>> {
    // TODO: 实现 K-Means 聚类
    // 这里返回一个简单的分类作为示例
    const clusters = new Map<number, SkillData[]>();

    for (let i = 0; i < clusterCount; i++) {
      clusters.set(i, []);
    }

    // 简单的基于类别的聚类
    for (const skill of skills) {
      const categoryIndex = Math.floor(Math.random() * clusterCount);
      clusters.get(categoryIndex)!.push(skill);
    }

    return clusters;
  }

  /**
   * 获取搜索统计
   */
  getStats(): {
    totalDocuments: number;
    indexSize: number;
  } {
    return this.vectorIndexer.getStats();
  }
}