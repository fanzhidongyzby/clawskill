/**
 * 实时数据索引服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealtimeIndexService, InMemoryCacheManager, GitHubWebhookPayload } from './index-service';

describe('RealtimeIndexService', () => {
  let service: RealtimeIndexService;

  beforeEach(() => {
    service = new RealtimeIndexService();
  });

  describe('handleWebhook', () => {
    const mockPayload: GitHubWebhookPayload = {
      repository: {
        full_name: 'openclaw/weather-skill',
        html_url: 'https://github.com/openclaw/weather-skill',
        name: 'weather-skill',
        owner: { login: 'openclaw' },
      },
      sender: { login: 'developer' },
      ref: 'refs/heads/main',
      head_commit: {
        id: 'abc123',
        message: 'Update skill',
        timestamp: '2026-03-31T00:00:00Z',
        added: ['SKILL.md'],
        modified: [],
        removed: [],
      },
    };

    it('should accept push event', async () => {
      const result = await service.handleWebhook('push', mockPayload);

      expect(result.accepted).toBe(true);
      expect(result.jobId).toBeDefined();
    });

    it('should accept release event', async () => {
      const releasePayload: GitHubWebhookPayload = {
        ...mockPayload,
        release: {
          tag_name: 'v1.0.0',
          name: 'Release 1.0.0',
          body: 'Release notes',
        },
      };

      const result = await service.handleWebhook('release', releasePayload);

      expect(result.accepted).toBe(true);
    });

    it('should accept pull_request event', async () => {
      const prPayload: GitHubWebhookPayload = {
        ...mockPayload,
        pull_request: {
          number: 42,
          title: 'Update skill',
          merged: true,
        },
        action: 'closed',
      };

      const result = await service.handleWebhook('pull_request', prPayload);

      expect(result.accepted).toBe(true);
    });

    it('should reject unsupported event', async () => {
      const result = await service.handleWebhook('issues', mockPayload);

      expect(result.accepted).toBe(false);
      expect(result.message).toContain('Unsupported event');
    });

    it('should reject payload without repository', async () => {
      const invalidPayload = { sender: { login: 'test' } } as GitHubWebhookPayload;

      const result = await service.handleWebhook('push', invalidPayload);

      expect(result.accepted).toBe(false);
    });
  });

  describe('processJob', () => {
    it('should process job successfully', async () => {
      const job = {
        id: 'test-job-1',
        type: 'skill-update' as const,
        skillId: 'github:openclaw/weather-skill',
        repository: 'openclaw/weather-skill',
        timestamp: new Date(),
        priority: 'normal' as const,
        payload: {
          repository: {
            full_name: 'openclaw/weather-skill',
            html_url: 'https://github.com/openclaw/weather-skill',
            name: 'weather-skill',
            owner: { login: 'openclaw' },
          },
          sender: { login: 'developer' },
        },
      };

      const result = await service.processJob(job);

      expect(result.skillId).toBe('github:openclaw/weather-skill');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.steps.parse.success).toBe(true);
      expect(result.steps.cacheInvalidation.success).toBe(true);
    });

    it('should emit events during processing', async () => {
      const job = {
        id: 'test-job-2',
        type: 'skill-create' as const,
        skillId: 'github:test/new-skill',
        repository: 'test/new-skill',
        timestamp: new Date(),
        priority: 'normal' as const,
        payload: {
          repository: {
            full_name: 'test/new-skill',
            html_url: 'https://github.com/test/new-skill',
            name: 'new-skill',
            owner: { login: 'test' },
          },
          sender: { login: 'developer' },
        },
      };

      const startedSpy = vi.fn();
      const completedSpy = vi.fn();

      service.on('job:started', startedSpy);
      service.on('job:completed', completedSpy);

      await service.processJob(job);

      expect(startedSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalled();
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', () => {
      const status = service.getQueueStatus();

      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('processing');
      expect(typeof status.pending).toBe('number');
      expect(typeof status.processing).toBe('number');
    });
  });
});

describe('InMemoryCacheManager', () => {
  let cache: InMemoryCacheManager;

  beforeEach(() => {
    cache = new InMemoryCacheManager();
  });

  describe('set and get', () => {
    it('should store and retrieve data', async () => {
      await cache.set('skill-1', { name: 'test' });
      const data = await cache.get('skill-1');

      expect(data).toEqual({ name: 'test' });
    });

    it('should return null for non-existent key', async () => {
      const data = await cache.get('non-existent');

      expect(data).toBeNull();
    });

    it('should respect TTL', async () => {
      await cache.set('skill-2', { name: 'test' }, 100); // 100ms TTL

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const data = await cache.get('skill-2');

      expect(data).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove cached data', async () => {
      await cache.set('skill-3', { name: 'test' });
      await cache.invalidate('skill-3');

      const data = await cache.get('skill-3');

      expect(data).toBeNull();
    });

    it('should invalidate related keys', async () => {
      await cache.set('skill-4', { name: 'test' });
      await cache.set('search:skill-4', { results: [] });
      await cache.set('metadata:skill-4', { meta: true });

      await cache.invalidate('skill-4');

      expect(await cache.get('skill-4')).toBeNull();
      expect(await cache.get('search:skill-4')).toBeNull();
      expect(await cache.get('metadata:skill-4')).toBeNull();
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate matching keys', async () => {
      await cache.set('skill-5', { name: 'test1' });
      await cache.set('skill-6', { name: 'test2' });
      await cache.set('other-key', { name: 'test3' });

      await cache.invalidatePattern('skill-*');

      expect(await cache.get('skill-5')).toBeNull();
      expect(await cache.get('skill-6')).toBeNull();
      expect(await cache.get('other-key')).not.toBeNull();
    });
  });
});

describe('Index Job Processing', () => {
  let service: RealtimeIndexService;

  beforeEach(() => {
    service = new RealtimeIndexService();
  });

  it('should determine correct job type for push', async () => {
    const createPayload: GitHubWebhookPayload = {
      repository: {
        full_name: 'test/skill',
        html_url: 'https://github.com/test/skill',
        name: 'skill',
        owner: { login: 'test' },
      },
      sender: { login: 'developer' },
      head_commit: {
        id: 'abc',
        message: 'Create skill',
        timestamp: '2026-03-31T00:00:00Z',
        added: ['SKILL.md'],
        modified: [],
        removed: [],
      },
    };

    const result = await service.handleWebhook('push', createPayload);
    expect(result.accepted).toBe(true);
  });

  it('should handle delete job type', async () => {
    const deletePayload: GitHubWebhookPayload = {
      repository: {
        full_name: 'test/skill',
        html_url: 'https://github.com/test/skill',
        name: 'skill',
        owner: { login: 'test' },
      },
      sender: { login: 'developer' },
      head_commit: {
        id: 'abc',
        message: 'Delete skill',
        timestamp: '2026-03-31T00:00:00Z',
        added: [],
        modified: [],
        removed: ['SKILL.md'],
      },
    };

    const result = await service.handleWebhook('push', deletePayload);
    expect(result.accepted).toBe(true);
  });

  it('should prioritize release events', async () => {
    const releasePayload: GitHubWebhookPayload = {
      repository: {
        full_name: 'test/skill',
        html_url: 'https://github.com/test/skill',
        name: 'skill',
        owner: { login: 'test' },
      },
      sender: { login: 'developer' },
      release: {
        tag_name: 'v1.0.0',
        name: 'Release',
      },
    };

    const result = await service.handleWebhook('release', releasePayload);
    expect(result.accepted).toBe(true);
  });
});