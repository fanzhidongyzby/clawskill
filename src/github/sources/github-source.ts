/**
 * GitHub 技能源适配器
 * 通过 GitHub API 获取技能仓库和 SKILL.md 文件
 */
import { Octokit } from 'octokit';
import {
  Source,
  ListOptions,
  SkillInfo,
  SkillDetail,
  VersionInfo,
  SkillMD,
  SourceEvent,
} from '../types/source';
import { SkillMDParser } from '../parser/skill-md-parser';

/**
 * GitHub 源配置
 */
export interface GitHubSourceConfig {
  /**
   * GitHub Token（用于认证，提高速率限制）
   */
  token?: string;

  /**
   * 搜索组织或用户
   */
  org?: string;

  /**
   * 仓库主题过滤（包含此关键词的仓库）
   */
  topic?: string;

  /**
   * 语言过滤
   */
  language?: string;

  /**
   * 最小 stars 数量
   */
  minStars?: number;

  /**
   * 是否包含 fork 的仓库
   */
  includeForks?: boolean;
}

/**
 * GitHub Source 实现
 */
export class GitHubSource implements Source {
  private octokit: Octokit;
  private config: Required<GitHubSourceConfig>;
  private parser: SkillMDParser;

  constructor(config: GitHubSourceConfig = {}) {
    this.config = {
      token: config.token || '',
      org: config.org || '',
      topic: config.topic || 'agent-skill',
      language: config.language || 'TypeScript',
      minStars: config.minStars || 0,
      includeForks: config.includeForks || false,
    };

    this.octokit = new Octokit({
      auth: this.config.token || undefined,
    });

    this.parser = new SkillMDParser();
  }

  id(): string {
    return 'github';
  }

  name(): string {
    return 'GitHub';
  }

  /**
   * 列出 GitHub 技能仓库
   */
  async listSkills(opts: ListOptions = {}): Promise<SkillInfo[]> {
    const query = this.buildSearchQuery(opts);

    let allSkills: SkillInfo[] = [];
    let page = opts.page || 1;
    let hasMore = true;

    // GitHub Search API 最多返回 1000 个结果
    while (hasMore && allSkills.length < 100) {
      const response = await this.octokit.rest.search.repos({
        q: query,
        page,
        per_page: opts.size || 30,
        sort: opts.sort === 'stars' ? 'stars' : 'updated',
        order: 'desc',
      });

      const skills = response.data.items.map((item) => this.convertToSkillInfo(item));
      allSkills = allSkills.concat(skills);

      hasMore = skills.length > 0 && allSkills.length < response.data.total_count;
      page++;
    }

    return allSkills;
  }

  /**
   * 获取技能详情
   */
  async getSkill(skillId: string): Promise<SkillDetail> {
    const [owner, repo] = skillId.split('/');

    const { data: repoData } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    // 获取 topics
    let topics: string[] = [];
    try {
      const topicsData = await this.octokit.rest.repos.getAllTopics({
        owner,
        repo,
      });
      topics = topicsData.data.names || [];
    } catch (error) {
      // 忽略 topics 获取失败
    }

    return this.convertToSkillDetail(repoData, topics);
  }

  /**
   * 获取技能版本列表（Git Tags）
   */
  async listVersions(skillId: string): Promise<VersionInfo[]> {
    const [owner, repo] = skillId.split('/');

    const { data: tags } = await this.octokit.rest.repos.listTags({
      owner,
      repo,
      per_page: 100,
    });

    return tags.map((tag) => ({
      version: tag.name.replace(/^v/, ''),
      description: tag.commit.message || '',
      publishedAt: new Date(tag.commit.sha ? '' : tag.commit.url ? '' : Date.now()),
      isPreRelease: tag.name.includes('-') || tag.name.includes('alpha') || tag.name.includes('beta'),
      commitSha: tag.commit.sha,
    }));
  }

  /**
   * 获取 SKILL.md 内容
   */
  async getSkillMD(skillId: string, version?: string): Promise<SkillMD> {
    const [owner, repo] = skillId.split('/');

    let ref: string | undefined;
    if (version) {
      ref = `v${version}`;
    }

    try {
      const { data: file } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'SKILL.md',
        ref,
      });

      if ('content' in file) {
        const raw = Buffer.from(file.content, 'base64').toString('utf-8');
        const downloadUrl = file.download_url || '';

        // 解析 SKILL.md
        const parsed = this.parser.parse(raw);

        return {
          raw,
          frontmatter: parsed.frontmatter,
          metadata: parsed.metadata,
          downloadUrl,
          hash: parsed.hash,
        };
      }

      throw new Error('SKILL.md not found');
    } catch (error) {
      throw new Error(`Failed to fetch SKILL.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 构建 GitHub 搜索查询
   */
  private buildSearchQuery(opts: ListOptions): string {
    const parts: string[] = [];

    // 主题过滤
    if (this.config.topic) {
      parts.push(`topic:${this.config.topic}`);
    }

    // 语言过滤
    parts.push(`language:${opts.language || this.config.language}`);

    // 组织过滤
    if (this.config.org) {
      parts.push(`user:${this.config.org}`);
    }

    // 关键词搜索
    if (opts.query) {
      parts.push(opts.query);
    }

    // 排除 forks
    if (!this.config.includeForks) {
      parts.push('fork:false');
    }

    // 最小 stars
    if (this.config.minStars > 0) {
      parts.push(`stars:>=${this.config.minStars}`);
    }

    return parts.join(' ');
  }

  /**
   * 转换为 SkillInfo
   */
  private convertToSkillInfo(item: any): SkillInfo {
    return {
      id: `${item.owner.login}/${item.name}`,
      name: item.name,
      namespace: item.owner.login,
      description: item.description || '',
      author: item.owner.login,
      stars: item.stargazers_count,
      updatedAt: new Date(item.updated_at),
      language: item.language,
    };
  }

  /**
   * 转换为 SkillDetail
   */
  private convertToSkillDetail(repo: any, topics: string[]): SkillDetail {
    return {
      id: `${repo.owner.login}/${repo.name}`,
      name: repo.name,
      namespace: repo.owner.login,
      description: repo.description || '',
      author: repo.owner.login,
      stars: repo.stargazers_count,
      updatedAt: new Date(repo.updated_at),
      language: repo.language,
      repository: repo.html_url,
      homepage: repo.homepage || undefined,
      license: repo.license?.name || undefined,
      keywords: topics.filter((t) => !t.includes('agent-skill')),
      categories: topics.filter((t) => t.startsWith('category-')).map((t) => t.replace('category-', '')),
      downloads: 0, // GitHub API 不提供下载次数
      createdAt: new Date(repo.created_at),
      defaultBranch: repo.default_branch || 'main',
    };
  }

  /**
   * 监听 GitHub 事件（通过轮询）
   * 注意：完整的实现需要使用 GitHub Webhooks
   */
  async *watch(): AsyncIterable<SourceEvent> {
    // 简化实现：每分钟检查一次更新
    const interval = 60000; // 1分钟
    const knownSkills = new Map<string, Date>();

    while (true) {
      const skills = await this.listSkills({ size: 50 });

      for (const skill of skills) {
        const lastUpdated = knownSkills.get(skill.id);

        if (!lastUpdated) {
          // 新技能
          yield {
            type: 'skill_added',
            skillId: skill.id,
            timestamp: new Date(),
            data: skill,
          };
        } else if (skill.updatedAt > lastUpdated) {
          // 技能更新
          yield {
            type: 'skill_updated',
            skillId: skill.id,
            timestamp: new Date(),
            data: skill,
          };
        }

        knownSkills.set(skill.id, skill.updatedAt);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}