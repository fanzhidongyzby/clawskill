/**
 * P0-05: ClawHub 技能源适配器
 * 从 ClawHub 平台发现和同步技能
 */

import type { SourceAdapter, SourceSkill, SyncProgress } from './types';
import axios from 'axios';

export interface ClawHubConfig {
  baseUrl: string;
  token?: string;
  syncIntervalMs?: number;
}

const DEFAULT_CONFIG: Required<ClawHubConfig> = {
  baseUrl: 'https://clawhub.com/api/v1',
  token: '',
  syncIntervalMs: 3600_000,
};

export class ClawHubAdapter implements SourceAdapter {
  readonly name = 'ClawHub';
  readonly type = 'clawhub' as const;
  private config: Required<ClawHubConfig>;

  constructor(config: Partial<ClawHubConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    const ok = await this.healthCheck();
    if (!ok) {
      console.warn('[ClawHub] API unreachable, adapter will retry on next sync');
    }
  }

  async search(query: string, limit = 20): Promise<SourceSkill[]> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/skills/search`, {
        params: { q: query, limit },
        headers: this.headers(),
        timeout: 10_000,
      });
      return (res.data.data ?? []).map((s: Record<string, unknown>) => this.mapSkill(s));
    } catch {
      return [];
    }
  }

  async getSkill(id: string): Promise<SourceSkill | null> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/skills/${encodeURIComponent(id)}`, {
        headers: this.headers(),
        timeout: 10_000,
      });
      return this.mapSkill(res.data);
    } catch {
      return null;
    }
  }

  async list(page: number, pageSize: number): Promise<{ skills: SourceSkill[]; total: number }> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/skills`, {
        params: { page, pageSize },
        headers: this.headers(),
        timeout: 10_000,
      });
      return {
        skills: (res.data.data ?? []).map((s: Record<string, unknown>) => this.mapSkill(s)),
        total: res.data.meta?.total ?? 0,
      };
    } catch {
      return { skills: [], total: 0 };
    }
  }

  async sync(since?: Date): Promise<SyncProgress> {
    const progress: SyncProgress = { total: 0, processed: 0, added: 0, updated: 0, failed: 0, errors: [] };
    let page = 1;
    const pageSize = 50;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = since
          ? `${this.config.baseUrl}/skills/updated`
          : `${this.config.baseUrl}/skills`;
        const res = await axios.get(url, {
          params: { page, pageSize, ...(since ? { since: since.toISOString() } : {}) },
          headers: this.headers(),
          timeout: 30_000,
        });
        const items = res.data.data ?? [];
        progress.total = res.data.meta?.total ?? progress.total;
        progress.processed += items.length;
        progress.added += items.length; // 简化：新发现即 added
        hasMore = items.length === pageSize;
        page++;
      } catch (err) {
        progress.failed++;
        progress.errors.push(`ClawHub sync page ${page}: ${String(err)}`);
        hasMore = false;
      }
    }
    return progress;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/health`, { timeout: 5_000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.token) h['Authorization'] = `Bearer ${this.config.token}`;
    return h;
  }

  private mapSkill(raw: Record<string, unknown>): SourceSkill {
    return {
      id: String(raw.id ?? ''),
      name: String(raw.name ?? ''),
      namespace: String(raw.namespace ?? 'clawhub'),
      description: String(raw.description ?? ''),
      author: String(raw.author ?? ''),
      version: String(raw.version ?? '0.0.1'),
      license: String(raw.license ?? 'MIT'),
      keywords: Array.isArray(raw.keywords) ? raw.keywords as string[] : [],
      categories: Array.isArray(raw.categories) ? raw.categories as string[] : [],
      homepage: raw.homepage ? String(raw.homepage) : null,
      repository: raw.repository ? String(raw.repository) : null,
      stars: Number(raw.stars ?? 0),
      downloads: Number(raw.downloads ?? 0),
      sourceType: 'clawhub',
      sourceUrl: `${this.config.baseUrl}/skills/${encodeURIComponent(String(raw.id ?? ''))}`,
      lastUpdated: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
    };
  }
}
