/**
 * 过滤器
 * 对搜索结果进行多维度过滤
 */
import { SearchResult, SkillData } from '../types/search';

/**
 * 过滤选项
 */
export interface FilterOptions {
  /**
   * 分类过滤
   */
  categories?: string[];

  /**
   * 关键词过滤
   */
  keywords?: string[];

  /**
   * 兼容平台过滤
   */
  compatibility?: string[];

  /**
   * 作者过滤
   */
  authors?: string[];

  /**
   * 许可证过滤
   */
  licenses?: string[];

  /**
   * 最小 Stars
   */
  minStars?: number;

  /**
   * 最大 Stars
   */
  maxStars?: number;

  /**
   * 最小下载量
   */
  minDownloads?: number;

  /**
   * 最大下载量
   */
  maxDownloads?: number;

  /**
   * 版本范围
   */
  versionRange?: {
    min: string;
    max: string;
  };

  /**
   * 时间范围
   */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 技能元数据扩展
 */
export interface SkillDataExtended extends SkillData {
  stars?: number;
  downloads?: number;
  author?: string;
  license?: string;
  version?: string;
  compatibility?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 过滤器
 */
export class FilterEngine {
  /**
   * 过滤搜索结果
   * @param results 搜索结果
   * @param extendedSkills 技能扩展数据
   * @param options 过滤选项
   */
  filter(
    results: SearchResult[],
    extendedSkills: Map<string, SkillDataExtended>,
    options: FilterOptions
  ): SearchResult[] {
    return results.filter((result) => {
      const skill = extendedSkills.get(result.skillId);
      if (!skill) return false;

      return this.matches(result, skill, options);
    });
  }

  /**
   * 检查是否匹配过滤条件
   */
  private matches(
    result: SearchResult,
    skill: SkillDataExtended,
    options: FilterOptions
  ): boolean {
    // 分类过滤
    if (options.categories && options.categories.length > 0) {
      const matchesCategory = skill.categories.some((cat) =>
        options.categories!.includes(cat)
      );
      if (!matchesCategory) return false;
    }

    // 关键词过滤
    if (options.keywords && options.keywords.length > 0) {
      const matchesKeyword = skill.keywords.some((kw) =>
        options.keywords!.includes(kw)
      );
      if (!matchesKeyword) return false;
    }

    // 兼容平台过滤
    if (options.compatibility && options.compatibility.length > 0) {
      const matchesCompat = skill.compatibility?.some((compat) =>
        options.compatibility!.includes(compat)
      );
      if (!matchesCompat) return false;
    }

    // 作者过滤
    if (options.authors && options.authors.length > 0) {
      if (!skill.author || !options.authors.includes(skill.author)) {
        return false;
      }
    }

    // 许可证过滤
    if (options.licenses && options.licenses.length > 0) {
      if (!skill.license || !options.licenses.includes(skill.license)) {
        return false;
      }
    }

    // Stars 范围过滤
    if (options.minStars !== undefined && skill.stars !== undefined) {
      if (skill.stars < options.minStars) return false;
    }
    if (options.maxStars !== undefined && skill.stars !== undefined) {
      if (skill.stars > options.maxStars) return false;
    }

    // 下载量范围过滤
    if (options.minDownloads !== undefined && skill.downloads !== undefined) {
      if (skill.downloads < options.minDownloads) return false;
    }
    if (options.maxDownloads !== undefined && skill.downloads !== undefined) {
      if (skill.downloads > options.maxDownloads) return false;
    }

    // 时间范围过滤
    if (options.dateRange) {
      if (skill.updatedAt) {
        if (skill.updatedAt < options.dateRange.start || skill.updatedAt > options.dateRange.end) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 构建过滤建议
   * @param results 搜索结果
   * @param extendedSkills 技能扩展数据
   */
  getFilterSuggestions(
    results: SearchResult[],
    extendedSkills: Map<string, SkillDataExtended>
  ): {
    categories: Map<string, number>;
    keywords: Map<string, number>;
    compatibility: Map<string, number>;
    authors: Map<string, number>;
    licenses: Map<string, number>;
  } {
    const categories = new Map<string, number>();
    const keywords = new Map<string, number>();
    const compatibility = new Map<string, number>();
    const authors = new Map<string, number>();
    const licenses = new Map<string, number>();

    for (const result of results) {
      const skill = extendedSkills.get(result.skillId);
      if (!skill) continue;

      // 统计分类
      for (const category of skill.categories) {
        categories.set(category, (categories.get(category) || 0) + 1);
      }

      // 统计关键词
      for (const keyword of skill.keywords) {
        keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
      }

      // 统计兼容平台
      for (const compat of skill.compatibility || []) {
        compatibility.set(compat, (compatibility.get(compat) || 0) + 1);
      }

      // 统计作者
      if (skill.author) {
        authors.set(skill.author, (authors.get(skill.author) || 0) + 1);
      }

      // 统计许可证
      if (skill.license) {
        licenses.set(skill.license, (licenses.get(skill.license) || 0) + 1);
      }
    }

    return { categories, keywords, compatibility, authors, licenses };
  }

  /**
   * 自动分类（基于关键词和描述）
   * @param skill 技能数据
   */
  autoCategorize(skill: SkillData): string[] {
    const categories: string[] = [];
    const text = `${skill.name} ${skill.description} ${skill.keywords.join(' ')}`.toLowerCase();

    const categoryRules = [
      { name: '工具', keywords: ['tool', 'utility', 'helper', 'helper', 'helper'] },
      { name: '搜索', keywords: ['search', 'find', 'query', 'search'] },
      { name: '集成', keywords: ['integration', 'api', 'connector', 'webhook'] },
      { name: '数据分析', keywords: ['data', 'analysis', 'analytics', 'ml'] },
      { name: '文档', keywords: ['document', 'markdown', 'writing', 'editor'] },
      { name: '通信', keywords: ['chat', 'message', 'notification', 'slack', 'discord'] },
      { name: '安全', keywords: ['security', 'auth', 'encrypt', 'protect'] },
      { name: '开发', keywords: ['code', 'dev', 'programming', 'developer'] },
    ];

    for (const category of categoryRules) {
      if (category.keywords.some((keyword) => text.includes(keyword))) {
        categories.push(category.name);
      }
    }

    return categories.length > 0 ? categories : ['其他'];
  }
}