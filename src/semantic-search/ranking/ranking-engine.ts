/**
 * 排名器
 * 对搜索结果进行排序和重新排序
 */
import { SearchResult, SkillData } from '../types/search';

/**
 * 排名选项
 */
export interface RankingOptions {
  /**
   * 排序方式
   */
  sortBy?: 'relevance' | 'stars' | 'downloads' | 'recent' | 'popularity';

  /**
   * 排序顺序
   */
  order?: 'asc' | 'desc';

  /**
   * 时间衰减因子（用于 recent 排序）
   */
  timeDecay?: number;

  /**
   * 个性化权重
   */
  personalizationWeight?: number;

  /**
   * 用户历史数据
   */
  userHistory?: {
    viewed: string[];
    installed: string[];
    favorited: string[];
  };
}

/**
 * 技能统计数据
 */
export interface SkillStats {
  id: string;
  stars: number;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
  category: string;
}

/**
 * 排名器
 */
export class RankingEngine {
  /**
   * 对搜索结果进行排名
   * @param results 搜索结果
   * @param stats 技能统计数据
   * @param options 排名选项
   */
  rank(
    results: SearchResult[],
    stats: SkillStats[],
    options: RankingOptions = {}
  ): SearchResult[] {
    const sortBy = options.sortBy || 'relevance';
    const order = options.order || 'desc';

    const statsMap = new Map(stats.map((s) => [s.id, s]));

    // 计算综合分数
    const scoredResults = results.map((result) => {
      const skillStats = statsMap.get(result.skillId);
      const score = this.calculateScore(result, skillStats, options);

      return {
        ...result,
        score,
      };
    });

    // 排序
    scoredResults.sort((a, b) => {
      const comparison = b.score - a.score;
      return order === 'desc' ? comparison : -comparison;
    });

    return scoredResults;
  }

  /**
   * 计算综合分数
   */
  private calculateScore(
    result: SearchResult,
    stats: SkillStats | undefined,
    options: RankingOptions
  ): number {
    let score = result.score;

    if (!stats) return score;

    switch (options.sortBy) {
      case 'stars':
        // 归一化 stars（假设最大值为 10000）
        score = stats.stars / 10000;
        break;

      case 'downloads':
        // 归一化 downloads（假设最大值为 1000000）
        score = stats.downloads / 1000000;
        break;

      case 'recent':
        // 时间衰减
        const daysSinceUpdate = (Date.now() - stats.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        const decay = Math.exp(-daysSinceUpdate / (options.timeDecay || 30));
        score = result.score * 0.5 + decay * 0.5;
        break;

      case 'popularity':
        // 综合 popularity = stars * 0.4 + downloads * 0.4 + recency * 0.2
        const starsScore = Math.log10(stats.stars + 1) / Math.log10(10001);
        const downloadsScore = Math.log10(stats.downloads + 1) / Math.log10(1000001);
        const recencyScore = Math.exp(
          -(Date.now() - stats.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        score = starsScore * 0.4 + downloadsScore * 0.4 + recencyScore * 0.2;
        break;

      case 'relevance':
      default:
        // 相关性 + 个性化
        if (options.userHistory) {
          const personalizationScore = this.calculatePersonalizationScore(
            result.skillId,
            options.userHistory
          );
          const weight = options.personalizationWeight || 0.3;
          score = result.score * (1 - weight) + personalizationScore * weight;
        }
        break;
    }

    return score;
  }

  /**
   * 计算个性化分数
   */
  private calculatePersonalizationScore(
    skillId: string,
    userHistory: {
      viewed: string[];
      installed: string[];
      favorited: string[];
    }
  ): number {
    let score = 0;

    // 安装的技能的相似类别/作者加分
    if (userHistory.installed.length > 0) {
      // TODO: 实现更复杂的相似度计算
      score += 0.2;
    }

    // 收藏的技能加分
    if (userHistory.favorited.includes(skillId)) {
      score += 0.5;
    }

    // 查看过的技能加分
    if (userHistory.viewed.includes(skillId)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * 多维度排序
   * @param results 搜索结果
   * @param stats 技能统计数据
   * @param dimensions 排序维度
   */
  multiDimensionRank(
    results: SearchResult[],
    stats: SkillStats[],
    dimensions: Array<{
      field: 'relevance' | 'stars' | 'downloads' | 'recent';
      weight: number;
    }>
  ): SearchResult[] {
    const statsMap = new Map(stats.map((s) => [s.id, s]));

    return results
      .map((result) => {
        const skillStats = statsMap.get(result.skillId);
        let totalScore = 0;

        for (const dimension of dimensions) {
          const score = this.calculateScore(result, skillStats, { sortBy: dimension.field });
          totalScore += score * dimension.weight;
        }

        return {
          ...result,
          score: totalScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 去重（基于技能ID）
   * @param results 搜索结果
   */
  deduplicate(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      if (seen.has(result.skillId)) return false;
      seen.add(result.skillId);
      return true;
    });
  }

  /**
   * 多样性优化（确保结果来自不同类别）
   * @param results 搜索结果
   * @param stats 技能统计数据
   * @param diversityScore 多样性权重
   */
  diversify(
    results: SearchResult[],
    stats: SkillStats[],
    diversityScore: number = 0.3
  ): SearchResult[] {
    const statsMap = new Map(stats.map((s) => [s.id, s]));
    const categoryCount = new Map<string, number>();

    return results.map((result) => {
      const skillStats = statsMap.get(result.skillId);
      const category = skillStats?.category || 'other';

      // 计算多样性惩罚
      const count = categoryCount.get(category) || 0;
      const penalty = Math.exp(-count * diversityScore);

      categoryCount.set(category, count + 1);

      return {
        ...result,
        score: result.score * penalty,
      };
    }).sort((a, b) => b.score - a.score);
  }
}