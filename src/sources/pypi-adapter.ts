/**
 * P0-08: PyPI 技能源适配器
 * 从 PyPI 发现和同步 Agent 技能包
 */

import type { SourceAdapter, SourceSkill, SyncProgress } from './types';
import axios from 'axios';

export interface PyPIAdapterConfig {
  baseUrl: string;
  searchClassifiers: string[];
}

const DEFAULT_CONFIG: Required<PyPIAdapterConfig> = {
  baseUrl: 'https://pypi.org',
  searchClassifiers: ['agent-skill', 'ai-agent', 'langchain-tool', 'mcp-server'],
};

export class PyPIAdapter implements SourceAdapter {
  readonly name = 'PyPI';
  readonly type = 'pypi' as const;
  private config: Required<PyPIAdapterConfig>;

  constructor(config: Partial<PyPIAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    await this.healthCheck();
  }

  async search(query: string, limit = 20): Promise<SourceSkill[]> {
    // PyPI 使用 XMLRPC 或简单 API，这里用 warehouse JSON API
    try {
      const res = await axios.get(`${this.config.baseUrl}/search/`, {
        params: { q: query, per_page: limit },
        headers: { Accept: 'application/json' },
        timeout: 10_000,
      });
      // PyPI search 返回 HTML，需要用 JSON API 逐包查询
      // 退而求其次：用 pypi.org/simple/ + 名称猜测
      return this.searchViaNames(query, limit);
    } catch {
      return this.searchViaNames(query, limit);
    }
  }

  private async searchViaNames(query: string, limit: number): Promise<SourceSkill[]> {
    const candidates = this.config.searchClassifiers.flatMap(c => [
      `${c}-${query}`,
      `${query}-${c}`,
      query,
    ]);
    const seen = new Set<string>();
    const results: SourceSkill[] = [];

    for (const name of candidates) {
      if (results.length >= limit) break;
      if (seen.has(name)) continue;
      seen.add(name);
      const skill = await this.getSkill(name);
      if (skill) results.push(skill);
    }
    return results;
  }

  async getSkill(id: string): Promise<SourceSkill | null> {
    const pkgName = id.includes('/') ? id.split('/').pop()! : id;
    try {
      const res = await axios.get(`${this.config.baseUrl}/pypi/${encodeURIComponent(pkgName)}/json`, {
        timeout: 10_000,
      });
      return this.mapPyPIPackage(res.data);
    } catch {
      return null;
    }
  }

  async list(page: number, pageSize: number): Promise<{ skills: SourceSkill[]; total: number }> {
    // PyPI 没有分页列出所有包的 JSON API，用搜索代替
    const allSkills: SourceSkill[] = [];
    let total = 0;

    for (const classifier of this.config.searchClassifiers) {
      const skills = await this.searchViaNames(classifier, pageSize);
      allSkills.push(...skills);
      total += skills.length;
    }

    const offset = (page - 1) * pageSize;
    return {
      skills: allSkills.slice(offset, offset + pageSize),
      total,
    };
  }

  async sync(_since?: Date): Promise<SyncProgress> {
    const progress: SyncProgress = { total: 0, processed: 0, added: 0, updated: 0, failed: 0, errors: [] };

    for (const classifier of this.config.searchClassifiers) {
      try {
        const skills = await this.searchViaNames(classifier, 100);
        progress.total += skills.length;
        progress.processed += skills.length;
        progress.added += skills.length;
      } catch (err) {
        progress.failed++;
        progress.errors.push(`PyPI sync classifier=${classifier}: ${String(err)}`);
      }
    }
    return progress;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/pypi/pip/json`, { timeout: 5_000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  private mapPyPIPackage(raw: Record<string, unknown>): SourceSkill {
    const info = (raw.info ?? {}) as Record<string, unknown>;
    const name = String(info.name ?? '');
    const namespace = 'pypi';

    return {
      id: `${namespace}/${name}`,
      name,
      namespace,
      description: String(info.summary ?? info.description ?? '').slice(0, 500),
      author: String(info.author ?? info.maintainer ?? ''),
      version: String(info.version ?? '0.0.0'),
      license: String(info.license ?? 'Unknown'),
      keywords: typeof info.keywords === 'string'
        ? (info.keywords as string).split(',').map(k => k.trim()).filter(Boolean)
        : [],
      categories: ['pypi-package'],
      homepage: info.home_page ? String(info.home_page) : null,
      repository: info.project_url ? String(info.project_url) : null,
      stars: 0,
      downloads: 0,
      sourceType: 'pypi',
      sourceUrl: `${this.config.baseUrl}/project/${encodeURIComponent(name)}/`,
      lastUpdated: new Date(),
    };
  }
}
