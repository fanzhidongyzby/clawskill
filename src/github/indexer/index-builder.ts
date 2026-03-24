/**
 * 索引构建器
 * 将技能元数据构建为可搜索的索引
 */
import { SkillDetail, SkillMD, VersionInfo } from '../types/source';

/**
 * 索引项
 */
export interface IndexItem {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 名称
   */
  name: string;

  /**
   * 命名空间
   */
  namespace: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 关键词
   */
  keywords: string[];

  /**
   * 分类
   */
  categories: string[];

  /**
   * 作者
   */
  author: string;

  /**
   * 许可证
   */
  license?: string;

  /**
   * 兼容平台
   */
  compatibility: string[];

  /**
   * Stars
   */
  stars: number;

  /**
   * 下载次数
   */
  downloads: number;

  /**
   * 最新版本
   */
  latestVersion?: string;

  /**
   * 版本列表
   */
  versions: VersionInfo[];

  /**
   * 仓库地址
   */
  repository: string;

  /**
   * 主页地址
   */
  homepage?: string;

  /**
   * SKILL.md URL
   */
  skillMdUrl: string;

  /**
   * SKILL.md 哈希
   */
  skillMdHash: string;

  /**
   * 索引时间
   */
  indexedAt: Date;

  /**
   * 最后更新时间
   */
  updatedAt: Date;
}

/**
 * 索引构建器
 */
export class IndexBuilder {
  /**
   * 构建技能索引
   * @param skill 技能详情
   * @param skillMD SKILL.md 内容
   * @param versions 版本列表
   */
  buildIndex(skill: SkillDetail, skillMD: SkillMD, versions: VersionInfo[]): IndexItem {
    return {
      skillId: skill.id,
      name: skill.name,
      namespace: skill.namespace,
      description: skill.description,
      keywords: [...skill.keywords, ...(skillMD.metadata.keywords || [])],
      categories: [...skill.categories, ...(skillMD.metadata.categories || [])],
      author: skill.author,
      license: skill.license,
      compatibility: skillMD.metadata.compatibility || ['openclaw'],
      stars: skill.stars,
      downloads: skill.downloads,
      latestVersion: skill.latestVersion,
      versions: versions,
      repository: skill.repository,
      homepage: skill.homepage,
      skillMdUrl: skillMD.downloadUrl,
      skillMdHash: skillMD.hash || '',
      indexedAt: new Date(),
      updatedAt: skill.updatedAt,
    };
  }

  /**
   * 构建批量索引
   * @param items 技能、SKILL.md、版本的三元组数组
   */
  buildBatchIndex(items: Array<{
    skill: SkillDetail;
    skillMD: SkillMD;
    versions: VersionInfo[];
  }>): IndexItem[] {
    return items.map((item) => this.buildIndex(item.skill, item.skillMD, item.versions));
  }

  /**
   * 合并索引（增量更新）
   * @param existing 现有索引
   * @param updates 更新项
   */
  mergeIndex(existing: IndexItem[], updates: IndexItem[]): IndexItem[] {
    const existingMap = new Map(existing.map((item) => [item.skillId, item]));

    for (const update of updates) {
      existingMap.set(update.skillId, update);
    }

    return Array.from(existingMap.values());
  }

  /**
   * 过滤索引
   * @param items 索引项
   * @param filters 过滤条件
   */
  filterIndex(
    items: IndexItem[],
    filters: {
      keyword?: string;
      category?: string;
      compatibility?: string;
      author?: string;
      license?: string;
      minStars?: number;
    }
  ): IndexItem[] {
    return items.filter((item) => {
      // 关键词过滤
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesKeyword =
          item.name.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword) ||
          item.keywords.some((k) => k.toLowerCase().includes(keyword));
        if (!matchesKeyword) return false;
      }

      // 分类过滤
      if (filters.category && !item.categories.includes(filters.category)) {
        return false;
      }

      // 兼容性过滤
      if (filters.compatibility && !item.compatibility.includes(filters.compatibility)) {
        return false;
      }

      // 作者过滤
      if (filters.author && item.author !== filters.author) {
        return false;
      }

      // 许可证过滤
      if (filters.license && item.license !== filters.license) {
        return false;
      }

      // 最小 Stars 过滤
      if (filters.minStars && item.stars < filters.minStars) {
        return false;
      }

      return true;
    });
  }

  /**
   * 排序索引
   * @param items 索引项
   * @param sortBy 排序字段
   * @param order 排序顺序
   */
  sortIndex(
    items: IndexItem[],
    sortBy: 'stars' | 'downloads' | 'updated' | 'name',
    order: 'asc' | 'desc' = 'desc'
  ): IndexItem[] {
    return [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'stars':
          comparison = a.stars - b.stars;
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 分页索引
   * @param items 索引项
   * @param page 页码（从1开始）
   * @param size 每页数量
   */
  paginateIndex(items: IndexItem[], page: number = 1, size: number = 20): {
    items: IndexItem[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  } {
    const total = items.length;
    const totalPages = Math.ceil(total / size);
    const start = (page - 1) * size;
    const end = start + size;

    return {
      items: items.slice(start, end),
      total,
      page,
      size,
      totalPages,
    };
  }

  /**
   * 序列化索引为 JSON
   */
  serializeIndex(items: IndexItem[]): string {
    return JSON.stringify(items, null, 2);
  }

  /**
   * 从 JSON 反序列化索引
   */
  deserializeIndex(json: string): IndexItem[] {
    return JSON.parse(json) as IndexItem[];
  }

  /**
   * 生成搜索向量文本
   * 用于向量搜索
   */
  generateVectorText(item: IndexItem): string {
    const parts = [
      item.name,
      item.description,
      ...item.keywords,
      ...item.categories,
      item.author,
    ];

    return parts.join(' ');
  }

  /**
   * 统计索引信息
   */
  getStats(items: IndexItem[]): {
    total: number;
    byCategory: Record<string, number>;
    byCompatibility: Record<string, number>;
    byLanguage: Record<string, number>;
    totalStars: number;
    totalDownloads: number;
  } {
    const byCategory: Record<string, number> = {};
    const byCompatibility: Record<string, number> = {};
    const totalStars = items.reduce((sum, item) => sum + item.stars, 0);
    const totalDownloads = items.reduce((sum, item) => sum + item.downloads, 0);

    for (const item of items) {
      for (const category of item.categories) {
        byCategory[category] = (byCategory[category] || 0) + 1;
      }
      for (const compat of item.compatibility) {
        byCompatibility[compat] = (byCompatibility[compat] || 0) + 1;
      }
    }

    return {
      total: items.length,
      byCategory,
      byCompatibility,
      byLanguage: {}, // TODO: 从仓库信息获取语言
      totalStars,
      totalDownloads,
    };
  }
}