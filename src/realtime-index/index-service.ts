/**
 * 实时数据索引架构
 *
 * 功能：
 * - GitHub Webhook 处理（push, release, pull_request）
 * - 增量索引更新（Elasticsearch + Weaviate）
 * - 多层缓存失效（Redis）
 *
 * 性能指标：
 * - Webhook 接收：< 10ms
 * - 安全扫描：1-3 秒
 * - Embedding 生成：< 500ms
 * - 索引写入：< 200ms
 * - 总延迟：< 5 秒
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EventEmitter } from 'events';
import { Worker, Job, Queue } from 'bullmq';

/**
 * GitHub Webhook Payload 类型
 */
export interface GitHubWebhookPayload {
  repository: {
    full_name: string;
    html_url: string;
    name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    login: string;
  };
  ref?: string;
  head_commit?: {
    id: string;
    message: string;
    timestamp: string;
    added?: string[];
    modified?: string[];
    removed?: string[];
  };
  release?: {
    tag_name: string;
    name: string;
    body?: string;
  };
  pull_request?: {
    number: number;
    title: string;
    merged: boolean;
  };
  action?: string;
}

/**
 * 索引任务
 */
export interface IndexJob {
  id: string;
  type: 'skill-update' | 'skill-create' | 'skill-delete';
  skillId: string;
  repository: string;
  timestamp: Date;
  priority: 'high' | 'normal' | 'low';
  payload: GitHubWebhookPayload;
}

/**
 * 索引结果
 */
export interface IndexResult {
  skillId: string;
  success: boolean;
  indexedAt: Date;
  duration: number;
  steps: {
    parse: { success: boolean; duration: number };
    securityScan: { success: boolean; duration: number; findings?: string[] };
    embedding: { success: boolean; duration: number };
    elasticsearch: { success: boolean; duration: number };
    weaviate: { success: boolean; duration: number };
    cacheInvalidation: { success: boolean; duration: number };
  };
  errors?: string[];
}

/**
 * 缓存管理器
 */
export interface CacheManager {
  invalidate(skillId: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
  get(skillId: string): Promise<unknown>;
  set(skillId: string, data: unknown, ttl?: number): Promise<void>;
}

/**
 * 默认内存缓存管理器
 */
export class InMemoryCacheManager implements CacheManager {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private defaultTTL = 3600000; // 1 hour in ms

