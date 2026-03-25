/**
 * P0-06: MCP Registry 技能源适配器
 * 从 Model Context Protocol Registry 发现和同步 MCP 服务器/工具
 */

import type { SourceAdapter, SourceSkill, SyncProgress } from './types';
import axios from 'axios';

export interface MCPRegistryConfig {
  baseUrl: string;
  token?: string;
}

const DEFAULT_CONFIG: Required<MCPRegistryConfig> = {
  baseUrl: 'https://registry.modelcontextprotocol.io/api/v1',
  token: '',
};

export class MCPRegistryAdapter implements SourceAdapter {
  readonly name = 'MCP Registry';
  readonly type = 'mcp' as const;
  private config: Required<MCPRegistryConfig>;

  constructor(config: Partial<MCPRegistryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    await this.healthCheck();
  }

  async search(query: string, limit = 20): Promise<SourceSkill[]> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/servers/search`, {
        params: { q: query, limit },
        headers: this.headers(),
        timeout: 10_000,
      });
      return (res.data.servers ?? res.data.data ?? []).map(
        (s: Record<string, unknown>) => this.mapMCPServer(s),
      );
    } catch {
      return [];
    }
  }

  async getSkill(id: string): Promise<SourceSkill | null> {
    try {
      const res = await axios.get(
        `${this.config.baseUrl}/servers/${encodeURIComponent(id)}`,
        { headers: this.headers(), timeout: 10_000 },
      );
      return this.mapMCPServer(res.data);
    } catch {
      return null;
    }
  }

  async list(page: number, pageSize: number): Promise<{ skills: SourceSkill[]; total: number }> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/servers`, {
        params: { page, pageSize },
        headers: this.headers(),
        timeout: 10_000,
      });
      const items = res.data.servers ?? res.data.data ?? [];
      return {
        skills: items.map((s: Record<string, unknown>) => this.mapMCPServer(s)),
        total: res.data.meta?.total ?? items.length,
      };
    } catch {
      return { skills: [], total: 0 };
    }
  }

  async sync(since?: Date): Promise<SyncProgress> {
    const progress: SyncProgress = { total: 0, processed: 0, added: 0, updated: 0, failed: 0, errors: [] };
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const params: Record<string, unknown> = { page, pageSize };
        if (since) params.updatedSince = since.toISOString();

        const res = await axios.get(`${this.config.baseUrl}/servers`, {
          params,
          headers: this.headers(),
          timeout: 30_000,
        });
        const items = res.data.servers ?? res.data.data ?? [];
        progress.total = res.data.meta?.total ?? progress.total;
        progress.processed += items.length;
        progress.added += items.length;
        hasMore = items.length === pageSize;
        page++;
      } catch (err) {
        progress.failed++;
        progress.errors.push(`MCP sync page ${page}: ${String(err)}`);
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

  private mapMCPServer(raw: Record<string, unknown>): SourceSkill {
    const name = String(raw.name ?? raw.id ?? '');
    const namespace = String(raw.organization ?? raw.vendor ?? 'mcp');
    return {
      id: `${namespace}/${name}`,
      name,
      namespace,
      description: String(raw.description ?? ''),
      author: String(raw.author ?? raw.vendor ?? ''),
      version: String(raw.version ?? '1.0.0'),
      license: String(raw.license ?? 'MIT'),
      keywords: Array.isArray(raw.tags) ? raw.tags as string[] : [],
      categories: ['mcp-server'],
      homepage: raw.homepage ? String(raw.homepage) : null,
      repository: raw.repository ? String(raw.repository) : null,
      stars: Number(raw.stars ?? 0),
      downloads: Number(raw.downloads ?? 0),
      sourceType: 'mcp',
      sourceUrl: raw.url ? String(raw.url) : `${this.config.baseUrl}/servers/${encodeURIComponent(name)}`,
      lastUpdated: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
    };
  }
}
