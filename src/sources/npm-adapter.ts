/**
 * P0-07: NPM 技能源适配器
 * 从 NPM Registry 发现和同步 Agent 技能包
 */

import type { SourceAdapter, SourceSkill, SyncProgress } from './types';
import axios from 'axios';

export interface NPMAdapterConfig {
  registryUrl: string;
  /** 搜索关键词前缀，用于过滤 agent 相关包 */
  searchScopes: string[];
}

const DEFAULT_CONFIG: Required<NPMAdapterConfig> = {
  registryUrl: 'https://registry.npmjs.org',
  searchScopes: ['@openclaw', '@agentskill', '@clawskill', 'agent-skill-'],
};

export class NPMAdapter implements SourceAdapter {
  readonly name = 'NPM Registry';
  readonly type = 'npm' as const;
  private config: Required<NPMAdapterConfig>;

  constructor(config: Partial<NPMAdapterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    await this.healthCheck();
  }

  async search(query: string, limit = 20): Promise<SourceSkill[]> {
    try {
      const url = `https://registry.npmjs.org/-/v1/search`;
      const res = await axios.get(url, {
        params: { text: `${query} keywords:agent-skill`, size: limit },
        timeout: 10_000,
      });
      return (res.data.objects ?? []).map(
        (o: { package: Record<string, unknown> }) => this.mapNPMPackage(o.package),
      );
    } catch {
      return [];
    }
  }

  async getSkill(id: string): Promise<SourceSkill | null> {
    try {
      const pkgName = id.includes('/') ? id.split('/').pop()! : id;
      const res = await axios.get(`${this.config.registryUrl}/${encodeURIComponent(pkgName)}`, {
        timeout: 10_000,
      });
      return this.mapNPMPackage(res.data);
    } catch {
      return null;
    }
  }

  async list(page: number, pageSize: number): Promise<{ skills: SourceSkill[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const allSkills: SourceSkill[] = [];
    let total = 0;

    for (const scope of this.config.searchScopes) {
      try {
        const res = await axios.get('https://registry.npmjs.org/-/v1/search', {
          params: { text: scope, size: pageSize, from: offset },
          timeout: 10_000,
        });
        total += res.data.total ?? 0;
        const skills = (res.data.objects ?? []).map(
          (o: { package: Record<string, unknown> }) => this.mapNPMPackage(o.package),
        );
        allSkills.push(...skills);
      } catch {
        // continue with next scope
      }
    }

    return { skills: allSkills.slice(0, pageSize), total };
  }

  async sync(since?: Date): Promise<SyncProgress> {
    const progress: SyncProgress = { total: 0, processed: 0, added: 0, updated: 0, failed: 0, errors: [] };

    for (const scope of this.config.searchScopes) {
      let from = 0;
      const size = 250;
      let hasMore = true;

      while (hasMore) {
        try {
          const params: Record<string, unknown> = { text: scope, size, from };
          const res = await axios.get('https://registry.npmjs.org/-/v1/search', {
            params,
            timeout: 30_000,
          });
          const objects = res.data.objects ?? [];
          progress.total += res.data.total ?? 0;

          for (const obj of objects) {
            const pkg = obj.package as Record<string, unknown>;
            if (since) {
              const modified = new Date(String(pkg.date ?? ''));
              if (modified < since) continue;
            }
            progress.processed++;
            progress.added++;
          }
          hasMore = objects.length === size;
          from += size;
        } catch (err) {
          progress.failed++;
          progress.errors.push(`NPM sync scope=${scope} from=${from}: ${String(err)}`);
          hasMore = false;
        }
      }
    }
    return progress;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.config.registryUrl}/`, { timeout: 5_000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  private mapNPMPackage(raw: Record<string, unknown>): SourceSkill {
    const fullName = String(raw.name ?? '');
    // @scope/name → scope/name ; plain-name → npm/plain-name
    let namespace = 'npm';
    let name = fullName;
    if (fullName.startsWith('@')) {
      const parts = fullName.slice(1).split('/');
      namespace = parts[0] ?? 'npm';
      name = parts[1] ?? fullName;
    }

    const distTags = (raw['dist-tags'] ?? {}) as Record<string, string>;
    const latestVersion = String(distTags.latest ?? raw.version ?? '0.0.0');

    return {
      id: `${namespace}/${name}`,
      name,
      namespace,
      description: String(raw.description ?? ''),
      author: typeof raw.author === 'object' && raw.author
        ? String((raw.author as Record<string, string>).name ?? '')
        : String(raw.author ?? ''),
      version: latestVersion,
      license: String(raw.license ?? 'MIT'),
      keywords: Array.isArray(raw.keywords) ? raw.keywords as string[] : [],
      categories: ['npm-package'],
      homepage: raw.homepage ? String(raw.homepage) : null,
      repository: raw.repository
        ? (typeof raw.repository === 'object'
          ? String((raw.repository as Record<string, string>).url ?? '')
          : String(raw.repository))
        : null,
      stars: 0,
      downloads: 0,
      sourceType: 'npm',
      sourceUrl: `https://www.npmjs.com/package/${encodeURIComponent(fullName)}`,
      lastUpdated: raw.date ? new Date(String(raw.date)) : new Date(),
    };
  }
}