  async invalidate(skillId: string): Promise<void> {
    this.cache.delete(skillId);
    this.cache.delete(`search:${skillId}`);
    this.cache.delete(`metadata:${skillId}`);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async get(skillId: string): Promise<unknown> {
    const entry = this.cache.get(skillId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(skillId);
      return null;
    }
    return entry.data;
  }

  async set(skillId: string, data: unknown, ttl: number = this.defaultTTL): Promise<void> {
    this.cache.set(skillId, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }
}

/**
 * 实时索引服务
 */
export class RealtimeIndexService extends EventEmitter {
  private cacheManager: CacheManager;
  private jobQueue: Map<string, IndexJob> = new Map();
  private processing: Set<string> = new Set();

  constructor(cacheManager?: CacheManager) {
    super();
    this.cacheManager = cacheManager || new InMemoryCacheManager();
  }

  /**
   * 处理 GitHub Webhook
   */
  async handleWebhook(
    event: string,
    payload: GitHubWebhookPayload
  ): Promise<{ accepted: boolean; jobId?: string; message?: string }> {
    const startTime = Date.now();

    // 验证事件类型
    const supportedEvents = ['push', 'release', 'pull_request'];
    if (!supportedEvents.includes(event)) {
      return { accepted: false, message: `Unsupported event: ${event}` };
    }

    // 解析技能信息
    const skillId = this.parseSkillId(payload);
    if (!skillId) {
      return { accepted: false, message: 'Could not parse skill ID from payload' };
    }

    // 确定任务类型
    const jobType = this.determineJobType(event, payload);

    // 创建索引任务
    const job: IndexJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      skillId,
      repository: payload.repository.full_name,
      timestamp: new Date(),
      priority: this.determinePriority(event),
      payload,
    };

    // 加入队列
    this.jobQueue.set(job.id, job);

    // 触发异步处理
    this.processJob(job).catch(err => {
      this.emit('error', { jobId: job.id, error: err });
    });

    const duration = Date.now() - startTime;
    this.emit('webhook:received', { event, skillId, jobId: job.id, duration });

    return { accepted: true, jobId: job.id };
  }

  /**
   * 处理索引任务
   */
  async processJob(job: IndexJob): Promise<IndexResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    if (this.processing.has(job.skillId)) {
      throw new Error(`Skill ${job.skillId} is already being processed`);
    }

    this.processing.add(job.skillId);
    this.emit('job:started', { jobId: job.id, skillId: job.skillId });

    const steps = {
      parse: { success: false, duration: 0 },
      securityScan: { success: false, duration: 0 },
      embedding: { success: false, duration: 0 },
      elasticsearch: { success: false, duration: 0 },
      weaviate: { success: false, duration: 0 },
      cacheInvalidation: { success: false, duration: 0 },
    };

    try {
      // Step 1: Parse SKILL.md
      const parseStart = Date.now();
      const skillData = await this.parseSkillMd(job);
      steps.parse = { success: true, duration: Date.now() - parseStart };

      // Step 2: Security Scan
      const securityStart = Date.now();
      const securityResult = await this.runSecurityScan(job.skillId, skillData);
      steps.securityScan = {
        success: securityResult.passed,
        duration: Date.now() - securityStart,
        findings: securityResult.findings,
      };

      if (!securityResult.passed && securityResult.findings?.length > 0) {
        errors.push(`Security scan failed: ${securityResult.findings.join(', ')}`);
      }

      // Step 3: Generate Embedding
      const embeddingStart = Date.now();
      const embedding = await this.generateEmbedding(skillData);
      steps.embedding = { success: !!embedding, duration: Date.now() - embeddingStart };

      // Step 4: Write to Elasticsearch
      const esStart = Date.now();
      const esResult = await this.writeToElasticsearch(job.skillId, skillData);
      steps.elasticsearch = { success: esResult, duration: Date.now() - esStart };

      // Step 5: Write to Weaviate
      const weaviateStart = Date.now();
      const weaviateResult = await this.writeToWeaviate(job.skillId, skillData, embedding);
      steps.weaviate = { success: weaviateResult, duration: Date.now() - weaviateStart };

      // Step 6: Cache Invalidation
      const cacheStart = Date.now();
      await this.cacheManager.invalidate(job.skillId);
      steps.cacheInvalidation = { success: true, duration: Date.now() - cacheStart };

    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.processing.delete(job.skillId);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0 && Object.values(steps).every(s => s.success);

    const result: IndexResult = {
      skillId: job.skillId,
      success,
      indexedAt: new Date(),
      duration,
      steps,
      errors: errors.length > 0 ? errors : undefined,
    };

    this.emit('job:completed', { jobId: job.id, result });
    this.jobQueue.delete(job.id);

    return result;
  }

  /**
   * 解析技能 ID
   */
  private parseSkillId(payload: GitHubWebhookPayload): string | null {
    const { repository } = payload;
    if (!repository?.full_name) return null;
    return `github:${repository.full_name}`;
  }

  /**
   * 确定任务类型
   */
  private determineJobType(
    event: string,
    payload: GitHubWebhookPayload
  ): IndexJob['type'] {
    if (event === 'push') {
      if (payload.head_commit?.removed?.includes('SKILL.md')) {
        return 'skill-delete';
      }
      return payload.head_commit?.added?.includes('SKILL.md')
        ? 'skill-create'
        : 'skill-update';
    }
    if (event === 'release') {
      return 'skill-update';
    }
    if (event === 'pull_request') {
      return payload.pull_request?.merged ? 'skill-update' : 'skill-update';
    }
    return 'skill-update';
  }

  /**
   * 确定优先级
   */
  private determinePriority(event: string): IndexJob['priority'] {
    if (event === 'release') return 'high';
    if (event === 'push') return 'normal';
    return 'low';
  }

  /**
   * 解析 SKILL.md（模拟）
   */
  private async parseSkillMd(job: IndexJob): Promise<Record<string, unknown>> {
    // 实际实现应从 GitHub API 获取 SKILL.md 并解析
    await this.simulateLatency(100);
    return {
      id: job.skillId,
      name: job.repository.split('/')[1],
      namespace: job.repository.split('/')[0],
      repository: `https://github.com/${job.repository}`,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 运行安全扫描（模拟）
   */
  private async runSecurityScan(
    skillId: string,
    skillData: Record<string, unknown>
  ): Promise<{ passed: boolean; findings?: string[] }> {
    await this.simulateLatency(1000); // 1-3 seconds

    // 模拟安全扫描
    const findings: string[] = [];
    const random = Math.random();

    if (random > 0.9) {
      findings.push('Potential sensitive data in configuration');
    }
    if (random > 0.95) {
      findings.push('Outdated dependency detected');
    }

    return {
      passed: findings.length === 0,
      findings: findings.length > 0 ? findings : undefined,
    };
  }

  /**
   * 生成 Embedding（模拟）
   */
  private async generateEmbedding(
    skillData: Record<string, unknown>
  ): Promise<number[] | null> {
    await this.simulateLatency(300);

    // 模拟生成 1536 维向量
    const embedding: number[] = [];
    for (let i = 0; i < 1536; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    return embedding;
  }

  /**
   * 写入 Elasticsearch（模拟）
   */
  private async writeToElasticsearch(
    skillId: string,
    skillData: Record<string, unknown>
  ): Promise<boolean> {
    await this.simulateLatency(100);
    // 实际实现应调用 Elasticsearch bulk API
    return true;
  }

  /**
   * 写入 Weaviate（模拟）
   */
  private async writeToWeaviate(
    skillId: string,
    skillData: Record<string, unknown>,
    embedding: number[] | null
  ): Promise<boolean> {
    await this.simulateLatency(100);
    // 实际实现应调用 Weaviate batch import
    return true;
  }

  /**
   * 模拟延迟
   */
  private async simulateLatency(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { pending: number; processing: number } {
    return {
      pending: this.jobQueue.size,
      processing: this.processing.size,
    };
  }

  /**
   * 获取缓存管理器
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }
}

// 导出单例
export const realtimeIndexService = new RealtimeIndexService();